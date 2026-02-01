import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'paid' | 'overdue';

interface Service {
  id: string;
  code: string;
  client: string;
  description: string;
  value: number;
  status: ServiceStatus;
  expectedDate: string;
  daysWorked: number;
  dailyRate: number;
  period: string;
  createdAt: string;
}

interface DbService {
  id: string;
  code: string;
  client: string;
  description: string;
  value: number;
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
  description: db.description,
  value: Number(db.value),
  status: db.status,
  expectedDate: db.expected_date,
  daysWorked: db.days_worked,
  dailyRate: Number(db.daily_rate),
  period: db.period,
  createdAt: db.created_at,
});

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchServices = useCallback(async () => {
    if (!user) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    } else {
      setServices((data || []).map(mapDbToService));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = async (service: Omit<Service, 'id' | 'createdAt'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('services')
      .insert({
        user_id: user.id,
        code: service.code,
        client: service.client,
        description: service.description,
        value: service.value,
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
    setServices((prev) => [newService, ...prev]);
    return newService;
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.code !== undefined) dbUpdates.code = updates.code;
    if (updates.client !== undefined) dbUpdates.client = updates.client;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
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

    setServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, ...updates } : service
      )
    );
  };

  const updateStatus = async (id: string, status: ServiceStatus) => {
    await updateService(id, { status });
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
      return;
    }

    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  const getServiceById = (id: string) => {
    return services.find((service) => service.id === id);
  };

  // Cálculos automáticos
  const getTotalValue = () => {
    return services.reduce((sum, service) => sum + service.value, 0);
  };

  const getTotalByStatus = (status: ServiceStatus) => {
    return services
      .filter((service) => service.status === status)
      .reduce((sum, service) => sum + service.value, 0);
  };

  const getTotalPending = () => {
    // Serviços pendentes (não pagos ainda)
    return services
      .filter((service) => service.status !== 'paid')
      .reduce((sum, service) => sum + service.value, 0);
  };

  const getTotalInProgress = () => {
    return getTotalByStatus('in_progress');
  };

  const getTotalCompleted = () => {
    return getTotalByStatus('completed');
  };

  const getTotalPaid = () => {
    return getTotalByStatus('paid');
  };

  const getTotalOverdue = () => {
    return getTotalByStatus('overdue');
  };

  const getCountByStatus = (status: ServiceStatus) => {
    return services.filter((service) => service.status === status).length;
  };

  const getServicesSummary = () => {
    return {
      total: services.length,
      totalValue: getTotalValue(),
      pending: getCountByStatus('pending'),
      pendingValue: getTotalByStatus('pending'),
      inProgress: getCountByStatus('in_progress'),
      inProgressValue: getTotalInProgress(),
      completed: getCountByStatus('completed'),
      completedValue: getTotalCompleted(),
      paid: getCountByStatus('paid'),
      paidValue: getTotalPaid(),
      overdue: getCountByStatus('overdue'),
      overdueValue: getTotalOverdue(),
      toReceive: getTotalPending(),
    };
  };

  return {
    services,
    loading,
    addService,
    updateService,
    updateStatus,
    deleteService,
    getServiceById,
    refetch: fetchServices,
    // Cálculos automáticos
    getTotalValue,
    getTotalByStatus,
    getTotalPending,
    getTotalInProgress,
    getTotalCompleted,
    getTotalPaid,
    getTotalOverdue,
    getCountByStatus,
    getServicesSummary,
  };
}
