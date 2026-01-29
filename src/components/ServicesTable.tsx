import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { Service, ServiceStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/data';
import { MoreHorizontal, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ServicesTableProps {
  services: Service[];
  onUpdateStatus: (id: string, status: ServiceStatus) => void;
  onDelete: (id: string) => void;
}

export function ServicesTable({ services, onUpdateStatus, onDelete }: ServicesTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Código</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="hidden sm:table-cell">Data Prevista</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhum serviço cadastrado
              </TableCell>
            </TableRow>
          ) : (
            services.map((service) => (
              <TableRow key={service.id} className="animate-fade-in">
                <TableCell className="font-mono font-medium">{service.code}</TableCell>
                <TableCell className="font-medium">{service.client}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                  {service.description}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(service.value)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDate(service.expectedDate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={service.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUpdateStatus(service.id, 'in_progress')}>
                        <Clock className="mr-2 h-4 w-4" />
                        Em Andamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(service.id, 'completed')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluído
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(service.id, 'paid')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-success" />
                        Marcar como Pago
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(service.id, 'overdue')}>
                        <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                        Marcar como Atrasado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(service.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
