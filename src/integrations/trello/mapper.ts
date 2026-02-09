import { Service, ServiceStatus } from '../../types';
import { TrelloCard, TrelloList } from './types';

export const mapTrelloCardToService = (
    card: TrelloCard,
    lists: TrelloList[]
): Service => {
    const list = lists.find(l => l.id === card.idList);
    const listName = list ? list.name.trim() : '';
    const listNameLower = listName.toLowerCase();

    let status: ServiceStatus = 'pending';
    let isMonthList = false;

    // Meses em português
    const months = ['janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    // Verifica se o nome da lista contém um mês
    isMonthList = months.some(m => listNameLower.includes(m));

    // Mapeamento de Status baseado no nome da lista (Prioridade para os status fixos)
    if (listNameLower.includes('andamento')) {
        status = 'in_progress';
    } else if (listNameLower.includes('pagamento')) {
        status = 'completed'; // Aguardando Pagamento (pode ser mapeado para completed ou um novo status)
    } else if (listNameLower.includes('acerto')) {
        status = 'overdue'; // Usando overdue para "Aguardando Acerto" ou podemos criar um novo futuramente
    } else if (listNameLower.includes('pago') || listNameLower.includes('concluído')) {
        status = 'paid';
    } else if (isMonthList) {
        status = 'pending'; // Por padrão, se está numa lista de mês e não diz o status, assume pendente
    }

    const fullText = `${card.name} ${card.desc}`;

    const parseBrazilianValue = (text: string): number => {
        if (!text) return 0;
        let cleaned = text.replace(/R?\$?\s*/gi, '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(cleaned) || 0;
    };

    // --- CATEGORIZAÇÃO ---
    const getCategory = (desc: string): string => {
        const d = desc.toLowerCase();
        if (d.includes('combustível') || d.includes('combustivel') || d.includes('99') || d.includes('uber') || d.includes('gasolina') || d.includes('moto') || d.includes('palio') || d.includes('corsa')) return 'Combustível';
        if (d.includes('almoço') || d.includes('janta') || d.includes('comida') || d.includes('refeição') || d.includes('lanche')) return 'Alimentação';
        if (d.includes('material') || d.includes('materiais') || d.includes('concreto') || d.includes('nf') || d.includes('ferramenta')) return 'Materiais';
        if (d.includes('adiantamento') || d.includes('final') || d.includes('mão de obra') || d.includes('mao de obra')) return 'Mão de Obra';
        if (d.includes('imposto') || d.includes('taxa') || d.includes('maquininha') || d.includes('iss') || d.includes('simples')) return 'Imposto/Taxas';
        return 'Extras';
    };

    // --- EXTRAÇÃO DO TÍTULO (CLIENTE E ENDEREÇO) ---
    let rawTitle = card.name;
    let code = `#${card.id.substring(0, 4)}`;
    const codeRegex = /(\d+-\d+)/;
    const codeMatch = fullText.match(codeRegex);

    if (codeMatch) {
        code = codeMatch[1];
        rawTitle = rawTitle.replace(codeRegex, '').replace(/[()\][]/g, '').trim();
    }

    let client = rawTitle.trim();
    let address = '';

    if (rawTitle.includes('=')) {
        const parts = rawTitle.split('=');
        client = parts[0].trim();
        address = parts[1].trim();
    }

    // --- EXTRAÇÃO DE VALORES E CUSTOS ---

    // 1. Valor Fechado
    let value = 0;
    const valueMatch = fullText.match(/Valor Fechado[:\s]*R?\$?\s*([\d.,]+)/i);
    if (valueMatch) value = parseBrazilianValue(valueMatch[1]);
    if (value === 0) value = parseBrazilianValue(card.name);

    // 2. Valor Maquininha
    let cardMachineFee = 0;
    const machineMatch = fullText.match(/Valor Maquininha[:\s]*R?\$?\s*([\d.,]+)/i);
    if (machineMatch) cardMachineFee = parseBrazilianValue(machineMatch[1]);

    // 3. Prestador
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

    return {
        id: card.id,
        code: code,
        client: client || 'Cliente não identificado',
        address: address,
        description: card.desc,
        value: value,
        costs: calculatedTotalCosts,
        status: status,
        expectedDate: card.due || '',
        daysWorked: 0,
        dailyRate: 0,
        period: isMonthList ? 'monthly' : 'other', // Marcando se vem de lista de mês
        createdAt: card.dateLastActivity,
        contractorName,
        contractorValue,
        contractorPayments,
        expenses,
        cardMachineFee,
        netBalance: calculatedNetBalance
    };
};
