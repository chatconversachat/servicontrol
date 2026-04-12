import { Service, ServiceStatus } from '@/types';
import { formatCurrency } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ServiceDetailModal } from './ServiceDetailModal';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, CheckCircle, DollarSign, AlertTriangle } from 'lucide-react';

interface KanbanBoardProps {
  services: Service[];
  onUpdateStatus: (id: string, status: ServiceStatus) => void;
  onDelete: (id: string) => void;
}

const columns: { status: ServiceStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'pending', label: 'Pendente', icon: <Calendar className="h-4 w-4" />, color: 'border-t-yellow-500' },
  { status: 'in_progress', label: 'Em Andamento', icon: <Clock className="h-4 w-4" />, color: 'border-t-blue-500' },
  { status: 'completed', label: 'Concluído', icon: <CheckCircle className="h-4 w-4" />, color: 'border-t-emerald-500' },
  { status: 'paid', label: 'Pago', icon: <DollarSign className="h-4 w-4" />, color: 'border-t-green-600' },
  { status: 'overdue', label: 'Atrasado', icon: <AlertTriangle className="h-4 w-4" />, color: 'border-t-red-500' },
];

function formatBudgetCode(code: string): string {
  if (/^\d{4}-\d{2}$/.test(code)) return code;
  const digits = code.replace(/\D/g, '');
  const num = parseInt(digits, 10) || 0;
  const year = new Date().getFullYear().toString().slice(-2);
  return `${num.toString().padStart(4, '0')}-${year}`;
}

export function KanbanBoard({ services, onUpdateStatus, onDelete }: KanbanBoardProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const getColumnServices = (status: ServiceStatus) =>
    services.filter(s => s.status === status);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: ServiceStatus) => {
    e.preventDefault();
    if (draggedId) {
      onUpdateStatus(draggedId, status);
      setDraggedId(null);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {columns.map(col => {
          const colServices = getColumnServices(col.status);
          const totalValor = colServices.reduce((s, sv) => s + sv.value, 0);

          return (
            <div
              key={col.status}
              className={cn(
                "flex-shrink-0 w-[260px] md:w-full md:flex-1 rounded-xl border border-t-4 bg-card/50 backdrop-blur-sm flex flex-col",
                col.color
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {col.icon}
                    {col.label}
                  </div>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                    {colServices.length}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Total: {formatCurrency(totalValor)}
                </p>
              </div>

              {/* Cards */}
              <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
                <div className="p-2 space-y-2">
                  {colServices.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Nenhum serviço
                    </div>
                  ) : (
                    colServices.map(service => {
                      const balance = service.value - service.costs;
                      return (
                        <Card
                          key={service.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, service.id)}
                          onClick={() => setSelectedService(service)}
                          className={cn(
                            "p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:scale-[1.02] border",
                            draggedId === service.id && "opacity-50"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              {formatBudgetCode(service.code)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold truncate mb-3">
                            {service.client}
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Orçado</span>
                              <span className="font-semibold tabular-nums">{formatCurrency(service.value)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Custos</span>
                              <span className="font-medium tabular-nums text-red-600">{formatCurrency(service.costs)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 mt-1">
                              <span className="text-muted-foreground font-medium">Saldo</span>
                              <span className={cn(
                                "font-bold tabular-nums",
                                balance >= 0 ? "text-emerald-600" : "text-red-600"
                              )}>
                                {formatCurrency(balance)}
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      <ServiceDetailModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />
    </>
  );
}
