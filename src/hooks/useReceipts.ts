import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';

interface Receipt {
  id: string;
  serviceId: string | null;
  date: string;
  expectedValue: number;
  receivedValue: number;
  difference: number;
  notes: string;
  workingCapital: number;
  createdAt: string;
}

export function useReceipts() {
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedYear, selectedMonth } = useFilters();

  const fetchReceipts = useCallback(async () => {
    if (!user) {
      setAllReceipts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const stored = localStorage.getItem(`receipts_${user.id}`);
      const receipts = stored ? JSON.parse(stored) : [];
      setAllReceipts(receipts);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      toast.error('Erro ao carregar recebimentos');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const filteredReceipts = useMemo(() => {
    return allReceipts.filter(r => {
      const date = new Date(r.date);
      if (isNaN(date.getTime())) return true;

      const matchesYear = date.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;

      return matchesYear && matchesMonth;
    });
  }, [allReceipts, selectedYear, selectedMonth]);

  const addReceipt = async (receipt: {
    serviceId: string;
    date: string;
    expectedValue: number;
    receivedValue: number;
    notes: string;
    workingCapital: number;
  }) => {
    if (!user) return null;

    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString(),
      difference: receipt.expectedValue - receipt.receivedValue,
      createdAt: new Date().toISOString(),
    };

    const updated = [...allReceipts, newReceipt];
    setAllReceipts(updated);
    localStorage.setItem(`receipts_${user.id}`, JSON.stringify(updated));
    toast.success('Recebimento registrado com sucesso!');
    return newReceipt;
  };

  const updateReceipt = async (id: string, updates: Partial<Receipt>) => {
    setAllReceipts((prev) =>
      prev.map((receipt) =>
        receipt.id === id ? { ...receipt, ...updates } : receipt
      )
    );

    if (user) {
      localStorage.setItem(`receipts_${user.id}`, JSON.stringify(allReceipts));
    }
    toast.success('Recebimento atualizado com sucesso!');
  };

  const deleteReceipt = async (id: string) => {
    const updated = allReceipts.filter((receipt) => receipt.id !== id);
    setAllReceipts(updated);

    if (user) {
      localStorage.setItem(`receipts_${user.id}`, JSON.stringify(updated));
    }
    toast.success('Recebimento removido com sucesso!');
  };

  const getReceiptsByServiceId = (serviceId: string) => {
    return filteredReceipts.filter((receipt) => receipt.serviceId === serviceId);
  };

  const getTotalReceived = () => {
    return filteredReceipts.reduce((sum, receipt) => sum + receipt.receivedValue, 0);
  };

  const getTotalExpected = () => {
    return filteredReceipts.reduce((sum, receipt) => sum + receipt.expectedValue, 0);
  };

  const getTotalDifference = () => {
    return filteredReceipts.reduce((sum, receipt) => sum + receipt.difference, 0);
  };

  const getLatestWorkingCapital = () => {
    if (filteredReceipts.length === 0) return 0;
    const sorted = [...filteredReceipts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0].workingCapital;
  };

  const getReceiptsSummary = () => {
    const totalExpected = getTotalExpected();
    const totalReceived = getTotalReceived();
    const totalDifference = getTotalDifference();
    const workingCapital = getLatestWorkingCapital();

    return {
      count: filteredReceipts.length,
      totalExpected,
      totalReceived,
      totalDifference,
      workingCapital,
      percentageReceived: totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0,
    };
  };

  const calculateToReceive = (totalServicesValue: number) => {
    return totalServicesValue - getTotalReceived();
  };

  return {
    receipts: filteredReceipts,
    loading,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    getReceiptsByServiceId,
    getTotalReceived,
    getTotalExpected,
    getTotalDifference,
    getLatestWorkingCapital,
    getReceiptsSummary,
    calculateToReceive,
    refetch: fetchReceipts,
  };
}

