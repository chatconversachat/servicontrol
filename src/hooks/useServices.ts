import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
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
}

export function useServices() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedYear, selectedMonth, setAvailableYears } = useFilters();

  const fetchServices = useCallback(async () => {
    setLoading(true);

    if (!user) {
      setAllServices([]);
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`services_${user.id}`);
      const services = stored ? JSON.parse(stored) : [];
      setAllServices(services);

      if (services.length > 0) {
        const yearsSet = new Set<number>();
        services.forEach((s: Service) => {
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
    } catch (err) {
      console.error('Error fetching services:', err);
      toast.error('Erro ao carregar serviços');
    }
    setLoading(false);
  }, [user, setAvailableYears]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

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

  const servicesInProgress = useMemo(() => allServices.filter(s => s.status === 'in_progress'), [allServices]);
  const servicesWaitingPayment = useMemo(() => allServices.filter(s => s.status === 'completed'), [allServices]);
  const servicesWaitingSettlement = useMemo(() => allServices.filter(s => s.status === 'overdue'), [allServices]);

  const getServicesSummary = () => {
    const monthServices = monthlyServices;
    const total = monthServices.length;
    const pending = monthServices.filter(s => s.status === 'pending').length;
    const inProgress = monthServices.filter(s => s.status === 'in_progress').length;
    const completed = monthServices.filter(s => s.status === 'completed').length;
    const paid = monthServices.filter(s => s.status === 'paid').length;

    const totalValue = monthServices.reduce((sum, s) => sum + s.value, 0);
    const inProgressValue = monthServices.filter(s => s.status === 'in_progress').reduce((sum, s) => sum + s.value, 0);
    const completedValue = monthServices.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.value, 0);
    const paidValue = monthServices.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.value, 0);

    return {
      total,
      pending,
      inProgress,
      completed,
      paid,
      totalValue,
      inProgressValue,
      completedValue,
      paidValue,
    };
  };

  const addService = async (service: Omit<Service, 'id' | 'createdAt'>) => {
    if (!user) return null;

    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...allServices, newService];
    setAllServices(updated);
    localStorage.setItem(`services_${user.id}`, JSON.stringify(updated));
    toast.success('Serviço adicionado com sucesso!');
    return newService;
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    setAllServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, ...updates } : service
      )
    );
    
    if (user) {
      localStorage.setItem(`services_${user.id}`, JSON.stringify(allServices));
    }
    toast.success('Serviço atualizado com sucesso!');
  };

  const updateStatus = async (id: string, status: ServiceStatus) => {
    await updateService(id, { status });
  };

  const deleteService = async (id: string) => {
    const updated = allServices.filter((service) => service.id !== id);
    setAllServices(updated);
    
    if (user) {
      localStorage.setItem(`services_${user.id}`, JSON.stringify(updated));
    }
    toast.success('Serviço removido com sucesso!');
  };

  return {
    services: monthlyServices,
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
    getServicesSummary,
  };
}

