import { PageHeader } from '@/components/PageHeader';
import { ServiceFormDialog } from '@/components/ServiceFormDialog';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { exportServicesToExcel } from '@/lib/export';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '@/types';
import { KanbanBoard } from '@/components/KanbanBoard';

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

  const allServices = [
    ...monthlyServices,
    ...servicesInProgress,
    ...servicesWaitingPayment,
    ...servicesWaitingSettlement,
  ];

  // Deduplicate by id
  const uniqueServices = Array.from(
    new Map(allServices.map(s => [s.id, s])).values()
  );

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
      <PageHeader
        title="Serviços"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport(uniqueServices)} className="gap-1.5 text-xs md:text-sm">
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
            <ServiceFormDialog onSubmit={handleAddService} />
          </div>
        }
      />

      <KanbanBoard
        services={uniqueServices}
        onUpdateStatus={updateStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}
