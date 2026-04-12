import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/data';
import {
  TrendingUp, Clock, DollarSign, Loader2, PlayCircle, CheckCircle,
  Wallet, BarChart3, ArrowDownRight, Receipt, Target,
  Award, AlertTriangle, Zap, Activity
} from 'lucide-react';
import { SmartFilters } from '@/components/SmartFilters';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ReceivedVsPendingChart, MonthlyEvolutionChart, ClientDistributionChart,
  StatusDistributionChart
} from '@/components/Charts';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)', 'hsl(200, 70%, 50%)',
  'hsl(120, 60%, 45%)', 'hsl(15, 80%, 55%)',
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  fontSize: '12px',
  padding: '10px 14px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

const currencyFormatter = (value: number) => {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
};

const tooltipCurrencyFormatter = (value: number) => [
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, ''
];

function KpiCard({ label, value, subtext, icon: Icon, gradient, iconColor, trend }: {
  label: string; value: string; subtext?: string; icon: any; gradient: string; iconColor: string; trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className={`relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300 ${gradient}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
          <div className={`rounded-xl p-2 ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-5 border-0 font-semibold rounded-full ${trend.positive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/15 text-destructive'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </Badge>
          )}
          {subtext && <span className="text-[11px] text-muted-foreground">{subtext}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniIndicator({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className={`font-bold ${color}`}>{value}</span>
      </div>
      <Progress value={Math.max(0, Math.min(percent, 100))} className="h-2 rounded-full" />
    </div>
  );
}

export default function Dashboard() {
  const { allServices, services, loading: servicesLoading, getServicesSummary } = useServices();
  const { receipts, loading: receiptsLoading, getReceiptsSummary } = useReceipts();

  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { received: number; pending: number; costs: number; count: number }> = {};
    services.forEach(s => {
      const dateStr = s.expectedDate || s.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { received: 0, pending: 0, costs: 0, count: 0 };
      monthMap[key].count++;
      if (s.status === 'paid') monthMap[key].received += s.value;
      else monthMap[key].pending += s.value;
      monthMap[key].costs += s.costs || 0;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        return { name: `${MONTH_NAMES[parseInt(month)]}/${year.slice(2)}`, ...val };
      });
  }, [services]);

  const clientRanking = useMemo(() => {
    const map: Record<string, { revenue: number; count: number; costs: number }> = {};
    services.forEach(s => {
      const name = s.client || 'Não identificado';
      if (!map[name]) map[name] = { revenue: 0, count: 0, costs: 0 };
      map[name].revenue += s.value;
      map[name].count++;
      map[name].costs += s.costs || 0;
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name: name.length > 22 ? name.substring(0, 22) + '...' : name,
        fullName: name,
        revenue: d.revenue,
        count: d.count,
        costs: d.costs,
        profit: d.revenue - d.costs,
        margin: d.revenue > 0 ? ((d.revenue - d.costs) / d.revenue) * 100 : 0,
        avgTicket: d.count > 0 ? d.revenue / d.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [services]);

  const servicesProfitability = useMemo(() => {
    return services
      .filter(s => s.value > 0)
      .map(s => {
        const costs = s.costs || 0;
        const profit = s.value - costs;
        const margin = (profit / s.value) * 100;
        const label = s.code || s.description?.substring(0, 15) || 'Serviço';
        return {
          name: label.length > 16 ? label.substring(0, 16) + '..' : label,
          fullName: `${s.code} - ${s.client}`,
          revenue: s.value, costs, profit, margin, status: s.status,
        };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 12);
  }, [services]);

  const costComposition = useMemo(() => {
    let contractorTotal = 0, expensesTotal = 0, cardFeeTotal = 0;
    services.forEach(s => {
      contractorTotal += s.contractorValue || 0;
      cardFeeTotal += s.cardMachineFee || 0;
      if (s.expenses) s.expenses.forEach(e => { expensesTotal += e.value; });
    });
    const total = contractorTotal + expensesTotal + cardFeeTotal;
    const items = [
      { name: 'Mão de Obra', value: contractorTotal },
      { name: 'Despesas Operacionais', value: expensesTotal },
      { name: 'Taxas Maquininha', value: cardFeeTotal },
    ].filter(i => i.value > 0);
    return items.map(i => ({ ...i, percent: total > 0 ? (i.value / total) * 100 : 0 }));
  }, [services]);

  const costPerServiceData = useMemo(() => {
    return services
      .filter(s => (s.costs || 0) > 0)
      .map(s => ({
        name: (s.code || s.description?.substring(0, 18) || 'Serviço').substring(0, 18),
        value: s.costs || 0,
        percent: s.value > 0 ? ((s.costs || 0) / s.value) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [services]);

  const expenseCategoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    services.forEach(s => {
      if (s.expenses) s.expenses.forEach(e => {
        const cat = e.category || 'Outros';
        cats[cat] = (cats[cat] || 0) + e.value;
      });
    });
    const total = Object.values(cats).reduce((a, b) => a + b, 0);
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [services]);

  const statusData = useMemo(() => {
    const statusMap: Record<string, { count: number; value: number }> = {};
    const labels: Record<string, string> = {
      pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Ag. Pagamento',
      paid: 'Pago', overdue: 'Ag. Acerto',
    };
    services.forEach(s => {
      if (!statusMap[s.status]) statusMap[s.status] = { count: 0, value: 0 };
      statusMap[s.status].count++;
      statusMap[s.status].value += s.value;
    });
    return Object.entries(statusMap)
      .map(([status, data]) => ({ name: labels[status] || status, value: data.value, count: data.count }))
      .sort((a, b) => b.value - a.value);
  }, [services]);

  if (servicesLoading || receiptsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = getServicesSummary();
  const receiptsSummary = getReceiptsSummary();
  const totalCosts = services.reduce((sum, s) => sum + (s.costs || 0), 0);
  const totalNetBalance = summary.totalValue - totalCosts;
  const profitMargin = summary.totalValue > 0 ? ((totalNetBalance / summary.totalValue) * 100) : 0;
  const avgTicket = summary.total > 0 ? summary.totalValue / summary.total : 0;
  const conversionRate = summary.total > 0 ? ((summary.paid / summary.total) * 100) : 0;
  const totalContractorValue = services.reduce((sum, s) => sum + (s.contractorValue || 0), 0);
  const totalCardMachineFees = services.reduce((sum, s) => sum + (s.cardMachineFee || 0), 0);
  const totalToReceive = summary.inProgressValue + summary.completedValue + summary.overdueValue;
  const paidPercent = summary.totalValue > 0 ? (summary.paidValue / summary.totalValue) * 100 : 0;
  const costsPercent = summary.totalValue > 0 ? (totalCosts / summary.totalValue) * 100 : 0;
  const operationalCostPercent = summary.totalValue > 0 ? (totalContractorValue / summary.totalValue) * 100 : 0;
  const topClient = clientRanking.length > 0 ? clientRanking[0] : null;
  const lowMarginCount = servicesProfitability.filter(s => s.margin < 30).length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Indicadores de saúde do negócio</p>
        </div>
        <SmartFilters />
      </div>

      {/* ═══ ROW 1: Hero KPIs ═══ */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Receita Bruta"
          value={formatCurrency(summary.totalValue)}
          subtext={`${summary.total} serviços`}
          icon={BarChart3}
          gradient="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
          iconColor="bg-primary/15 text-primary"
        />
        <KpiCard
          label="Saldo Líquido"
          value={formatCurrency(totalNetBalance)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent"
          iconColor="bg-emerald-500/15 text-emerald-600"
          trend={{ value: `${profitMargin.toFixed(1)}% margem`, positive: totalNetBalance >= 0 }}
        />
        <KpiCard
          label="Custos Totais"
          value={formatCurrency(totalCosts)}
          subtext={`${costsPercent.toFixed(1)}% do faturamento`}
          icon={ArrowDownRight}
          gradient="bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent"
          iconColor="bg-destructive/15 text-destructive"
        />
        <KpiCard
          label="Capital de Giro"
          value={formatCurrency(receiptsSummary.workingCapital)}
          subtext="disponível"
          icon={Wallet}
          gradient="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent"
          iconColor="bg-amber-500/15 text-amber-600"
        />
      </div>

      {/* ═══ ROW 2: Business Health Indicators ═══ */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Ticket Médio', value: formatCurrency(avgTicket), sub: 'por serviço', icon: Target, color: 'text-violet-600', bg: 'from-violet-500/10' },
          { label: 'Taxa Conversão', value: `${conversionRate.toFixed(1)}%`, sub: `${summary.paid} de ${summary.total} pagos`, icon: Zap, color: 'text-cyan-600', bg: 'from-cyan-500/10' },
          { label: 'Custo Operacional', value: `${operationalCostPercent.toFixed(1)}%`, sub: formatCurrency(totalContractorValue), icon: Activity, color: 'text-rose-600', bg: 'from-rose-500/10' },
          { label: 'Top Cliente', value: topClient?.name || '-', sub: topClient ? `${formatCurrency(topClient.revenue)} • ${topClient.count} serv.` : '-', icon: Award, color: 'text-emerald-600', bg: 'from-emerald-500/10', isText: true },
          { label: 'A Receber', value: formatCurrency(totalToReceive), sub: `${summary.inProgress + summary.completed + summary.overdue} pendentes`, icon: AlertTriangle, color: 'text-orange-600', bg: 'from-orange-500/10' },
        ].map((item) => (
          <Card key={item.label} className={`border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br ${item.bg} to-transparent`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
              </div>
              <p className={`${item.isText ? 'text-sm' : 'text-xl'} font-extrabold text-foreground truncate`}>{item.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ ROW 3: Pipeline + Financial Health + Cost Composition ═══ */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Status pipeline */}
        <Card className="lg:col-span-5 shadow-md border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-bold text-foreground tracking-tight">Pipeline de Status</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Em Andamento', value: summary.inProgressValue, count: summary.inProgress, color: 'text-blue-600', bg: 'bg-blue-500/10 hover:bg-blue-500/15', icon: PlayCircle },
                { label: 'Ag. Pagamento', value: summary.completedValue, count: summary.completed, color: 'text-amber-600', bg: 'bg-amber-500/10 hover:bg-amber-500/15', icon: Clock },
                { label: 'Ag. Acerto', value: summary.overdueValue, count: summary.overdue, color: 'text-orange-600', bg: 'bg-orange-500/10 hover:bg-orange-500/15', icon: Receipt },
                { label: 'Pagos', value: summary.paidValue, count: summary.paid, color: 'text-emerald-600', bg: 'bg-emerald-500/10 hover:bg-emerald-500/15', icon: CheckCircle },
              ].map((item) => {
                const pct = summary.totalValue > 0 ? ((item.value / summary.totalValue) * 100).toFixed(1) : '0';
                return (
                  <div key={item.label} className={`rounded-xl ${item.bg} p-3.5 space-y-1 transition-colors duration-200`}>
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className="text-[11px] font-semibold text-muted-foreground">{item.label}</span>
                    </div>
                    <p className={`text-base font-extrabold ${item.color}`}>{formatCurrency(item.value)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{item.count} serv. • {pct}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Financial health bars */}
        <Card className="lg:col-span-3 shadow-md border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-bold text-foreground tracking-tight">Saúde Financeira</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            <MiniIndicator label="Margem Líquida" value={`${profitMargin.toFixed(1)}%`} percent={profitMargin} color="text-emerald-600" />
            <MiniIndicator label="Recebimento" value={`${paidPercent.toFixed(1)}%`} percent={paidPercent} color="text-primary" />
            <MiniIndicator label="Custos / Receita" value={`${costsPercent.toFixed(1)}%`} percent={costsPercent} color="text-destructive" />
            <MiniIndicator label="Conversão" value={`${conversionRate.toFixed(1)}%`} percent={conversionRate} color="text-violet-600" />
            <Separator className="my-1" />
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Já Recebido</span>
                <span className="font-bold text-emerald-600">{formatCurrency(summary.paidValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">A Receber</span>
                <span className="font-bold text-amber-600">{formatCurrency(totalToReceive)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost composition */}
        <Card className="lg:col-span-4 shadow-md border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-bold text-foreground tracking-tight">Composição de Custos</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {costComposition.length > 0 ? (
              <div className="space-y-3.5">
                {costComposition.map((item, i) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-md" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{formatCurrency(item.value)}</span>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-0 bg-muted rounded-full font-semibold">
                          {item.percent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={item.percent} className="h-2 rounded-full" />
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Total Custos</span>
                  <span className="text-foreground">{formatCurrency(totalCosts)}</span>
                </div>
                {totalCardMachineFees > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Taxas Maquininha</span>
                    <span className="font-medium">{formatCurrency(totalCardMachineFees)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">Sem dados de custos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ ROW 4: Client Ranking ═══ */}
      {clientRanking.length > 0 && (
        <Card className="shadow-md border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground tracking-tight">Ranking de Clientes</CardTitle>
              <Badge variant="secondary" className="text-[10px] font-semibold rounded-full px-3">{clientRanking.length} clientes</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2.5 text-muted-foreground font-bold">#</th>
                    <th className="text-left py-2.5 text-muted-foreground font-bold">Cliente</th>
                    <th className="text-right py-2.5 text-muted-foreground font-bold">Receita</th>
                    <th className="text-right py-2.5 text-muted-foreground font-bold">Custos</th>
                    <th className="text-right py-2.5 text-muted-foreground font-bold">Lucro</th>
                    <th className="text-right py-2.5 text-muted-foreground font-bold">Margem</th>
                    <th className="text-right py-2.5 text-muted-foreground font-bold">Ticket Médio</th>
                    <th className="text-center py-2.5 text-muted-foreground font-bold">Serv.</th>
                  </tr>
                </thead>
                <tbody>
                  {clientRanking.slice(0, 8).map((c, i) => (
                    <tr key={c.fullName} className="border-b border-border/40 hover:bg-muted/40 transition-colors duration-150">
                      <td className="py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 font-semibold text-foreground">{c.name}</td>
                      <td className="py-2.5 text-right text-foreground font-semibold">{formatCurrency(c.revenue)}</td>
                      <td className="py-2.5 text-right text-destructive font-medium">{formatCurrency(c.costs)}</td>
                      <td className={`py-2.5 text-right font-semibold ${c.profit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {formatCurrency(c.profit)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-5 border-0 rounded-full font-bold ${c.margin >= 30 ? 'bg-emerald-500/15 text-emerald-600' : c.margin >= 15 ? 'bg-amber-500/15 text-amber-600' : 'bg-destructive/15 text-destructive'}`}>
                          {c.margin.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right text-foreground font-medium">{formatCurrency(c.avgTicket)}</td>
                      <td className="py-2.5 text-center">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 rounded-full font-bold">{c.count}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ ROW 5: Per-service profitability ═══ */}
      {servicesProfitability.length > 0 && (
        <Card className="shadow-md border-0">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground tracking-tight">Rentabilidade por Obra/Serviço</CardTitle>
              {lowMarginCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-orange-500/15 text-orange-600 border-0 rounded-full px-3 font-semibold">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lowMarginCount} com margem baixa
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={Math.max(260, servicesProfitability.length * 30)}>
              <BarChart data={servicesProfitability} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={tooltipCurrencyFormatter}
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => {
                    const found = servicesProfitability.find(s => s.name === label);
                    return found ? `${found.fullName} (Margem: ${found.margin.toFixed(1)}%)` : label;
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Receita" fill="hsl(221, 83%, 53%)" radius={[0, 6, 6, 0]} stackId="a" />
                <Bar dataKey="costs" name="Custo" fill="hsl(0, 72%, 51%)" radius={[0, 6, 6, 0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ ROW 6: Charts ═══ */}
      {services.length > 0 ? (
        <div className="space-y-4">
          <MonthlyEvolutionChart data={monthlyData} />

          <div className="grid gap-4 lg:grid-cols-2">
            <ReceivedVsPendingChart data={monthlyData} />
            {statusData.length > 0 ? <StatusDistributionChart data={statusData} /> : <ClientDistributionChart data={clientRanking.slice(0, 10).map(c => ({ name: c.name, value: c.revenue }))} />}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {statusData.length > 0 && clientRanking.length > 0 && (
              <ClientDistributionChart data={clientRanking.slice(0, 10).map(c => ({ name: c.name, value: c.revenue }))} />
            )}
            {costPerServiceData.length > 0 && (
              <Card className="shadow-md border-0">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-bold tracking-tight">Custos por Orçamento (% da Receita)</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <ResponsiveContainer width="100%" height={Math.max(280, costPerServiceData.length * 30)}>
                    <BarChart data={costPerServiceData} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${props.payload.percent.toFixed(1)}% da receita)`,
                          'Custo'
                        ]}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="value" name="Custo" radius={[0, 6, 6, 0]}>
                        {costPerServiceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {expenseCategoryData.length > 0 && (
              <Card className="shadow-md border-0">
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-sm font-bold tracking-tight">Custos por Categoria (%)</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="space-y-2.5 mb-5">
                    {expenseCategoryData.map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-2.5 text-xs">
                        <div className="w-3 h-3 rounded-md flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground flex-1 font-medium">{cat.name}</span>
                        <span className="font-bold text-foreground">{formatCurrency(cat.value)}</span>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-0 bg-muted rounded-full font-semibold">{cat.percent.toFixed(1)}%</Badge>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name.substring(0, 12)} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                      >
                        {expenseCategoryData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="shadow-md border-0">
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">Configure a integração com o Trello ou cadastre serviços para visualizar os gráficos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
