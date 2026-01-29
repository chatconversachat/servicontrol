import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Receipt, Service } from '@/types';

const receiptSchema = z.object({
  serviceId: z.string().min(1, 'Serviço é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  expectedValue: z.coerce.number().min(0, 'Valor deve ser positivo'),
  receivedValue: z.coerce.number().min(0, 'Valor deve ser positivo'),
  notes: z.string().max(500).optional(),
  workingCapital: z.coerce.number().min(0),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface ReceiptFormDialogProps {
  services: Service[];
  onSubmit: (data: Omit<Receipt, 'id' | 'createdAt' | 'difference'>) => void;
  trigger?: React.ReactNode;
}

export function ReceiptFormDialog({ services, onSubmit, trigger }: ReceiptFormDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      serviceId: '',
      date: '',
      expectedValue: 0,
      receivedValue: 0,
      notes: '',
      workingCapital: 0,
    },
  });

  const handleSubmit = (data: ReceiptFormData) => {
    onSubmit({
      serviceId: data.serviceId,
      date: data.date,
      expectedValue: data.expectedValue,
      receivedValue: data.receivedValue,
      notes: data.notes || '',
      workingCapital: data.workingCapital,
    });
    form.reset();
    setOpen(false);
  };

  const selectedServiceId = form.watch('serviceId');
  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Recebimento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const service = services.find((s) => s.id === value);
                      if (service) {
                        form.setValue('expectedValue', service.value);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.code} - {service.client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedService && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{selectedService.description}</p>
                <p className="text-muted-foreground">
                  Valor total: R$ {selectedService.value.toLocaleString('pt-BR')}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Recebimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Previsto (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receivedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Recebido (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="workingCapital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capital de Giro (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
