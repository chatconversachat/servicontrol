import { TrelloCard } from '@/integrations/trello/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MessageSquare } from 'lucide-react';

interface TrelloCardsListProps {
  cards: TrelloCard[];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return null;
  }
}

const labelColorMap: Record<string, string> = {
  green: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  yellow: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  red: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  sky: 'bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/30',
  lime: 'bg-lime-500/20 text-lime-700 dark:text-lime-400 border-lime-500/30',
  pink: 'bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/30',
  black: 'bg-zinc-700/20 text-zinc-300 border-zinc-500/30',
};

function parseBrazilianValue(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/R?\$?\s*/gi, '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(cleaned) || 0;
}

function extractValue(text: string): number | null {
  const match = text.match(/R?\$\s*([\d.,]+)/);
  if (match) return parseBrazilianValue(match[1]);
  return null;
}

export function TrelloCardsList({ cards }: TrelloCardsListProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum cartão nesta lista
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const value = extractValue(`${card.name} ${card.desc}`);
        const dueDate = formatDate(card.due);
        const hasDesc = card.desc && card.desc.trim().length > 0;

        return (
          <Card key={card.id} className="hover:shadow-md transition-shadow border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-semibold leading-tight">
                  {card.name}
                </CardTitle>
                {value !== null && (
                  <span className="text-sm font-bold text-primary whitespace-nowrap">
                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              {card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {card.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${labelColorMap[label.color] || 'bg-muted text-muted-foreground'}`}
                    >
                      {label.name || label.color}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {hasDesc && (
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line mb-2">
                  {card.desc}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {dueDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {dueDate}
                  </span>
                )}
                {hasDesc && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Descrição
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
