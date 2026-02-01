import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

interface DbReceipt {
  id: string;
  service_id: string | null;
  date: string;
  expected_value: number;
  received_value: number;
  difference: number;
  notes: string | null;
  working_capital: number;
  created_at: string;
}

const mapDbToReceipt = (db: DbReceipt): Receipt => ({
  id: db.id,
  serviceId: db.service_id,
  date: db.date,
  expectedValue: Number(db.expected_value),
  receivedValue: Number(db.received_value),
  difference: Number(db.difference),
  notes: db.notes || '',
  workingCapital: Number(db.working_capital),
  createdAt: db.created_at,
});

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReceipts = useCallback(async () => {
    if (!user) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Erro ao carregar recebimentos');
    } else {
      setReceipts((data || []).map(mapDbToReceipt));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const addReceipt = async (receipt: {
    serviceId: string;
    date: string;
    expectedValue: number;
    receivedValue: number;
    notes: string;
    workingCapital: number;
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        service_id: receipt.serviceId,
        date: receipt.date,
        expected_value: receipt.expectedValue,
        received_value: receipt.receivedValue,
        notes: receipt.notes,
        working_capital: receipt.workingCapital,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding receipt:', error);
      toast.error('Erro ao registrar recebimento');
      return null;
    }

    const newReceipt = mapDbToReceipt(data);
    setReceipts((prev) => [newReceipt, ...prev]);
    return newReceipt;
  };

  const updateReceipt = async (id: string, updates: Partial<Receipt>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.serviceId !== undefined) dbUpdates.service_id = updates.serviceId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.expectedValue !== undefined) dbUpdates.expected_value = updates.expectedValue;
    if (updates.receivedValue !== undefined) dbUpdates.received_value = updates.receivedValue;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.workingCapital !== undefined) dbUpdates.working_capital = updates.workingCapital;

    const { error } = await supabase
      .from('receipts')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating receipt:', error);
      toast.error('Erro ao atualizar recebimento');
      return;
    }

    // Refetch to get computed difference
    await fetchReceipts();
  };

  const deleteReceipt = async (id: string) => {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Erro ao excluir recebimento');
      return;
    }

    setReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
  };

  const getReceiptsByServiceId = (serviceId: string) => {
    return receipts.filter((receipt) => receipt.serviceId === serviceId);
  };

  const getTotalReceived = () => {
    return receipts.reduce((sum, receipt) => sum + receipt.receivedValue, 0);
  };

  const getTotalExpected = () => {
    return receipts.reduce((sum, receipt) => sum + receipt.expectedValue, 0);
  };

  const getTotalDifference = () => {
    return receipts.reduce((sum, receipt) => sum + receipt.difference, 0);
  };

  const getLatestWorkingCapital = () => {
    if (receipts.length === 0) return 0;
    const sorted = [...receipts].sort(
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
      count: receipts.length,
      totalExpected,
      totalReceived,
      totalDifference,
      workingCapital,
      percentageReceived: totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0,
    };
  };

  // Calcular valores a receber baseado em serviços (total serviços - total recebido)
  const calculateToReceive = (totalServicesValue: number) => {
    return totalServicesValue - getTotalReceived();
  };

  return {
    receipts,
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
