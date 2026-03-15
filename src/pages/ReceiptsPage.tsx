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

  // Calculate total cards across all lists
  const totalCards = listsWithCards.reduce((sum, lc) => sum + lc.cards.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Controle de pagamentos recebidos"
        actions={
          <>
            {hasTrelloConfig && (
              <Button variant="outline" onClick={refetchTrello} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Sincronizar
              </Button>
            )}
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <ReceiptFormDialog services={services as Service[]} onSubmit={handleAddReceipt} />
          </>
        }
      />

      <SmartFilters />

      {hasTrelloConfig && listsWithCards.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LayoutList className="h-4 w-4" />
            <span>Gestão Financeira — {listsWithCards.length} listas, {totalCards} cartões</span>
          </div>

          <Tabs defaultValue={listsWithCards[0]?.list.id} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {listsWithCards.map(({ list, cards }) => (
                <TabsTrigger
                  key={list.id}
                  value={list.id}
                  className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {list.name}
                  <Badge variant="secondary" className="h-5 min-w-[20px] text-[10px] px-1.5">
                    {cards.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {listsWithCards.map(({ list, cards }) => {
              const total = cards.reduce((sum, card) => {
                const match = `${card.name} ${card.desc}`.match(/R?\$\s*([\d.,]+)/);
                if (!match) return sum;
                const cleaned = match[1].replace(/\./g, '').replace(',', '.').trim();
                return sum + (parseFloat(cleaned) || 0);
              }, 0);

              return (
                <TabsContent key={list.id} value={list.id} className="mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground font-medium">
                      Total da lista ({cards.length} cartões)
                    </span>
                    <span className="text-lg font-bold text-primary">
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{trelloError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={refetchTrello}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {/* Local receipts table always visible below */}
      <ReceiptsTable
        receipts={receipts as Receipt[]}
        services={services as Service[]}
        onDelete={handleDelete}
      />
    </div>
  );
}
