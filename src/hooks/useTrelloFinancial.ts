import { useState, useEffect, useCallback } from 'react';
import { createTrelloClient } from '@/integrations/trello/client';
import { getTrelloSettings } from '@/hooks/useSettings';
import { TrelloCard, TrelloList } from '@/integrations/trello/types';
import { toast } from 'sonner';

export interface TrelloListWithCards {
  list: TrelloList;
  cards: TrelloCard[];
}

export function useTrelloFinancial() {
  const [listsWithCards, setListsWithCards] = useState<TrelloListWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { boardIds, savedBoards } = getTrelloSettings();

  // Find the "Gestão Financeira" board or fall back to first configured board
  const financialBoardId = (() => {
    const financialBoard = savedBoards.find(b =>
      b.name.toLowerCase().includes('gestão financeira') ||
      b.name.toLowerCase().includes('gestao financeira')
    );
    if (financialBoard && boardIds.includes(financialBoard.id)) {
      return financialBoard.id;
    }
    // Fallback: use first configured board
    return boardIds.length > 0 ? boardIds[0] : null;
  })();

  const fetchData = useCallback(async () => {
    if (!financialBoardId) {
      setLoading(false);
      setError('Nenhum quadro configurado. Vá em Configurações para selecionar o quadro "Gestão Financeira".');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = createTrelloClient();
      const [lists, cards] = await Promise.all([
        client.getLists(financialBoardId),
        client.getCards(financialBoardId),
      ]);

      const grouped: TrelloListWithCards[] = lists.map(list => ({
        list,
        cards: cards.filter(card => card.idList === list.id),
      }));

      setListsWithCards(grouped);
    } catch (err: any) {
      console.error('Error fetching Trello financial data:', err);
      setError('Erro ao carregar dados do Trello. Verifique suas credenciais.');
      toast.error('Erro ao carregar dados do quadro financeiro');
    } finally {
      setLoading(false);
    }
  }, [financialBoardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    listsWithCards,
    loading,
    error,
    refetch: fetchData,
    boardId: financialBoardId,
  };
}
