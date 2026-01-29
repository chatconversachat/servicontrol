import { PageHeader } from '@/components/PageHeader';
import { ReceiptsTable } from '@/components/ReceiptsTable';
import { ReceiptFormDialog } from '@/components/ReceiptFormDialog';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { exportReceiptsToExcel } from '@/lib/export';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Service, Receipt } from '@/types';

export default function ReceiptsPage() {
  const { services, loading: servicesLoading } = useServices();
  const { receipts, loading: receiptsLoading, addReceipt, deleteReceipt } = useReceipts();

  const handleAddReceipt = async (data: {
    serviceId: string;
    date: string;
    expectedValue: number;
    receivedValue: number;
    notes: string;
    workingCapital: number;
  }) => {
    const result = await addReceipt(data);
    if (result) {
      toast.success('Recebimento registrado com sucesso!');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteReceipt(id);
    toast.success('Recebimento excluído com sucesso!');
  };

  const handleExport = () => {
    const exportData = receipts.map(r => ({
      ...r,
      id: r.id,
      serviceId: r.serviceId || '',
      date: r.date,
      expectedValue: r.expectedValue,
      receivedValue: r.receivedValue,
      difference: r.difference,
      notes: r.notes,
      workingCapital: r.workingCapital,
      createdAt: r.createdAt,
    }));
    exportReceiptsToExcel(exportData as Receipt[]);
    toast.success('Arquivo exportado com sucesso!');
  };

  if (servicesLoading || receiptsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Controle de pagamentos recebidos"
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <ReceiptFormDialog services={services as Service[]} onSubmit={handleAddReceipt} />
          </>
        }
      />

      <ReceiptsTable
        receipts={receipts as Receipt[]}
        services={services as Service[]}
        onDelete={handleDelete}
      />
    </div>
  );
}
