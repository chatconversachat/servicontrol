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
    monthlyServices,
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
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Gerencie todos os serviços prestados"
        actions={
          <>
            <Button variant="outline" onClick={() => handleExport(monthlyServices)} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Mês
            </Button>
            <ServiceFormDialog onSubmit={handleAddService} />
          </>
        }
      />

      <Tabs defaultValue="monthly" className="w-full space-y-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto h-auto p-1 bg-white/50 backdrop-blur-sm border shadow-sm rounded-xl">
            <TabsTrigger value="monthly" className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Calendar className="h-4 w-4" />
              <span>Mensal</span>
              <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded-full">{monthlyServices.length}</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="h-4 w-4" />
              <span>Em Andamento</span>
              <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded-full">{servicesInProgress.length}</span>
            </TabsTrigger>
            <TabsTrigger value="waiting_payment" className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              <span>Ag. Pagamento</span>
              <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded-full">{servicesWaitingPayment.length}</span>
            </TabsTrigger>
            <TabsTrigger value="waiting_settlement" className="gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <UserCheck className="h-4 w-4" />
              <span>Ag. Acerto</span>
              <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded-full">{servicesWaitingSettlement.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="space-y-6">
          <SmartFilters />
          <ServicesTable
            services={monthlyServices}
            onUpdateStatus={updateStatus}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="in_progress">
          <ServicesTable
            services={servicesInProgress}
            onUpdateStatus={updateStatus}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="waiting_payment">
          <ServicesTable
            services={servicesWaitingPayment}
            onUpdateStatus={updateStatus}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="waiting_settlement">
          <ServicesTable
            services={servicesWaitingSettlement}
            onUpdateStatus={updateStatus}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
