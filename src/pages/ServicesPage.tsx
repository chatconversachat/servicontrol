import { PageHeader } from '@/components/PageHeader';
import { ServicesTable } from '@/components/ServicesTable';
import { ServiceFormDialog } from '@/components/ServiceFormDialog';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { exportServicesToExcel } from '@/lib/export';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesPage() {
  const { services, addService, updateStatus, deleteService } = useServices();

  const handleAddService = (data: Parameters<typeof addService>[0]) => {
    addService(data);
    toast.success('Serviço cadastrado com sucesso!');
  };

  const handleDelete = (id: string) => {
    deleteService(id);
    toast.success('Serviço excluído com sucesso!');
  };

  const handleExport = () => {
    exportServicesToExcel(services);
    toast.success('Arquivo exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Gerencie todos os serviços prestados"
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <ServiceFormDialog onSubmit={handleAddService} />
          </>
        }
      />

      <ServicesTable
        services={services}
        onUpdateStatus={updateStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}
