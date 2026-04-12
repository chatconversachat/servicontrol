import { PageHeader } from '@/components/PageHeader';
import { ServicesTable } from '@/components/ServicesTable';
import { ServiceFormDialog } from '@/components/ServiceFormDialog';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { exportServicesToExcel } from '@/lib/export';
import { Download, Loader2, Calendar, Clock, DollarSign, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '@/types';
import { SmartFilters } from '@/components/SmartFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServicesPage() {
  const {
    services: monthlyServices,
    servicesInProgress,
    servicesWaitingPayment,
    servicesWaitingSettlement,
    loading,
    addService,
    updateStatus,
    deleteService
  } = useServices();

  const handleAddService = async (data: Omit<Service, 'id' | 'createdAt'>) => {
    const result = await addService(data);
    if (result) {
      toast.success('Serviço cadastrado com sucesso!');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteService(id);
    toast.success('Serviço excluído com sucesso!');
  };

  const handleExport = (data: Service[]) => {
    exportServicesToExcel(data);
    toast.success('Arquivo exportado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Tabs defaultValue="monthly" className="w-full space-y-4 md:space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto md:grid md:grid-cols-4 md:w-full h-auto p-1 bg-muted/50 backdrop-blur-sm border shadow-sm rounded-xl gap-1">
            <TabsTrigger value="monthly" className="gap-1.5 px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm whitespace-nowrap">
              <Calendar className="h-3.5 w-3.5" />
              <span>Mensal</span>
              <span className="ml-0.5 text-[9px] md:text-[10px] bg-muted text-muted-foreground px-1.5 rounded-full data-[state=active]:bg-primary-foreground/20">{monthlyServices.length}</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-1.5 px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              <span>Andamento</span>
              <span className="ml-0.5 text-[9px] md:text-[10px] bg-muted text-muted-foreground px-1.5 rounded-full">{servicesInProgress.length}</span>
            </TabsTrigger>
            <TabsTrigger value="waiting_payment" className="gap-1.5 px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm whitespace-nowrap">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Pagamento</span>
              <span className="ml-0.5 text-[9px] md:text-[10px] bg-muted text-muted-foreground px-1.5 rounded-full">{servicesWaitingPayment.length}</span>
            </TabsTrigger>
            <TabsTrigger value="waiting_settlement" className="gap-1.5 px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm whitespace-nowrap">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Acerto</span>
              <span className="ml-0.5 text-[9px] md:text-[10px] bg-muted text-muted-foreground px-1.5 rounded-full">{servicesWaitingSettlement.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <PageHeader
          title="Serviços"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport(monthlyServices)} className="gap-1.5 text-xs md:text-sm">
                <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Exportar Mês</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
              <ServiceFormDialog onSubmit={handleAddService} />
            </div>
          }
        />

        <TabsContent value="monthly" className="space-y-4 md:space-y-6">
          <SmartFilters />
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[600px] md:min-w-0 px-4 md:px-0">
              <ServicesTable
                services={monthlyServices}
                onUpdateStatus={updateStatus}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="in_progress">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[600px] md:min-w-0 px-4 md:px-0">
              <ServicesTable
                services={servicesInProgress}
                onUpdateStatus={updateStatus}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="waiting_payment">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[600px] md:min-w-0 px-4 md:px-0">
              <ServicesTable
                services={servicesWaitingPayment}
                onUpdateStatus={updateStatus}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="waiting_settlement">
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[600px] md:min-w-0 px-4 md:px-0">
              <ServicesTable
                services={servicesWaitingSettlement}
                onUpdateStatus={updateStatus}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
