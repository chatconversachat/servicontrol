import { PageHeader } from '@/components/PageHeader';
import { ReceiptsTable } from '@/components/ReceiptsTable';
import { ReceiptFormDialog } from '@/components/ReceiptFormDialog';
import { TrelloCardsList } from '@/components/TrelloCardsList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/hooks/useServices';
import { useReceipts } from '@/hooks/useReceipts';
import { useTrelloFinancial } from '@/hooks/useTrelloFinancial';
import { exportReceiptsToExcel } from '@/lib/export';
import { Download, Loader2, RefreshCw, LayoutList } from 'lucide-react';
import { toast } from 'sonner';
import { Service, Receipt } from '@/types';
import { SmartFilters } from '@/components/SmartFilters';
import { getTrelloSettings } from '@/hooks/useSettings';

export default function ReceiptsPage() {
  const { services, loading: servicesLoading } = useServices();
  const { receipts, loading: receiptsLoading, addReceipt, deleteReceipt } = useReceipts();
  const { listsWithCards, loading: trelloLoading, error: trelloError, refetch: refetchTrello } = useTrelloFinancial();

  const trelloSettings = getTrelloSettings();
  const hasTrelloConfig = trelloSettings.apiKey && trelloSettings.token && trelloSettings.boardIds.length > 0;

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

  const isLoading = servicesLoading || receiptsLoading || (hasTrelloConfig && trelloLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCards = listsWithCards.reduce((sum, lc) => sum + lc.cards.length, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Controle de pagamentos recebidos"
        actions={
          <div className="flex gap-2 flex-wrap">
            {hasTrelloConfig && (
              <Button variant="outline" size="sm" onClick={refetchTrello} className="gap-1.5 text-xs md:text-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sincronizar</span>
                <span className="sm:hidden">Sync</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs md:text-sm">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
            <ReceiptFormDialog services={services as Service[]} onSubmit={handleAddReceipt} />
          </div>
        }
      />

      <SmartFilters />

      {hasTrelloConfig && listsWithCards.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <LayoutList className="h-4 w-4" />
            <span>Gestão Financeira — {listsWithCards.length} listas, {totalCards} cartões</span>
          </div>

          <Tabs defaultValue={listsWithCards[0]?.list.id} className="w-full">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="inline-flex w-auto h-auto gap-1 bg-muted/50 p-1">
                {listsWithCards.map(({ list, cards }) => (
                  <TabsTrigger
                    key={list.id}
                    value={list.id}
                    className="flex items-center gap-1 text-[11px] md:text-xs px-2.5 py-1.5 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {list.name}
                    <Badge variant="secondary" className="h-4 min-w-[16px] text-[9px] px-1">
                      {cards.length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {listsWithCards.map(({ list, cards }) => {
              const total = cards.reduce((sum, card) => {
                const match = `${card.name} ${card.desc}`.match(/R?\$\s*([\d.,]+)/);
                if (!match) return sum;
                const cleaned = match[1].replace(/\./g, '').replace(',', '.').trim();
                return sum + (parseFloat(cleaned) || 0);
              }, 0);

              return (
                <TabsContent key={list.id} value={list.id} className="mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 md:px-4 py-2.5 md:py-3">
                    <span className="text-xs md:text-sm text-muted-foreground font-medium">
                      Total ({cards.length} cartões)
                    </span>
                    <span className="text-base md:text-lg font-bold text-primary">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <TrelloCardsList cards={cards} />
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      ) : hasTrelloConfig && trelloError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:p-6 text-center">
          <p className="text-xs md:text-sm text-destructive">{trelloError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={refetchTrello}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="min-w-[500px] md:min-w-0 px-4 md:px-0">
          <ReceiptsTable
            receipts={receipts as Receipt[]}
            services={services as Service[]}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
