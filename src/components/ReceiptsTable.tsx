import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Receipt, Service } from '@/types';
import { formatCurrency, formatDate } from '@/lib/data';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReceiptsTableProps {
  receipts: Receipt[];
  services: Service[];
  onDelete: (id: string) => void;
}

export function ReceiptsTable({ receipts, services, onDelete }: ReceiptsTableProps) {
  const getServiceInfo = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? `${service.code} - ${service.client}` : 'Serviço não encontrado';
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead className="text-right">Valor Previsto</TableHead>
            <TableHead className="text-right">Valor Recebido</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
            <TableHead className="hidden md:table-cell">Observações</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Capital de Giro</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum recebimento registrado
              </TableCell>
            </TableRow>
          ) : (
            receipts.map((receipt) => (
              <TableRow key={receipt.id} className="animate-fade-in">
                <TableCell>{formatDate(receipt.date)}</TableCell>
                <TableCell className="font-medium">{getServiceInfo(receipt.serviceId)}</TableCell>
                <TableCell className="text-right">{formatCurrency(receipt.expectedValue)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(receipt.receivedValue)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-medium',
                    receipt.difference < 0 && 'text-destructive',
                    receipt.difference > 0 && 'text-success',
                    receipt.difference === 0 && 'text-muted-foreground'
                  )}
                >
                  {receipt.difference >= 0 ? '+' : ''}
                  {formatCurrency(receipt.difference)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                  {receipt.notes || '-'}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell font-medium">
                  {formatCurrency(receipt.workingCapital)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(receipt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
