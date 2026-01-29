import { PageHeader } from '@/components/PageHeader';
import { ReceiptsTable } from '@/components/ReceiptsTable';
import { ReceiptFormDialog } from '@/components/ReceiptFormDialog';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { exportReceiptsToExcel } from '@/lib/export';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ReceiptsPage() {
  const { services } = useServices();
  const { receipts, addReceipt, deleteReceipt } = useReceipts();

  const handleAddReceipt = (data: Parameters<typeof addReceipt>[0]) => {
    addReceipt(data);
    toast.success('Recebimento registrado com sucesso!');
  };

  const handleDelete = (id: string) => {
    deleteReceipt(id);
    toast.success('Recebimento excluído com sucesso!');
  };

  const handleExport = () => {
    exportReceiptsToExcel(receipts);
    toast.success('Arquivo exportado com sucesso!');
  };

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
            <ReceiptFormDialog services={services} onSubmit={handleAddReceipt} />
          </>
        }
      />

      <ReceiptsTable
        receipts={receipts}
        services={services}
        onDelete={handleDelete}
      />
    </div>
  );
}
