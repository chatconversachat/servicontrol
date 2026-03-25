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

  // Costs and financial breakdown
  const financials = useMemo(() => {
    const totalValue = allServices.reduce((sum, s) => sum + s.value, 0);
    const totalCosts = allServices.reduce((sum, s) => sum + (s.costs || 0), 0);
    const netBalance = totalValue - totalCosts;
    const margin = totalValue > 0 ? ((netBalance / totalValue) * 100) : 0;

    // Top clients
    const clientMap: Record<string, { count: number; value: number }> = {};
    allServices.forEach(s => {
      const name = s.client || 'Não identificado';
      if (!clientMap[name]) clientMap[name] = { count: 0, value: 0 };
      clientMap[name].count++;
      clientMap[name].value += s.value;
    });
    const topClients = Object.entries(clientMap)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 5);

    // Expense categories
    const categoryMap: Record<string, number> = {};
    allServices.forEach(s => {
      if (s.expenses) {
        s.expenses.forEach(exp => {
          const cat = exp.category || 'Outros';
          categoryMap[cat] = (categoryMap[cat] || 0) + exp.value;
        });
      }
    });
    const expenseCategories = Object.entries(categoryMap).sort(([, a], [, b]) => b - a);

    return { totalValue, totalCosts, netBalance, margin, topClients, expenseCategories };
  }, [allServices]);

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
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Resumo financeiro e análise de dados"
        actions={
          <Button onClick={handleExportAll} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Tudo
          </Button>
        }
      />

      <SmartFilters />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Resumo do Período */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Resumo do Período</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{periodLabel}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total de Serviços</span>
              <span className="font-bold text-lg">{services.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Faturamento Bruto</span>
              <span className="font-bold text-lg">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Média por Serviço</span>
              <span className="font-bold text-lg">{formatCurrency(averagePerService)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Situação Financeira */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <CardTitle>Situação Financeira</CardTitle>
              <p className="text-sm text-muted-foreground">Recebimentos e pendências</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">Total Recebido</span>
              </div>
              <span className="font-bold text-lg text-emerald-500">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">A Receber</span>
              </div>
              <span className="font-bold text-lg text-amber-500">{formatCurrency(totalPending)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Capital de Giro</span>
              </div>
              <span className="font-bold text-lg">{formatCurrency(workingCapital)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Geral (todos os quadros) */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Percent className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-base">Análise de Custos (Geral)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-sm text-muted-foreground">Faturamento Total</span>
              <span className="font-semibold">{formatCurrency(financials.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-sm text-muted-foreground">Total Custos</span>
              <span className="font-semibold text-red-500">{formatCurrency(financials.totalCosts)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b">
              <span className="text-sm text-muted-foreground">Saldo Líquido</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(financials.netBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-muted-foreground">Margem</span>
              <span className="font-semibold">{financials.margin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <CardTitle className="text-base">Top Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {financials.topClients.length > 0 ? (
              financials.topClients.map(([name, data], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]" title={name}>
                    {name.length > 20 ? name.substring(0, 20) + '...' : name}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatCurrency(data.value)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">({data.count})</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Custos por Categoria */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-red-500/10 p-3">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <CardTitle className="text-base">Custos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {financials.expenseCategories.length > 0 ? (
              financials.expenseCategories.map(([cat, val], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{cat}</span>
                  <span className="text-sm font-semibold text-red-500">{formatCurrency(val)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem custos detalhados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      {Object.keys(servicesByStatus).length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Serviços por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(servicesByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-lg border p-4 text-center transition-colors hover:bg-muted/50"
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{getStatusLabel(status)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
