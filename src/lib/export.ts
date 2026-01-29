import { Service, Receipt } from '@/types';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/data';

export const exportToCSV = (services: Service[], receipts: Receipt[]) => {
  // Services CSV
  const servicesHeaders = ['Código', 'Cliente', 'Descrição', 'Valor', 'Status', 'Data Prevista', 'Dias Trabalhados', 'Diária', 'Período'];
  const servicesRows = services.map(s => [
    s.code,
    s.client,
    s.description,
    formatCurrency(s.value),
    getStatusLabel(s.status),
    formatDate(s.expectedDate),
    s.daysWorked.toString(),
    formatCurrency(s.dailyRate),
    s.period,
  ]);

  const servicesCSV = [
    servicesHeaders.join(';'),
    ...servicesRows.map(row => row.join(';')),
  ].join('\n');

  // Receipts CSV
  const receiptsHeaders = ['Data', 'Valor Previsto', 'Valor Recebido', 'Diferença', 'Observações', 'Capital de Giro'];
  const receiptsRows = receipts.map(r => [
    formatDate(r.date),
    formatCurrency(r.expectedValue),
    formatCurrency(r.receivedValue),
    formatCurrency(r.difference),
    r.notes,
    formatCurrency(r.workingCapital),
  ]);

  const receiptsCSV = [
    receiptsHeaders.join(';'),
    ...receiptsRows.map(row => row.join(';')),
  ].join('\n');

  return { servicesCSV, receiptsCSV };
};

export const downloadCSV = (content: string, filename: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportServicesToExcel = (services: Service[]) => {
  const { servicesCSV } = exportToCSV(services, []);
  downloadCSV(servicesCSV, `servicos_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportReceiptsToExcel = (receipts: Receipt[]) => {
  const { receiptsCSV } = exportToCSV([], receipts);
  downloadCSV(receiptsCSV, `recebimentos_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportAllToExcel = (services: Service[], receipts: Receipt[]) => {
  const { servicesCSV, receiptsCSV } = exportToCSV(services, receipts);
  
  const fullCSV = `SERVIÇOS\n${servicesCSV}\n\nRECEBIMENTOS\n${receiptsCSV}`;
  downloadCSV(fullCSV, `relatorio_completo_${new Date().toISOString().split('T')[0]}.csv`);
};
