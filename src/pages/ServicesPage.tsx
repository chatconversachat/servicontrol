import { PageHeader } from '@/components/PageHeader';
import { ServicesTable } from '@/components/ServicesTable';
import { ServiceFormDialog } from '@/components/ServiceFormDialog';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { exportServicesToExcel } from '@/lib/export';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '@/types';

export default function ServicesPage() {
  const { services, loading, addService, updateStatus, deleteService } = useServices();

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

  const handleExport = () => {
    const exportData = services.map(s => ({
      ...s,
      status: s.status,
    }));
    exportServicesToExcel(exportData as Service[]);
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
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <ServiceFormDialog onSubmit={handleAddService} />
          </>
        }
      />

      <ServicesTable
        services={services as Service[]}
        onUpdateStatus={updateStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}
