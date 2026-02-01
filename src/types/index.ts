export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'paid' | 'overdue';

export interface Service {
  id: string;
  code: string;
  client: string;
  description: string;
  value: number;
  costs: number;
  status: ServiceStatus;
  expectedDate: string;
  daysWorked: number;
  dailyRate: number;
  period: string;
  createdAt: string;
  address?: string;
  contractorName?: string;
  contractorValue?: number;
  contractorPayments?: { date: string; value: number; type: string }[];
  expenses?: { date: string; value: number; description: string; category?: string }[];
  cardMachineFee?: number;
  netBalance?: number;
}

export interface Receipt {
  id: string;
  serviceId: string;
  date: string;
  expectedValue: number;
  receivedValue: number;
  difference: number;
  notes: string;
  workingCapital: number;
  createdAt: string;
}

export interface MonthlySummary {
  month: string;
  year: number;
  totalServices: number;
  totalReceived: number;
  totalPending: number;
  averagePerService: number;
}

export interface ChartData {
  name: string;
  received: number;
  pending: number;
}

export interface ClientDistribution {
  name: string;
  value: number;
}
