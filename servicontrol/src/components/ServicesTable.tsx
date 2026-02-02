import { useState } from 'react';
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
import { MoreHorizontal, Trash2, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { ServiceDetailModal } from './ServiceDetailModal';
import { cn } from '@/lib/utils';

interface ServicesTableProps {
  services: Service[];
  onUpdateStatus: (id: string, status: ServiceStatus) => void;
  onDelete: (id: string) => void;
}

export function ServicesTable({ services, onUpdateStatus, onDelete }: ServicesTableProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const profitValue = (service: Service) => service.value - service.costs;
  const profitMargin = (service: Service) => service.value > 0 ? (profitValue(service) / service.value) * 100 : 0;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px]">Código</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Custos</TableHead>
            <TableHead className="text-right hidden md:table-cell">Lucro</TableHead>
            <TableHead className="hidden lg:table-cell">Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum serviço cadastrado
              </TableCell>
            </TableRow>
          ) : (
            services.map((service) => (
              <TableRow
                key={service.id}
                className="animate-fade-in cursor-pointer hover:bg-muted/30 transition-colors group"
                onClick={() => setSelectedService(service)}
              >
                <TableCell className="font-mono font-medium text-xs">{service.code}</TableCell>
                <TableCell className="font-semibold py-4">
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="text-slate-900 leading-tight block">{service.client}</span>
                    {service.address && (
                      <span className="text-[10px] text-muted-foreground font-normal bg-slate-100 px-2 py-0.5 rounded-md inline-block w-fit">
                        📍 {service.address}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-slate-900">
                  {formatCurrency(service.value)}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <div className="flex flex-col items-end">
                    <span className="text-red-600 font-medium text-xs">{formatCurrency(service.costs)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {service.value > 0 ? ((service.costs / service.value) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "font-bold text-xs",
                      profitValue(service) >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(profitValue(service))}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {profitMargin(service).toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                  {formatDate(service.expectedDate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={service.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedService(service)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
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

      <ServiceDetailModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
}
