import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency, getStatusLabel } from '@/lib/data';
import { exportAllToExcel } from '@/lib/export';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, Loader2, Users, Percent, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Service, Receipt } from '@/types';
import { SmartFilters } from '@/components/SmartFilters';
import { useFilters } from '@/contexts/FilterContext';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { services, allServices, loading: servicesLoading } = useServices();
  const { receipts, loading: receiptsLoading, getLatestWorkingCapital, getTotalReceived } = useReceipts();
  const { selectedMonth, selectedYear } = useFilters();

  const financials = useMemo(() => {
    const totalValue = services.reduce((sum, s) => sum + s.value, 0);
    const totalCosts = services.reduce((sum, s) => sum + (s.costs || 0), 0);
    const netBalance = totalValue - totalCosts;
    const margin = totalValue > 0 ? ((netBalance / totalValue) * 100) : 0;

    const clientMap: Record<string, { count: number; value: number; costs: number }> = {};
    services.forEach(s => {
      const name = s.client || 'Não identificado';
      if (!clientMap[name]) clientMap[name] = { count: 0, value: 0, costs: 0 };
      clientMap[name].count++;
      clientMap[name].value += s.value;
      clientMap[name].costs += s.costs || 0;
    });
    const topClients = Object.entries(clientMap)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 5);

    const categoryMap: Record<string, number> = {};
    services.forEach(s => {
      if (s.expenses) {
        s.expenses.forEach(exp => {
          const cat = exp.category || 'Outros';
          categoryMap[cat] = (categoryMap[cat] || 0) + exp.value;
        });
      }
    });
    const totalCategoryExpenses = Object.values(categoryMap).reduce((s, v) => s + v, 0);
    const expenseCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, val]) => ({
        category: cat,
        value: val,
        percentOfCategory: totalCategoryExpenses > 0 ? (val / totalCategoryExpenses) * 100 : 0,
        percentOfTotal: totalValue > 0 ? (val / totalValue) * 100 : 0,
      }));

    return { totalValue, totalCosts, netBalance, margin, topClients, expenseCategories, totalCategoryExpenses };
  }, [services]);

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

  const servicesByStatus = services.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportAll = () => {
    const servicesExport = services.map(s => ({ ...s, status: s.status })) as Service[];
    const receiptsExport = receipts.map(r => ({ ...r, serviceId: r.serviceId || '' })) as Receipt[];
    exportAllToExcel(servicesExport, receiptsExport);
    toast.success('Relatório completo exportado com sucesso!');
  };

  const periodLabel = selectedMonth === 'all'
    ? `Ano de ${selectedYear}`
    : new Date(selectedYear, selectedMonth as number).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3 md:space-y-4">
      <PageHeader
        title="Relatórios"
        description="Resumo financeiro e análise de dados"
        actions={
          <Button size="sm" onClick={handleExportAll} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        }
      />

      <SmartFilters />

      {/* KPIs Row */}
      <div className="grid gap-2 md:gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-md bg-primary/10 p-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Faturamento</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(totalValue)}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{periodLabel}</p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-md bg-emerald-500/10 p-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Saldo Líquido</span>
          </div>
          <p className={cn("text-lg font-bold tabular-nums", financials.netBalance >= 0 ? "text-emerald-600" : "text-red-600")}>
            {formatCurrency(financials.netBalance)}
          </p>
          <p className="text-[10px] text-muted-foreground">Margem {financials.margin.toFixed(1)}%</p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-md bg-red-500/10 p-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Custos</span>
          </div>
          <p className="text-lg font-bold tabular-nums text-red-600">{formatCurrency(financials.totalCosts)}</p>
          <p className="text-[10px] text-muted-foreground">
            {totalValue > 0 ? ((financials.totalCosts / totalValue) * 100).toFixed(1) : '0'}% do faturamento
          </p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-md bg-blue-500/10 p-1.5">
              <Wallet className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Capital de Giro</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(workingCapital)}</p>
          <p className="text-[10px] text-muted-foreground">Ticket médio {formatCurrency(averagePerService)}</p>
        </Card>
      </div>

      {/* Financial Details + Top Clients + Cost Categories */}
      <div className="grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-3">
        {/* Situação Financeira */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-emerald-500/10 p-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <CardTitle className="text-xs font-semibold">Situação Financeira</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-[10px] text-muted-foreground">Serviços</span>
              <span className="text-xs font-bold">{services.length}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Recebido</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] text-muted-foreground">A Receber</span>
              </div>
              <span className="text-xs font-bold text-amber-500">{formatCurrency(totalPending)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[10px] text-muted-foreground">Média/Serviço</span>
              <span className="text-xs font-bold">{formatCurrency(averagePerService)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-purple-500/10 p-1.5">
                <Users className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <CardTitle className="text-xs font-semibold">Top Clientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            {financials.topClients.length > 0 ? (
              financials.topClients.map(([name, data], i) => {
                const clientMargin = data.value > 0 ? ((data.value - data.costs) / data.value * 100) : 0;
                return (
                  <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-bold text-muted-foreground w-3">{i + 1}.</span>
                      <span className="text-[10px] truncate max-w-[100px]" title={name}>{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold">{formatCurrency(data.value)}</span>
                      <span className={cn(
                        "text-[9px] font-medium px-1 rounded",
                        clientMargin >= 30 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      )}>
                        {clientMargin.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-muted-foreground py-2">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Custos por Categoria */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-red-500/10 p-1.5">
                <Percent className="h-3.5 w-3.5 text-red-500" />
              </div>
              <CardTitle className="text-xs font-semibold">Custos por Categoria</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            {financials.expenseCategories.length > 0 ? (
              <>
                {financials.expenseCategories.map((item, i) => (
                  <div key={i} className="py-1 border-b last:border-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">{item.category}</span>
                      <span className="text-[10px] font-bold text-red-600">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        <div className="w-full bg-muted rounded-full h-1 flex-1 min-w-[40px]">
                          <div
                            className="bg-red-500 h-1 rounded-full"
                            style={{ width: `${Math.min(item.percentOfCategory, 100)}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                          {item.percentOfCategory.toFixed(1)}% cat.
                        </span>
                      </div>
                      <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                        {item.percentOfTotal.toFixed(1)}% geral
                      </span>
                    </div>
                  </div>
                ))}
                {/* Total da categoria */}
                <div className="flex justify-between items-center pt-1 mt-1 border-t">
                  <span className="text-[10px] font-semibold text-muted-foreground">Total Categorias</span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-red-600">{formatCurrency(financials.totalCategoryExpenses)}</span>
                    <span className="text-[8px] text-muted-foreground ml-1">
                      ({totalValue > 0 ? ((financials.totalCategoryExpenses / totalValue) * 100).toFixed(1) : '0'}% geral)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground py-2">Sem custos detalhados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Grid */}
      {Object.keys(servicesByStatus).length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-semibold">Serviços por Status</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(servicesByStatus).map(([status, count]) => (
                <div key={status} className="rounded-lg border p-2 text-center hover:bg-muted/50 transition-colors">
                  <p className="text-lg font-bold">{count as number}</p>
                  <p className="text-[9px] text-muted-foreground">{getStatusLabel(status)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
