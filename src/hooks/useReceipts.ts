import { useState } from 'react';
import { Receipt } from '@/types';
import { mockReceipts } from '@/lib/data';

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts);

  const addReceipt = (receipt: Omit<Receipt, 'id' | 'createdAt' | 'difference'>) => {
    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString(),
      difference: receipt.receivedValue - receipt.expectedValue,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setReceipts((prev) => [...prev, newReceipt]);
    return newReceipt;
  };

  const updateReceipt = (id: string, updates: Partial<Receipt>) => {
    setReceipts((prev) =>
      prev.map((receipt) => {
        if (receipt.id === id) {
          const updated = { ...receipt, ...updates };
          if (updates.receivedValue !== undefined || updates.expectedValue !== undefined) {
            updated.difference = updated.receivedValue - updated.expectedValue;
          }
          return updated;
        }
        return receipt;
      })
    );
  };

  const deleteReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
  };

  const getReceiptsByServiceId = (serviceId: string) => {
    return receipts.filter((receipt) => receipt.serviceId === serviceId);
  };

  const getTotalReceived = () => {
    return receipts.reduce((sum, receipt) => sum + receipt.receivedValue, 0);
  };

  const getLatestWorkingCapital = () => {
    if (receipts.length === 0) return 0;
    const sorted = [...receipts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0].workingCapital;
  };

  return {
    receipts,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    getReceiptsByServiceId,
    getTotalReceived,
    getLatestWorkingCapital,
  };
}
