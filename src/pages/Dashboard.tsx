import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { ReceivedVsPendingChart, MonthlyEvolutionChart, ClientDistributionChart } from '@/components/Charts';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency, getMonthlyData, getClientDistribution, calculateMonthlySummary } from '@/lib/data';
import { Briefcase, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { services } = useServices();
  const { receipts, getTotalReceived, getLatestWorkingCapital } = useReceipts();

  const summary = calculateMonthlySummary(services, receipts);
  const monthlyData = getMonthlyData();
  const clientData = getClientDistribution();
  const workingCapital = getLatestWorkingCapital();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral dos seus serviços e recebimentos"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Serviços"
          value={summary.totalServices.toString()}
          description="serviços cadastrados"
          icon={Briefcase}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Recebido"
          value={formatCurrency(summary.totalReceived)}
          description="este mês"
          icon={TrendingUp}
          trend="up"
          trendValue="+12%"
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(summary.totalPending)}
          description="pendente"
          icon={Clock}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Capital de Giro"
          value={formatCurrency(workingCapital)}
          description="disponível"
          icon={DollarSign}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReceivedVsPendingChart data={monthlyData} />
        <MonthlyEvolutionChart data={monthlyData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ClientDistributionChart data={clientData} />
        <StatCard
          title="Média por Serviço"
          value={formatCurrency(summary.averagePerService)}
          description="baseado nos serviços cadastrados"
          icon={Briefcase}
          className="h-full flex flex-col justify-center"
        />
      </div>
    </div>
  );
}
