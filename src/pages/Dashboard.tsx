import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { ReceivedVsPendingChart, MonthlyEvolutionChart, ClientDistributionChart, CostsBreakdownChart, StatusDistributionChart } from '@/components/Charts';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/data';
import { Briefcase, TrendingUp, Clock, DollarSign, Loader2, PlayCircle, CheckCircle, Wallet, BarChart3, Percent, ArrowDownRight, ArrowUpRight, Receipt } from 'lucide-react';
import { SmartFilters } from '@/components/SmartFilters';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
      .slice(-12)
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

  // Client/label distribution
  const clientData = useMemo(() => {
    const clientTotals: Record<string, number> = {};
    allServices.forEach(s => {
      const name = s.client || 'Não identificado';
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

  // Cost distribution per service/budget
  const costPerServiceData = useMemo(() => {
    return allServices
      .filter(s => (s.costs || 0) > 0)
      .map(s => {
        const label = s.code ? `${s.code}` : s.description?.substring(0, 20) || 'Serviço';
        return {
          name: label.length > 18 ? label.substring(0, 18) + '..' : label,
          value: s.costs || 0,
          fullName: s.client ? `${s.code} - ${s.client}` : s.code || s.description || 'Serviço',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [allServices]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const statusMap: Record<string, { count: number; value: number }> = {};
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Ag. Pagamento',
      paid: 'Pago',
      overdue: 'Ag. Acerto',
    };
    allServices.forEach(s => {
      if (!statusMap[s.status]) statusMap[s.status] = { count: 0, value: 0 };
      statusMap[s.status].count++;
      statusMap[s.status].value += s.value;
    });
    return Object.entries(statusMap)
      .map(([status, data]) => ({
        name: labels[status] || status,
        value: data.value,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [allServices]);

  if (servicesLoading || receiptsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = getServicesSummary();
  const receiptsSummary = getReceiptsSummary();
  const totalCosts = allServices.reduce((sum, s) => sum + (s.costs || 0), 0);
  const totalNetBalance = summary.totalValue - totalCosts;
  const profitMargin = summary.totalValue > 0 ? ((totalNetBalance / summary.totalValue) * 100) : 0;
  const avgPerService = summary.total > 0 ? summary.totalValue / summary.total : 0;

  // Contractor totals
  const totalContractorValue = allServices.reduce((sum, s) => sum + (s.contractorValue || 0), 0);
  const totalCardMachineFees = allServices.reduce((sum, s) => sum + (s.cardMachineFee || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="Visão geral financeira dos seus serviços"
        />
      </div>

      <SmartFilters />

      {/* Row 1 - KPIs principais */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(summary.totalValue)}
          description={`${summary.total} serviços | Média ${formatCurrency(avgPerService)}`}
          icon={BarChart3}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total de Custos"
          value={formatCurrency(totalCosts)}
          description={`${summary.totalValue > 0 ? ((totalCosts / summary.totalValue) * 100).toFixed(1) : 0}% do faturamento`}
          icon={ArrowDownRight}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Saldo Líquido"
          value={formatCurrency(totalNetBalance)}
          description={`Margem: ${profitMargin.toFixed(1)}%`}
          icon={TrendingUp}
          trend={totalNetBalance >= 0 ? 'up' : 'down'}
          trendValue={totalNetBalance >= 0 ? '↑' : '↓'}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          title="Capital de Giro"
          value={formatCurrency(receiptsSummary.workingCapital)}
          description="disponível"
          icon={Wallet}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Row 2 - Status breakdown */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Em Andamento"
          value={formatCurrency(summary.inProgressValue)}
          description={`${summary.inProgress} serviços ativos`}
          icon={PlayCircle}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Ag. Pagamento"
          value={formatCurrency(summary.completedValue)}
          description={`${summary.completed} aguardando`}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
        <StatCard
          title="Ag. Acerto"
          value={formatCurrency(summary.overdueValue)}
          description={`${summary.overdue} serviços`}
          icon={Receipt}
          iconClassName="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Pagos"
          value={formatCurrency(summary.paidValue)}
          description={`${summary.paid} serviços finalizados`}
          icon={CheckCircle}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      {/* Row 3 - Margin progress bar + quick stats */}
      {summary.totalValue > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Indicadores Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Margem de Lucro</span>
                  <span className="font-semibold text-emerald-600">{profitMargin.toFixed(1)}%</span>
                </div>
                <Progress value={Math.max(0, Math.min(profitMargin, 100))} className="h-2.5" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Recebido vs Faturado</span>
                  <span className="font-semibold text-primary">
                    {summary.totalValue > 0 ? ((summary.paidValue / summary.totalValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <Progress value={summary.totalValue > 0 ? (summary.paidValue / summary.totalValue) * 100 : 0} className="h-2.5" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Custos / Faturamento</span>
                  <span className="font-semibold text-destructive">
                    {summary.totalValue > 0 ? ((totalCosts / summary.totalValue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <Progress value={summary.totalValue > 0 ? (totalCosts / summary.totalValue) * 100 : 0} className="h-2.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Resumo Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Média por serviço</span>
                <span className="font-medium">{formatCurrency(avgPerService)}</span>
              </div>
              {totalContractorValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Prestadores</span>
                  <span className="font-medium">{formatCurrency(totalContractorValue)}</span>
                </div>
              )}
              {totalCardMachineFees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxas Maquininha</span>
                  <span className="font-medium">{formatCurrency(totalCardMachineFees)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">A Receber</span>
                <span className="font-medium text-amber-600">
                  {formatCurrency(summary.inProgressValue + summary.completedValue + summary.overdueValue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Já Recebido</span>
                <span className="font-medium text-emerald-600">{formatCurrency(summary.paidValue)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-sm font-semibold">
                <span>Saldo Líquido Total</span>
                <span className={totalNetBalance >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                  {formatCurrency(totalNetBalance)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {allServices.length > 0 ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <MonthlyEvolutionChart data={monthlyData} />
            <ReceivedVsPendingChart data={monthlyData} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {statusData.length > 0 && <StatusDistributionChart data={statusData} />}
            {clientData.length > 0 && <ClientDistributionChart data={clientData} />}
          </div>

          {(costsData.length > 0 || costPerServiceData.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {costPerServiceData.length > 0 && <CostsBreakdownChart data={costPerServiceData} title="Custos por Orçamento" />}
              {costsData.length > 0 && <CostsBreakdownChart data={costsData} title="Custos por Categoria" />}
            </div>
          )}
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
