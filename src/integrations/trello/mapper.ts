import { Service, ServiceStatus } from '../../types';
import { TrelloCard, TrelloList } from './types';

const parseBrazilianValue = (text: string): number => {
    if (!text) return 0;
    const cleaned = text.replace(/R?\$?\s*/gi, '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
};

/**
 * Parse card title to extract: budget code, client, address, and inline value.
 * 
 * Common title formats:
 * "0001-25 Imobiliária ABC = Rua XYZ, 123 R$ 5.000,00"
 * "0002-25 Cliente Particular = Av. Brasil 456"
 * "(0003-25) Imob. Delta - Rua Tal 789 R$3.500,00"
 * "Imobiliária Teste = Endereço aqui"
 * "0010-26 João Silva = Rua das Flores, 100 apt 201"
 */
function parseTrelloTitle(title: string): {
    code: string;
    client: string;
    address: string;
    inlineValue: number;
} {
    let remaining = title.trim();
    let code = '';
    let client = '';
    let address = '';
    let inlineValue = 0;

    // 1. Extract budget code: patterns like "0001-25", "(0001-25)", "[0001-25]"
    const codeMatch = remaining.match(/[\[(]?(\d{1,4}[-/]\d{2})[\])]?/);
    if (codeMatch) {
        code = codeMatch[1].replace('/', '-');
        remaining = remaining.replace(codeMatch[0], '').trim();
    }

    // 2. Extract inline monetary value: R$ 5.000,00 or similar at end
    const valueMatch = remaining.match(/R?\$\s*([\d.,]+)\s*$/i);
    if (valueMatch) {
        inlineValue = parseBrazilianValue(valueMatch[1]);
        remaining = remaining.replace(valueMatch[0], '').trim();
    }
    // Also try value anywhere in the string if not found at end
    if (inlineValue === 0) {
        const valueMatchAny = remaining.match(/R?\$\s*([\d.,]+)/i);
        if (valueMatchAny) {
            inlineValue = parseBrazilianValue(valueMatchAny[1]);
            remaining = remaining.replace(valueMatchAny[0], '').trim();
        }
    }

    // 3. Split client and address by separator: "=" or " - " (but not inside values)
    // Priority: "=" then " - "
    const separatorMatch = remaining.match(/^(.+?)\s*[=]\s*(.+)$/);
    if (separatorMatch) {
        client = separatorMatch[1].trim();
        address = separatorMatch[2].trim();
    } else {
        const dashMatch = remaining.match(/^(.+?)\s+-\s+(.+)$/);
        if (dashMatch) {
            // Check if second part looks like an address (contains street keywords or numbers)
            const secondPart = dashMatch[2].trim();
            const addressKeywords = /\b(rua|av|avenida|travessa|alameda|praça|rodovia|estrada|condomínio|cond|lote|apt|bloco|qd|quadra|setor|bairro|jardim|jd|vila|res|residencial|ed|edifício|prédio)\b/i;
            if (addressKeywords.test(secondPart) || /\d{2,}/.test(secondPart)) {
                client = dashMatch[1].trim();
                address = secondPart;
            } else {
                client = remaining.trim();
            }
        } else {
            client = remaining.trim();
        }
    }

    // Clean up trailing/leading separators and whitespace
    client = client.replace(/^[-–—:]+|[-–—:]+$/g, '').trim();
    address = address.replace(/^[-–—:]+|[-–—:]+$/g, '').trim();

    return { code, client, address, inlineValue };
}

const getCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('combustível') || d.includes('combustivel') || d.includes('99') || d.includes('uber') || d.includes('gasolina') || d.includes('moto') || d.includes('palio') || d.includes('corsa')) return 'Combustível';
    if (d.includes('almoço') || d.includes('janta') || d.includes('comida') || d.includes('refeição') || d.includes('lanche')) return 'Alimentação';
    if (d.includes('material') || d.includes('materiais') || d.includes('concreto') || d.includes('nf') || d.includes('ferramenta')) return 'Materiais';
    if (d.includes('adiantamento') || d.includes('final') || d.includes('mão de obra') || d.includes('mao de obra')) return 'Mão de Obra';
    if (d.includes('imposto') || d.includes('taxa') || d.includes('maquininha') || d.includes('iss') || d.includes('simples')) return 'Imposto/Taxas';
    return 'Extras';
};

