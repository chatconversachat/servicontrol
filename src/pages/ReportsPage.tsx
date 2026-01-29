import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency, calculateMonthlySummary, getStatusLabel } from '@/lib/data';
import { exportAllToExcel } from '@/lib/export';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { services } = useServices();
  const { receipts, getLatestWorkingCapital } = useReceipts();

  const summary = calculateMonthlySummary(services, receipts);
  const workingCapital = getLatestWorkingCapital();

  const servicesByStatus = services.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportAll = () => {
    exportAllToExcel(services, receipts);
    toast.success('Relatório completo exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Resumo mensal e exportação de dados"
        actions={
          <Button onClick={handleExportAll} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Tudo
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Resumo do Mês</CardTitle>
              <p className="text-sm text-muted-foreground">
                {summary.month} {summary.year}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total de Serviços</span>
              <span className="font-bold text-lg">{summary.totalServices}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Valor Total</span>
              <span className="font-bold text-lg">
                {formatCurrency(summary.totalReceived + summary.totalPending)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Média por Serviço</span>
              <span className="font-bold text-lg">{formatCurrency(summary.averagePerService)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-success/10 p-3">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <CardTitle>Situação Financeira</CardTitle>
              <p className="text-sm text-muted-foreground">Recebimentos e pendências</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-muted-foreground">Total Recebido</span>
              </div>
              <span className="font-bold text-lg text-success">
                {formatCurrency(summary.totalReceived)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-warning" />
                <span className="text-muted-foreground">A Receber</span>
              </div>
              <span className="font-bold text-lg text-warning">
                {formatCurrency(summary.totalPending)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Capital de Giro</span>
              <span className="font-bold text-lg">{formatCurrency(workingCapital)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
