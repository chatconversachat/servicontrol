import { PageHeader } from '@/components/PageHeader';
import { ReceivedVsPendingChart, MonthlyEvolutionChart, ClientDistributionChart, CostsBreakdownChart, StatusDistributionChart } from '@/components/Charts';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/data';
import {
  Briefcase, TrendingUp, Clock, DollarSign, Loader2, PlayCircle, CheckCircle,
  Wallet, BarChart3, Percent, ArrowDownRight, ArrowUpRight, Receipt, Target,
  Users, Award, AlertTriangle, TrendingDown, Zap, PieChart as PieChartIcon,
  Hash, Activity
} from 'lucide-react';
import { SmartFilters } from '@/components/SmartFilters';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
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
  borderRadius: '8px',
  fontSize: '12px',
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
    <Card className={`relative overflow-hidden border-0 shadow-sm ${gradient}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className={`rounded-lg p-1.5 ${iconColor}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className="text-xl lg:text-2xl font-bold text-foreground">{value}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {trend && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 ${trend.positive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/15 text-destructive'}`}>
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
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${color}`}>{value}</span>
      </div>
      <Progress value={Math.max(0, Math.min(percent, 100))} className="h-1.5" />
    </div>
  );
}

export default function Dashboard() {
  const { allServices, services, loading: servicesLoading, getServicesSummary } = useServices();
  const { receipts, loading: receiptsLoading, getReceiptsSummary } = useReceipts();

  // ─── Monthly evolution data ───
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
  }, [allServices]);

  // ─── Client ranking ───
  const clientRanking = useMemo(() => {
    const map: Record<string, { revenue: number; count: number; costs: number }> = {};
    allServices.forEach(s => {
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
  }, [allServices]);

  // ─── Per-service profitability ───
  const servicesProfitability = useMemo(() => {
    return allServices
      .filter(s => s.value > 0)
      .map(s => {
        const costs = s.costs || 0;
        const profit = s.value - costs;
        const margin = (profit / s.value) * 100;
        const label = s.code || s.description?.substring(0, 15) || 'Serviço';
        return {
          name: label.length > 16 ? label.substring(0, 16) + '..' : label,
          fullName: `${s.code} - ${s.client}`,
          revenue: s.value,
          costs,
          profit,
          margin,
          status: s.status,
        };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 12);
  }, [allServices]);

  // ─── Cost composition with % ───
  const costComposition = useMemo(() => {
    let contractorTotal = 0;
    let expensesTotal = 0;
    let cardFeeTotal = 0;
    allServices.forEach(s => {
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
  }, [allServices]);

  // ─── Costs per budget/service ───
  const costPerServiceData = useMemo(() => {
    return allServices
      .filter(s => (s.costs || 0) > 0)
      .map(s => ({
        name: (s.code || s.description?.substring(0, 18) || 'Serviço').substring(0, 18),
        value: s.costs || 0,
        percent: s.value > 0 ? ((s.costs || 0) / s.value) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [allServices]);

  // ─── Expense category breakdown ───
  const expenseCategoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    allServices.forEach(s => {
      if (s.expenses) s.expenses.forEach(e => {
        const cat = e.category || 'Outros';
        cats[cat] = (cats[cat] || 0) + e.value;
      });
    });
    const total = Object.values(cats).reduce((a, b) => a + b, 0);
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [allServices]);

  // ─── Status distribution ───
  const statusData = useMemo(() => {
    const statusMap: Record<string, { count: number; value: number }> = {};
    const labels: Record<string, string> = {
      pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Ag. Pagamento',
      paid: 'Pago', overdue: 'Ag. Acerto',
    };
    allServices.forEach(s => {
      if (!statusMap[s.status]) statusMap[s.status] = { count: 0, value: 0 };
      statusMap[s.status].count++;
      statusMap[s.status].value += s.value;
    });
    return Object.entries(statusMap)
      .map(([status, data]) => ({ name: labels[status] || status, value: data.value, count: data.count }))
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
  const avgTicket = summary.total > 0 ? summary.totalValue / summary.total : 0;
  const conversionRate = summary.total > 0 ? ((summary.paid / summary.total) * 100) : 0;
  const totalContractorValue = allServices.reduce((sum, s) => sum + (s.contractorValue || 0), 0);
  const totalCardMachineFees = allServices.reduce((sum, s) => sum + (s.cardMachineFee || 0), 0);
  const totalToReceive = summary.inProgressValue + summary.completedValue + summary.overdueValue;
  const paidPercent = summary.totalValue > 0 ? (summary.paidValue / summary.totalValue) * 100 : 0;
  const costsPercent = summary.totalValue > 0 ? (totalCosts / summary.totalValue) * 100 : 0;
  const operationalCostPercent = summary.totalValue > 0 ? (totalContractorValue / summary.totalValue) * 100 : 0;

  // Top client
  const topClient = clientRanking.length > 0 ? clientRanking[0] : null;

  // Services with low margin (< 30%)
  const lowMarginCount = servicesProfitability.filter(s => s.margin < 30).length;

  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Indicadores de saúde do negócio</p>
        </div>
        <SmartFilters />
      </div>

      {/* ═══ ROW 1: Hero KPIs ═══ */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500/10 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Ticket Médio</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(avgTicket)}</p>
            <p className="text-[10px] text-muted-foreground">por serviço</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-500/10 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3.5 w-3.5 text-cyan-600" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Taxa Conversão</span>
            </div>
            <p className="text-lg font-bold text-foreground">{conversionRate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">{summary.paid} de {summary.total} pagos</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500/10 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3.5 w-3.5 text-rose-600" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Custo Operacional</span>
            </div>
            <p className="text-lg font-bold text-foreground">{operationalCostPercent.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">{formatCurrency(totalContractorValue)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Top Cliente</span>
            </div>
            <p className="text-sm font-bold text-foreground truncate">{topClient?.name || '-'}</p>
            <p className="text-[10px] text-muted-foreground">{topClient ? `${formatCurrency(topClient.revenue)} • ${topClient.count} serv.` : '-'}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">A Receber</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalToReceive)}</p>
            <p className="text-[10px] text-muted-foreground">{summary.inProgress + summary.completed + summary.overdue} pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ ROW 3: Pipeline + Financial Health + Cost Composition ═══ */}
      <div className="grid gap-3 lg:grid-cols-12">
        {/* Status pipeline */}
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Pipeline de Status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Em Andamento', value: summary.inProgressValue, count: summary.inProgress, color: 'text-blue-600', bg: 'bg-blue-500/10', icon: PlayCircle },
                { label: 'Ag. Pagamento', value: summary.completedValue, count: summary.completed, color: 'text-amber-600', bg: 'bg-amber-500/10', icon: Clock },
                { label: 'Ag. Acerto', value: summary.overdueValue, count: summary.overdue, color: 'text-orange-600', bg: 'bg-orange-500/10', icon: Receipt },
                { label: 'Pagos', value: summary.paidValue, count: summary.paid, color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle },
              ].map((item) => {
                const pct = summary.totalValue > 0 ? ((item.value / summary.totalValue) * 100).toFixed(1) : '0';
                return (
                  <div key={item.label} className={`rounded-lg ${item.bg} p-2.5 space-y-0.5`}>
                    <div className="flex items-center gap-1.5">
                      <item.icon className={`h-3 w-3 ${item.color}`} />
                      <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                    </div>
                    <p className={`text-sm font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                    <p className="text-[10px] text-muted-foreground">{item.count} serv. • {pct}%</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Financial health bars */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Saúde Financeira</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2.5">
            <MiniIndicator label="Margem Líquida" value={`${profitMargin.toFixed(1)}%`} percent={profitMargin} color="text-emerald-600" />
            <MiniIndicator label="Recebimento" value={`${paidPercent.toFixed(1)}%`} percent={paidPercent} color="text-primary" />
            <MiniIndicator label="Custos / Receita" value={`${costsPercent.toFixed(1)}%`} percent={costsPercent} color="text-destructive" />
            <MiniIndicator label="Conversão (Pagos)" value={`${conversionRate.toFixed(1)}%`} percent={conversionRate} color="text-violet-600" />
            <Separator />
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Já Recebido</span>
                <span className="font-medium text-emerald-600">{formatCurrency(summary.paidValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">A Receber</span>
                <span className="font-medium text-amber-600">{formatCurrency(totalToReceive)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost composition with % */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Composição de Custos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {costComposition.length > 0 ? (
              <div className="space-y-3">
                {costComposition.map((item, i) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-muted">
                          {item.percent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={item.percent} className="h-1.5" />
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Total Custos</span>
                  <span className="text-foreground">{formatCurrency(totalCosts)}</span>
                </div>
                {totalCardMachineFees > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Taxas Maquininha</span>
                    <span>{formatCurrency(totalCardMachineFees)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Sem dados de custos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ ROW 4: Top Clients Ranking ═══ */}
      {clientRanking.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Ranking de Clientes</CardTitle>
              <Badge variant="outline" className="text-[10px]">{clientRanking.length} clientes</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Cliente</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Receita</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Custos</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Lucro</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Margem</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Ticket Médio</th>
                    <th className="text-center py-2 text-muted-foreground font-medium">Serviços</th>
                  </tr>
                </thead>
                <tbody>
                  {clientRanking.slice(0, 8).map((c, i) => (
                    <tr key={c.fullName} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 font-semibold text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium text-foreground">{c.name}</td>
                      <td className="py-2 text-right text-foreground font-medium">{formatCurrency(c.revenue)}</td>
                      <td className="py-2 text-right text-destructive">{formatCurrency(c.costs)}</td>
                      <td className={`py-2 text-right font-medium ${c.profit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {formatCurrency(c.profit)}
                      </td>
                      <td className="py-2 text-right">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 ${c.margin >= 30 ? 'bg-emerald-500/15 text-emerald-600' : c.margin >= 15 ? 'bg-amber-500/15 text-amber-600' : 'bg-destructive/15 text-destructive'}`}>
                          {c.margin.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-2 text-right text-foreground">{formatCurrency(c.avgTicket)}</td>
                      <td className="py-2 text-center">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{c.count}</Badge>
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
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Rentabilidade por Obra/Serviço</CardTitle>
              {lowMarginCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-orange-500/15 text-orange-600 border-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lowMarginCount} com margem baixa
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ResponsiveContainer width="100%" height={Math.max(250, servicesProfitability.length * 28)}>
              <BarChart data={servicesProfitability} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={currencyFormatter} className="text-xs" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={90} className="text-xs" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={tooltipCurrencyFormatter}
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => {
                    const found = servicesProfitability.find(s => s.name === label);
                    return found ? `${found.fullName} (Margem: ${found.margin.toFixed(1)}%)` : label;
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Receita" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} stackId="a" />
                <Bar dataKey="costs" name="Custo" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ ROW 6: Charts ═══ */}
      {allServices.length > 0 ? (
        <div className="space-y-3">
          <MonthlyEvolutionChart data={monthlyData} />

          <div className="grid gap-3 lg:grid-cols-2">
            <ReceivedVsPendingChart data={monthlyData} />
            {statusData.length > 0 ? <StatusDistributionChart data={statusData} /> : <ClientDistributionChart data={clientRanking.slice(0, 10).map(c => ({ name: c.name, value: c.revenue }))} />}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {statusData.length > 0 && clientRanking.length > 0 && (
              <ClientDistributionChart data={clientRanking.slice(0, 10).map(c => ({ name: c.name, value: c.revenue }))} />
            )}
            {costPerServiceData.length > 0 && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Custos por Orçamento (% da Receita)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(280, costPerServiceData.length * 30)}>
                    <BarChart data={costPerServiceData} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={currencyFormatter} className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={95} className="text-xs" tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${props.payload.percent.toFixed(1)}% da receita)`,
                          'Custo'
                        ]}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="value" name="Custo" radius={[0, 4, 4, 0]}>
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
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Custos por Categoria (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {expenseCategoryData.map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground flex-1">{cat.name}</span>
                        <span className="font-medium text-foreground">{formatCurrency(cat.value)}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-0 bg-muted">{cat.percent.toFixed(1)}%</Badge>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value"
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
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Configure a integração com o Trello ou cadastre serviços para visualizar os gráficos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
