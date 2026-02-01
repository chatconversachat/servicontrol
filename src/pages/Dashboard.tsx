import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { ReceivedVsPendingChart, MonthlyEvolutionChart, ClientDistributionChart } from '@/components/Charts';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/data';
import { Briefcase, TrendingUp, Clock, DollarSign, Loader2, PlayCircle, CheckCircle } from 'lucide-react';
import { SmartFilters } from '@/components/SmartFilters';

export default function Dashboard() {
  const { services, loading: servicesLoading, getServicesSummary } = useServices();
  const { receipts, loading: receiptsLoading, getReceiptsSummary, calculateToReceive } = useReceipts();

  if (servicesLoading || receiptsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Cálculos automáticos
  const servicesSummary = getServicesSummary();
  const receiptsSummary = getReceiptsSummary();
  const toReceive = calculateToReceive(servicesSummary.totalValue);

  // Build monthly chart data from real data
  const monthlyData = [
    { name: 'Este período', received: receiptsSummary.totalReceived, pending: toReceive > 0 ? toReceive : 0 },
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="Visão geral dos seus serviços e recebimentos"
        />
      </div>

      <SmartFilters />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Serviços"
          value={servicesSummary.total.toString()}
          description={`${servicesSummary.pending} pendentes, ${servicesSummary.inProgress} em andamento`}
          icon={Briefcase}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Recebido"
          value={formatCurrency(receiptsSummary.totalReceived)}
          description={`${receiptsSummary.count} recebimentos registrados`}
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(toReceive > 0 ? toReceive : 0)}
          description={`${servicesSummary.completed} concluídos aguardando`}
          icon={Clock}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Capital de Giro"
          value={formatCurrency(receiptsSummary.workingCapital)}
          description="disponível"
          icon={DollarSign}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      {/* Resumo por Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Em Andamento"
          value={formatCurrency(servicesSummary.inProgressValue)}
          description={`${servicesSummary.inProgress} serviços ativos`}
          icon={PlayCircle}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Concluídos"
          value={formatCurrency(servicesSummary.completedValue)}
          description={`${servicesSummary.completed} aguardando pagamento`}
          icon={CheckCircle}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          title="Pagos"
          value={formatCurrency(servicesSummary.paidValue)}
          description={`${servicesSummary.paid} serviços finalizados`}
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
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
              value={formatCurrency(servicesSummary.total > 0 ? servicesSummary.totalValue / servicesSummary.total : 0)}
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
