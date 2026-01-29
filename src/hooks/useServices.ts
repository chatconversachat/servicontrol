import { useState } from 'react';
import { Service, ServiceStatus } from '@/types';
import { mockServices } from '@/lib/data';

export function useServices() {
  const [services, setServices] = useState<Service[]>(mockServices);

  const addService = (service: Omit<Service, 'id' | 'createdAt'>) => {
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setServices((prev) => [...prev, newService]);
    return newService;
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, ...updates } : service
      )
    );
  };

  const updateStatus = (id: string, status: ServiceStatus) => {
    updateService(id, { status });
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  const getServiceById = (id: string) => {
    return services.find((service) => service.id === id);
  };

  return {
    services,
    addService,
    updateService,
    updateStatus,
    deleteService,
    getServiceById,
  };
}
