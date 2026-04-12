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
import { formatCurrency } from '@/lib/data';
import { MoreHorizontal, Trash2, CheckCircle, Clock, Eye } from 'lucide-react';
import { ServiceDetailModal } from './ServiceDetailModal';
import { cn } from '@/lib/utils';

interface ServicesTableProps {
  services: Service[];
  onUpdateStatus: (id: string, status: ServiceStatus) => void;
  onDelete: (id: string) => void;
}

/**
 * Formats budget code: ensures format like "0001-26"
 * Takes the code string, pads the numeric part to 4 digits,
 * and appends the current 2-digit year suffix.
 */
function formatBudgetCode(code: string): string {
  // If already in format XXXX-YY, return as-is
  if (/^\d{4}-\d{2}$/.test(code)) return code;

  // Extract only digits from code
  const digits = code.replace(/\D/g, '');
  const num = parseInt(digits, 10) || 0;
  const year = new Date().getFullYear().toString().slice(-2);
  return `${num.toString().padStart(4, '0')}-${year}`;
}

export function ServicesTable({ services, onUpdateStatus, onDelete }: ServicesTableProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const saldo = (s: Service) => s.value - s.costs;

  // Totals
  const totalValor = services.reduce((sum, s) => sum + s.value, 0);
  const totalCustos = services.reduce((sum, s) => sum + s.costs, 0);
  const totalSaldo = services.reduce((sum, s) => sum + saldo(s), 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="w-[110px] font-bold text-xs">Nº Orçamento</TableHead>
            <TableHead className="font-bold text-xs">Cliente</TableHead>
            <TableHead className="font-bold text-xs hidden md:table-cell">Endereço</TableHead>
            <TableHead className="text-right font-bold text-xs">Valor Orçado</TableHead>
            <TableHead className="text-right font-bold text-xs">Custos</TableHead>
            <TableHead className="text-right font-bold text-xs">Saldo</TableHead>
            <TableHead className="font-bold text-xs w-[90px]">Status</TableHead>
            <TableHead className="w-[44px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                Nenhum serviço encontrado
              </TableCell>
            </TableRow>
          ) : (
            <>
              {services.map((service) => {
                const balance = saldo(service);
                return (
                  <TableRow
                    key={service.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors group"
                    onClick={() => setSelectedService(service)}
                  >
                    <TableCell className="font-mono font-semibold text-xs tracking-wide text-primary">
                      {formatBudgetCode(service.code)}
                    </TableCell>
                    <TableCell className="font-semibold text-sm py-3">
                      {service.client}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[220px] truncate">
                      {service.address || '—'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm tabular-nums">
                      {formatCurrency(service.value)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      <span className="text-red-600 font-medium">{formatCurrency(service.costs)}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      <span className={cn(
                        "font-bold",
                        balance >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrency(balance)}
                      </span>
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
                            <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
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
                );
              })}
              {/* Totals row */}
              <TableRow className="bg-muted/40 border-t-2 font-bold">
                <TableCell colSpan={2} className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total ({services.length} serviços)
                </TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell className="text-right text-sm tabular-nums">
                  {formatCurrency(totalValor)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-red-600">
                  {formatCurrency(totalCustos)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  <span className={cn(totalSaldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {formatCurrency(totalSaldo)}
                  </span>
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </>
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
