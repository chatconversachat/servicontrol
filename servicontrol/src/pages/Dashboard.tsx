import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { ReceivedVsPendingChart, MonthlyEvolutionChart, ClientDistributionChart, CostsBreakdownChart } from '@/components/Charts';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/data';
import { Briefcase, TrendingUp, Clock, DollarSign, Loader2, PlayCircle, CheckCircle, Wallet, BarChart3 } from 'lucide-react';
import { SmartFilters } from '@/components/SmartFilters';
import { useMemo } from 'react';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Dashboard() {
  const { allServices, services, loading: servicesLoading, getServicesSummary } = useServices();
  const { receipts, loading: receiptsLoading, getReceiptsSummary, calculateToReceive } = useReceipts();

  // Build monthly evolution data from ALL services
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { received: number; pending: number; costs: number; count: number }> = {};

    allServices.forEach(s => {
      const dateStr = s.expectedDate || s.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { received: 0, pending: 0, costs: 0, count: 0 };

      monthMap[key].count++;
      if (s.status === 'paid') {
        monthMap[key].received += s.value;
      } else {
        monthMap[key].pending += s.value;
      }
      monthMap[key].costs += s.costs || 0;
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // last 12 months
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        return {
          name: `${MONTH_NAMES[parseInt(month)]}/${year.slice(2)}`,
          received: val.received,
          pending: val.pending,
          costs: val.costs,
          count: val.count,
        };
      });
  }, [allServices]);

  // Build client/label distribution from services
  const clientData = useMemo(() => {
    const clientTotals: Record<string, number> = {};
    allServices.forEach(s => {
      const name = s.client || 'Não identificado';
      // Truncate long names
      const shortName = name.length > 25 ? name.substring(0, 25) + '...' : name;
      clientTotals[shortName] = (clientTotals[shortName] || 0) + s.value;
    });
    return Object.entries(clientTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [allServices]);

  // Costs breakdown by category
  const costsData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    allServices.forEach(s => {
      if (s.expenses && s.expenses.length > 0) {
        s.expenses.forEach(exp => {
          const cat = exp.category || 'Outros';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.value;
        });
      }
    });
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allServices]);

  if (servicesLoading || receiptsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const servicesSummary = getServicesSummary();
  const receiptsSummary = getReceiptsSummary();
  const toReceive = calculateToReceive(servicesSummary.totalValue);

  // Total costs from all services
  const totalCosts = allServices.reduce((sum, s) => sum + (s.costs || 0), 0);
  const totalNetBalance = servicesSummary.totalValue - totalCosts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="Visão geral dos seus serviços e recebimentos"
        />
      </div>

      <SmartFilters />

      {/* KPIs principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Serviços"
          value={servicesSummary.total.toString()}
          description={`${servicesSummary.inProgress} em andamento, ${servicesSummary.completed} ag. pagamento`}
          icon={Briefcase}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(servicesSummary.totalValue)}
          description={`Média: ${formatCurrency(servicesSummary.total > 0 ? servicesSummary.totalValue / servicesSummary.total : 0)}/serviço`}
          icon={BarChart3}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Total de Custos"
          value={formatCurrency(totalCosts)}
          description={`Saldo líquido: ${formatCurrency(totalNetBalance)}`}
          icon={Wallet}
          iconClassName="bg-red-500/10 text-red-500"
        />
        <StatCard
          title="Capital de Giro"
          value={formatCurrency(receiptsSummary.workingCapital)}
          description="disponível"
          icon={DollarSign}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Em Andamento"
          value={formatCurrency(servicesSummary.inProgressValue)}
          description={`${servicesSummary.inProgress} serviços ativos`}
          icon={PlayCircle}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Ag. Pagamento"
          value={formatCurrency(servicesSummary.completedValue)}
          description={`${servicesSummary.completed} aguardando`}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
        <StatCard
          title="Ag. Acerto"
          value={formatCurrency(servicesSummary.overdueValue)}
          description={`${servicesSummary.overdue} serviços`}
          icon={TrendingUp}
          iconClassName="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Pagos"
          value={formatCurrency(servicesSummary.paidValue)}
          description={`${servicesSummary.paid} serviços finalizados`}
          icon={CheckCircle}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      {/* Charts */}
      {allServices.length > 0 ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <MonthlyEvolutionChart data={monthlyData} />
            <ReceivedVsPendingChart data={monthlyData} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {clientData.length > 0 && <ClientDistributionChart data={clientData} />}
            {costsData.length > 0 && <CostsBreakdownChart data={costsData} />}
          </div>
        </>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Configure a integração com o Trello ou cadastre serviços para visualizar os gráficos.
          </p>
        </div>
      )}
    </div>
  );
}
