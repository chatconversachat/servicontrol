import { Service, Receipt, MonthlySummary, ChartData, ClientDistribution } from '@/types';

// Mock data for demonstration
export const mockServices: Service[] = [
  {
    id: '1',
    code: 'SRV001',
    client: 'Imobiliária Central',
    description: 'Reforma completa apartamento 101',
    value: 15000,
    status: 'paid',
    expectedDate: '2025-01-15',
    daysWorked: 12,
    dailyRate: 1250,
    period: 'Janeiro 2025',
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    code: 'SRV002',
    client: 'Construtora ABC',
    description: 'Pintura externa prédio comercial',
    value: 8500,
    status: 'completed',
    expectedDate: '2025-01-20',
    daysWorked: 5,
    dailyRate: 1700,
    period: 'Janeiro 2025',
    createdAt: '2025-01-05',
  },
  {
    id: '3',
    code: 'SRV003',
    client: 'Residencial Park',
    description: 'Manutenção hidráulica',
    value: 3200,
    status: 'in_progress',
    expectedDate: '2025-01-25',
    daysWorked: 2,
    dailyRate: 1600,
    period: 'Janeiro 2025',
    createdAt: '2025-01-10',
  },
  {
    id: '4',
    code: 'SRV004',
    client: 'Imobiliária Central',
    description: 'Instalação elétrica casa 45',
    value: 5800,
    status: 'pending',
    expectedDate: '2025-02-01',
    daysWorked: 0,
    dailyRate: 1450,
    period: 'Fevereiro 2025',
    createdAt: '2025-01-20',
  },
  {
    id: '5',
    code: 'SRV005',
    client: 'Condomínio Sol',
    description: 'Reparos área comum',
    value: 12000,
    status: 'overdue',
    expectedDate: '2025-01-10',
    daysWorked: 8,
    dailyRate: 1500,
    period: 'Janeiro 2025',
    createdAt: '2024-12-28',
  },
];

export const mockReceipts: Receipt[] = [
  {
    id: '1',
    serviceId: '1',
    date: '2025-01-15',
    expectedValue: 15000,
    receivedValue: 15000,
    difference: 0,
    notes: 'Pagamento integral recebido',
    workingCapital: 45000,
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    serviceId: '5',
    date: '2025-01-12',
    expectedValue: 12000,
    receivedValue: 6000,
    difference: -6000,
    notes: 'Pagamento parcial - aguardando restante',
    workingCapital: 51000,
    createdAt: '2025-01-12',
  },
];

export const getMonthlyData = (): ChartData[] => [
  { name: 'Set', received: 28000, pending: 5000 },
  { name: 'Out', received: 32000, pending: 8000 },
  { name: 'Nov', received: 25000, pending: 12000 },
  { name: 'Dez', received: 38000, pending: 6000 },
  { name: 'Jan', received: 21000, pending: 23500 },
];

export const getClientDistribution = (): ClientDistribution[] => [
  { name: 'Imobiliária Central', value: 20800 },
  { name: 'Construtora ABC', value: 8500 },
  { name: 'Residencial Park', value: 3200 },
  { name: 'Condomínio Sol', value: 12000 },
];

export const calculateMonthlySummary = (services: Service[], receipts: Receipt[]): MonthlySummary => {
  const totalServices = services.length;
  const totalReceived = receipts.reduce((sum, r) => sum + r.receivedValue, 0);
  const totalValue = services.reduce((sum, s) => sum + s.value, 0);
  const totalPending = totalValue - totalReceived;
  const averagePerService = totalServices > 0 ? totalValue / totalServices : 0;

  return {
    month: 'Janeiro',
    year: 2025,
    totalServices,
    totalReceived,
    totalPending,
    averagePerService,
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    paid: 'Pago',
    overdue: 'Atrasado',
  };
  return labels[status] || status;
};

export const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    in_progress: 'bg-primary/10 text-primary border-primary/20',
    completed: 'bg-success/10 text-success border-success/20',
    paid: 'status-paid',
    overdue: 'status-overdue',
  };
  return classes[status] || '';
};
