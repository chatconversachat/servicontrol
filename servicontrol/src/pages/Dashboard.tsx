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
import { Separator } from '@/components/ui/separator';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Dashboard() {
  const { allServices, services, loading: servicesLoading, getServicesSummary } = useServices();
  const { receipts, loading: receiptsLoading, getReceiptsSummary, calculateToReceive } = useReceipts();

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
  const totalContractorValue = allServices.reduce((sum, s) => sum + (s.contractorValue || 0), 0);
  const totalCardMachineFees = allServices.reduce((sum, s) => sum + (s.cardMachineFee || 0), 0);
  const totalToReceive = summary.inProgressValue + summary.completedValue + summary.overdueValue;
  const paidPercent = summary.totalValue > 0 ? (summary.paidValue / summary.totalValue) * 100 : 0;
  const costsPercent = summary.totalValue > 0 ? (totalCosts / summary.totalValue) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral financeira</p>
        </div>
        <SmartFilters />
      </div>

      {/* Hero KPIs - 4 main cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faturamento</span>
              <div className="rounded-lg p-1.5 bg-primary/15">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(summary.totalValue)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{summary.total} serviços • Média {formatCurrency(avgPerService)}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Líquido</span>
              <div className="rounded-lg p-1.5 bg-emerald-500/15">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(totalNetBalance)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Margem {profitMargin.toFixed(1)}%
              <span className={`ml-1 font-semibold ${totalNetBalance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {totalNetBalance >= 0 ? '↑' : '↓'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custos</span>
              <div className="rounded-lg p-1.5 bg-destructive/15">
                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(totalCosts)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{costsPercent.toFixed(1)}% do faturamento</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capital de Giro</span>
              <div className="rounded-lg p-1.5 bg-amber-500/15">
                <Wallet className="h-3.5 w-3.5 text-amber-600" />
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(receiptsSummary.workingCapital)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">disponível</p>
          </CardContent>
        </Card>
      </div>

      {/* Status pipeline + Financial indicators side by side */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Status pipeline - compact horizontal cards */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Pipeline de Status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { label: 'Em Andamento', value: summary.inProgressValue, count: summary.inProgress, color: 'text-blue-600', bg: 'bg-blue-500/10', icon: PlayCircle },
                { label: 'Ag. Pagamento', value: summary.completedValue, count: summary.completed, color: 'text-amber-600', bg: 'bg-amber-500/10', icon: Clock },
                { label: 'Ag. Acerto', value: summary.overdueValue, count: summary.overdue, color: 'text-orange-600', bg: 'bg-orange-500/10', icon: Receipt },
                { label: 'Pagos', value: summary.paidValue, count: summary.paid, color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle },
              ].map((item) => {
                const pct = summary.totalValue > 0 ? ((item.value / summary.totalValue) * 100).toFixed(1) : '0';
                return (
                  <div key={item.label} className={`rounded-lg ${item.bg} p-3 space-y-1`}>
                    <div className="flex items-center gap-1.5">
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                    </div>
                    <p className={`text-base font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                    <p className="text-[10px] text-muted-foreground">{item.count} serviços • {pct}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Financial health indicators */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Saúde Financeira</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Margem de Lucro</span>
                <span className="font-semibold text-emerald-600">{profitMargin.toFixed(1)}%</span>
              </div>
              <Progress value={Math.max(0, Math.min(profitMargin, 100))} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Recebido</span>
                <span className="font-semibold text-primary">{paidPercent.toFixed(1)}%</span>
              </div>
              <Progress value={paidPercent} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Custos</span>
                <span className="font-semibold text-destructive">{costsPercent.toFixed(1)}%</span>
              </div>
              <Progress value={costsPercent} className="h-2" />
            </div>
            <Separator />
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">A Receber</span>
                <span className="font-medium text-amber-600">{formatCurrency(totalToReceive)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Já Recebido</span>
                <span className="font-medium text-emerald-600">{formatCurrency(summary.paidValue)}</span>
              </div>
              {totalContractorValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prestadores</span>
                  <span className="font-medium">{formatCurrency(totalContractorValue)}</span>
                </div>
              )}
              {totalCardMachineFees > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxas Maquininha</span>
                  <span className="font-medium">{formatCurrency(totalCardMachineFees)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      {allServices.length > 0 ? (
        <div className="space-y-3">
          {/* Main charts row - Evolution full width */}
          <MonthlyEvolutionChart data={monthlyData} />

          {/* Two charts side by side */}
          <div className="grid gap-3 lg:grid-cols-2">
            <ReceivedVsPendingChart data={monthlyData} />
            {statusData.length > 0 ? <StatusDistributionChart data={statusData} /> : <ClientDistributionChart data={clientData} />}
          </div>

          {/* Bottom row */}
          <div className="grid gap-3 lg:grid-cols-2">
            {statusData.length > 0 && clientData.length > 0 && <ClientDistributionChart data={clientData} />}
            {costPerServiceData.length > 0 && <CostsBreakdownChart data={costPerServiceData} title="Custos por Orçamento" />}
            {costsData.length > 0 && <CostsBreakdownChart data={costsData} title="Custos por Categoria" />}
          </div>
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Configure a integração com o Trello ou cadastre serviços para visualizar os gráficos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
