import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { createTrelloClient } from '@/integrations/trello/client';
import { mapTrelloCardToService } from '@/integrations/trello/mapper';
import { getTrelloSettings } from '@/hooks/useSettings';
import { useFilters } from '@/contexts/FilterContext';

export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'paid' | 'overdue';

export interface Service {
  id: string;
  code: string;
  client: string;
  description: string;
  value: number;
  costs: number;
  status: ServiceStatus;
  expectedDate: string;
  daysWorked: number;
  dailyRate: number;
  period: string;
  createdAt: string;
  address?: string;
  contractorName?: string;
  contractorValue?: number;
  contractorPayments?: { date: string; value: number; type: string }[];
  expenses?: { date: string; value: number; description: string; category?: string }[];
  cardMachineFee?: number;
  netBalance?: number;
}

interface DbService {
  id: string;
  code: string;
  client: string;
  address?: string;
  description: string;
  value: number;
  costs?: number;
  status: ServiceStatus;
  expected_date: string;
  days_worked: number;
  daily_rate: number;
  period: string;
  created_at: string;
}

const mapDbToService = (db: DbService): Service => ({
  id: db.id,
  code: db.code,
  client: db.client,
  address: db.address,
  description: db.description,
  value: Number(db.value),
  costs: Number(db.costs || 0),
  status: db.status,
  expectedDate: db.expected_date,
  daysWorked: db.days_worked,
  dailyRate: Number(db.daily_rate),
  period: db.period,
  createdAt: db.created_at,
});

export function useServices() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedYear, selectedMonth, setAvailableYears } = useFilters();

  const { boardIds: trelloBoardIds } = getTrelloSettings();
  const useTrello = trelloBoardIds && trelloBoardIds.length > 0;

  const fetchServices = useCallback(async () => {
    setLoading(true);

    if (useTrello) {
      try {
        const trelloClient = createTrelloClient();

        const allServicesArrays = await Promise.all(
          trelloBoardIds.map(async (boardId) => {
            try {
              const [cards, lists] = await Promise.all([
                trelloClient.getCards(boardId),
                trelloClient.getLists(boardId)
              ]);
              return cards.map(card => mapTrelloCardToService(card, lists));
            } catch (e) {
              console.error(`Error fetching board ${boardId}:`, e);
              return [];
            }
          })
        );

        const allFetched = allServicesArrays.flat();
        setAllServices(allFetched);
      } catch (err: any) {
        console.error('Error fetching Trello services:', err);
        toast.error('Erro ao carregar dados do Trello. Verifique suas configurações.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!user) {
      setAllServices([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    } else {
      setAllServices((data || []).map(mapDbToService));
    }
    setLoading(false);
  }, [user, trelloBoardIds.join(','), useTrello]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (allServices.length > 0) {
      const yearsSet = new Set<number>();
      allServices.forEach(s => {
        const dateStr = s.expectedDate || s.createdAt;
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            yearsSet.add(date.getFullYear());
          }
        }
      });
      if (yearsSet.size > 0) {
        setAvailableYears(Array.from(yearsSet).sort((a, b) => b - a));
      }
    }
  }, [allServices, setAvailableYears]);

  // Filtro Mensal (Apenas cards de listas de meses)
  const monthlyServices = useMemo(() => {
    return allServices.filter(s => {
      if (s.period !== 'monthly') return false;

      const dateStr = s.expectedDate || s.createdAt;
      if (!dateStr) return false;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;

      const matchesYear = date.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;

      return matchesYear && matchesMonth;
    });
  }, [allServices, selectedYear, selectedMonth]);

  // Outros status (Cards de listas específicas, independente do filtro de mês)
  const servicesInProgress = useMemo(() => allServices.filter(s => s.status === 'in_progress'), [allServices]);
  const servicesWaitingPayment = useMemo(() => allServices.filter(s => s.status === 'completed'), [allServices]);
  const servicesWaitingSettlement = useMemo(() => allServices.filter(s => s.status === 'overdue'), [allServices]);

  const addService = async (service: Omit<Service, 'id' | 'createdAt'>) => {
    if (useTrello) {
      toast.info('Adição de serviços desabilitada em modo Trello (Somente Leitura)');
      return null;
    }
    if (!user) return null;

    const { data, error } = await supabase
      .from('services')
      .insert({
        user_id: user.id,
        code: service.code,
        client: service.client,
        address: service.address,
        description: service.description,
        value: service.value,
        costs: service.costs,
        status: service.status,
        expected_date: service.expectedDate,
        days_worked: service.daysWorked,
        daily_rate: service.dailyRate,
        period: service.period,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding service:', error);
      toast.error('Erro ao cadastrar serviço');
      return null;
    }

    const newService = mapDbToService(data);
    setAllServices((prev) => [newService, ...prev]);
    return newService;
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    if (useTrello) {
      toast.info('Edição desabilitada em modo Trello (Somente Leitura)');
      return;
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.code !== undefined) dbUpdates.code = updates.code;
    if (updates.client !== undefined) dbUpdates.client = updates.client;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.costs !== undefined) dbUpdates.costs = updates.costs;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.expectedDate !== undefined) dbUpdates.expected_date = updates.expectedDate;
    if (updates.daysWorked !== undefined) dbUpdates.days_worked = updates.daysWorked;
    if (updates.dailyRate !== undefined) dbUpdates.daily_rate = updates.dailyRate;
    if (updates.period !== undefined) dbUpdates.period = updates.period;

    const { error } = await supabase
      .from('services')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating service:', error);
      toast.error('Erro ao atualizar serviço');
      return;
    }

    setAllServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, ...updates } : service
      )
    );
  };

  const updateStatus = async (id: string, status: ServiceStatus) => {
    if (useTrello) {
      toast.info('Atualização de status desabilitada em modo Trello');
      return;
    }
    await updateService(id, { status });
  };

  const deleteService = async (id: string) => {
    if (useTrello) {
      toast.info('Exclusão desabilitada em modo Trello');
      return;
    }
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
      return;
    }

    setAllServices((prev) => prev.filter((service) => service.id !== id));
  };

  return {
    services: monthlyServices, // Mantendo compatibilidade com código existente que espera filteredServices
    monthlyServices,
    servicesInProgress,
    servicesWaitingPayment,
    servicesWaitingSettlement,
    allServices,
    loading,
    addService,
    updateService,
    updateStatus,
    deleteService,
    refetch: fetchServices,
  };
}
