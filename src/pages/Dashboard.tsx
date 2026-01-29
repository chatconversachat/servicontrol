import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { ReceivedVsPendingChart, MonthlyEvolutionChart, ClientDistributionChart } from '@/components/Charts';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/data';
import { Briefcase, TrendingUp, Clock, DollarSign, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { services, loading: servicesLoading } = useServices();
  const { receipts, loading: receiptsLoading, getTotalReceived, getLatestWorkingCapital } = useReceipts();

  if (servicesLoading || receiptsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalReceived = getTotalReceived();
  const totalValue = services.reduce((sum, s) => sum + s.value, 0);
  const totalPending = totalValue - totalReceived;
  const averagePerService = services.length > 0 ? totalValue / services.length : 0;
  const workingCapital = getLatestWorkingCapital();

  // Build monthly chart data from real data
  const monthlyData = [
    { name: 'Este mês', received: totalReceived, pending: totalPending },
  ];

  // Build client distribution from real services
  const clientTotals = services.reduce((acc, s) => {
    acc[s.client] = (acc[s.client] || 0) + s.value;
    return acc;
  }, {} as Record<string, number>);

  const clientData = Object.entries(clientTotals).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral dos seus serviços e recebimentos"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Serviços"
          value={services.length.toString()}
          description="serviços cadastrados"
          icon={Briefcase}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Recebido"
          value={formatCurrency(totalReceived)}
          description="confirmados"
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(totalPending)}
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

      {services.length > 0 ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ReceivedVsPendingChart data={monthlyData} />
            <MonthlyEvolutionChart data={monthlyData} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {clientData.length > 0 && <ClientDistributionChart data={clientData} />}
            <StatCard
              title="Média por Serviço"
              value={formatCurrency(averagePerService)}
              description="baseado nos serviços cadastrados"
              icon={Briefcase}
              className="h-full flex flex-col justify-center"
            />
          </div>
        </>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Cadastre seu primeiro serviço para visualizar os gráficos e estatísticas.
          </p>
        </div>
      )}
    </div>
  );
}