export const mapTrelloCardToService = (
    card: TrelloCard,
    lists: TrelloList[]
): Service => {
    const list = lists.find(l => l.id === card.idList);
    const listName = list ? list.name.trim() : '';
    const listNameLower = listName.toLowerCase();

    let status: ServiceStatus = 'pending';
    let isMonthList = false;

    const months = ['janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    isMonthList = months.some(m => listNameLower.includes(m));

    if (listNameLower.includes('andamento')) {
        status = 'in_progress';
    } else if (listNameLower.includes('pagamento')) {
        status = 'completed';
    } else if (listNameLower.includes('acerto')) {
        status = 'overdue';
    } else if (listNameLower.includes('pago') || listNameLower.includes('concluído')) {
        status = 'paid';
    } else if (isMonthList) {
        status = 'pending';
    }

    const fullText = `${card.name} ${card.desc}`;

    // --- PARSE TITLE into separate fields ---
    const parsed = parseTrelloTitle(card.name);

    // Generate code if not found in title
    let code = parsed.code;
    if (!code) {
        // Try to find code in description
        const descCodeMatch = card.desc.match(/[\[(]?(\d{1,4}[-/]\d{2})[\])]?/);
        if (descCodeMatch) {
            code = descCodeMatch[1].replace('/', '-');
        } else {
            code = `#${card.id.substring(0, 4)}`;
        }
    }

    const client = parsed.client || 'Cliente não identificado';
    const address = parsed.address;

    // --- VALUE EXTRACTION ---
    let value = 0;
    const valueMatch = fullText.match(/Valor Fechado[:\s]*R?\$?\s*([\d.,]+)/i);
    if (valueMatch) value = parseBrazilianValue(valueMatch[1]);
    if (value === 0) value = parsed.inlineValue;

    // Card machine fee
    let cardMachineFee = 0;
    const machineMatch = fullText.match(/Valor Maquininha[:\s]*R?\$?\s*([\d.,]+)/i);
    if (machineMatch) cardMachineFee = parseBrazilianValue(machineMatch[1]);

    // Contractor
    let contractorName = '';
    let contractorValue = 0;
    const contractorMatch = fullText.match(/Valor\s+(?!(?:Fechado|Maquininha))([\wÁ-ú\s]+)[:\s]*R?\$?\s*([\d.,]+)/i);
    if (contractorMatch) {
        contractorName = contractorMatch[1].trim();
        contractorValue = parseBrazilianValue(contractorMatch[2]);
    }

    const expenses: { date: string; value: number; description: string; category: string }[] = [];
    const contractorPayments: { date: string; value: number; type: string }[] = [];

    const paymentRegex = /(\d{2}\/\d{2})\s*-\s*R?\$?\s*([\d.,]+)\s+(Adiantamento|Final)/gi;
    let payMatch;
    while ((payMatch = paymentRegex.exec(fullText)) !== null) {
        const val = parseBrazilianValue(payMatch[2]);
        const type = payMatch[3];
        const date = payMatch[1];
        contractorPayments.push({ date, value: val, type });
        expenses.push({ date, value: val, description: `${contractorName || 'Prestador'} (${type})`, category: 'Mão de Obra' });
    }

    const custosSectionMatch = fullText.match(/Custos:([\s\S]*?)(?:Total Custos|Total de Custos|Saldo|$)/i);
    if (custosSectionMatch) {
        const sectionText = custosSectionMatch[1];
        const expenseLineRegex = /^(\d{2}\/\d{2})\s*-\s*R?\$?\s*([\d.,]+)\s+(.*)$/gm;
        let expMatch;
        while ((expMatch = expenseLineRegex.exec(sectionText)) !== null) {
            const desc = expMatch[3].trim();
            if (!desc.match(/Adiantamento|Final/i)) {
                expenses.push({
                    date: expMatch[1],
                    value: parseBrazilianValue(expMatch[2]),
                    description: desc,
                    category: getCategory(desc)
                });
            }
        }
    }

    const calculatedTotalCosts = expenses.reduce((sum, exp) => sum + exp.value, 0);
    const calculatedNetBalance = value - calculatedTotalCosts;

    // Extract month index from list name
    let listMonthIndex = -1;
    let listYear = new Date().getFullYear();
    if (isMonthList) {
        const monthsForIndex = ['janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const monthIndexMap = [0, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        for (let i = 0; i < monthsForIndex.length; i++) {
            if (listNameLower.includes(monthsForIndex[i])) {
                listMonthIndex = monthIndexMap[i];
                break;
            }
        }
        const yearMatch = listName.match(/\b(20\d{2})\b/);
        if (yearMatch) {
            listYear = parseInt(yearMatch[1]);
        }
    }

    return {
        id: card.id,
        code,
        client,
        address,
        description: card.desc,
        value,
        costs: calculatedTotalCosts,
        status,
        expectedDate: card.due || '',
        daysWorked: 0,
        dailyRate: 0,
        period: isMonthList ? 'monthly' : 'other',
        createdAt: card.dateLastActivity,
        contractorName,
        contractorValue,
        contractorPayments,
        expenses,
        cardMachineFee,
        netBalance: calculatedNetBalance,
        listMonthIndex,
        listYear,
        listName,
    };
};
