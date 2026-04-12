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

export default function ReportsPage() {
  const { services, allServices, loading: servicesLoading } = useServices();
  const { receipts, loading: receiptsLoading, getLatestWorkingCapital, getTotalReceived } = useReceipts();
  const { selectedMonth, selectedYear } = useFilters();

  const financials = useMemo(() => {
    const totalValue = services.reduce((sum, s) => sum + s.value, 0);
    const totalCosts = services.reduce((sum, s) => sum + (s.costs || 0), 0);
    const netBalance = totalValue - totalCosts;
    const margin = totalValue > 0 ? ((netBalance / totalValue) * 100) : 0;

    const clientMap: Record<string, { count: number; value: number }> = {};
    services.forEach(s => {
      const name = s.client || 'Não identificado';
      if (!clientMap[name]) clientMap[name] = { count: 0, value: 0 };
      clientMap[name].count++;
      clientMap[name].value += s.value;
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
    const expenseCategories = Object.entries(categoryMap).sort(([, a], [, b]) => b - a);

    return { totalValue, totalCosts, netBalance, margin, topClients, expenseCategories };
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
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Relatórios"
        description="Resumo financeiro e análise de dados"
        actions={
          <Button size="sm" onClick={handleExportAll} className="gap-1.5 text-xs md:text-sm">
            <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Exportar Tudo
          </Button>
        }
      />

      <SmartFilters />

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 md:gap-4 pb-3">
            <div className="rounded-lg bg-primary/10 p-2.5 md:p-3">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base md:text-lg">Resumo do Período</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground capitalize">{periodLabel}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-xs md:text-sm text-muted-foreground">Total de Serviços</span>
              <span className="font-bold text-base md:text-lg">{services.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-xs md:text-sm text-muted-foreground">Faturamento Bruto</span>
              <span className="font-bold text-base md:text-lg">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-xs md:text-sm text-muted-foreground">Média por Serviço</span>
              <span className="font-bold text-base md:text-lg">{formatCurrency(averagePerService)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 md:gap-4 pb-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5 md:p-3">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-base md:text-lg">Situação Financeira</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">Recebimentos e pendências</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs md:text-sm text-muted-foreground">Total Recebido</span>
              </div>
              <span className="font-bold text-base md:text-lg text-emerald-500">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs md:text-sm text-muted-foreground">A Receber</span>
              </div>
              <span className="font-bold text-base md:text-lg text-amber-500">{formatCurrency(totalPending)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs md:text-sm text-muted-foreground">Capital de Giro</span>
              </div>
              <span className="font-bold text-base md:text-lg">{formatCurrency(workingCapital)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Percent className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            </div>
            <CardTitle className="text-sm md:text-base">Análise de Custos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-xs text-muted-foreground">Faturamento Total</span>
              <span className="font-semibold text-sm">{formatCurrency(financials.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-xs text-muted-foreground">Total Custos</span>
              <span className="font-semibold text-sm text-destructive">{formatCurrency(financials.totalCosts)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-xs text-muted-foreground">Saldo Líquido</span>
              <span className="font-semibold text-sm text-emerald-500">{formatCurrency(financials.netBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-muted-foreground">Margem</span>
              <span className="font-semibold text-sm">{financials.margin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
            </div>
            <CardTitle className="text-sm md:text-base">Top Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {financials.topClients.length > 0 ? (
              financials.topClients.map(([name, data], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[150px]" title={name}>
                    {name.length > 18 ? name.substring(0, 18) + '...' : name}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-semibold">{formatCurrency(data.value)}</span>
                    <span className="text-[9px] text-muted-foreground ml-1">({data.count})</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="rounded-lg bg-destructive/10 p-2.5">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            </div>
            <CardTitle className="text-sm md:text-base">Custos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {financials.expenseCategories.length > 0 ? (
              financials.expenseCategories.map(([cat, val], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <span className="text-xs text-muted-foreground">{cat}</span>
                  <span className="text-xs font-semibold text-destructive">{formatCurrency(val)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Sem custos detalhados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {Object.keys(servicesByStatus).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base">Serviços por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(servicesByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-lg border p-3 md:p-4 text-center transition-colors hover:bg-muted/50"
                >
                  <p className="text-xl md:text-2xl font-bold">{count as number}</p>
                  <p className="text-[10px] md:text-sm text-muted-foreground">{getStatusLabel(status)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
