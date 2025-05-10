import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface CreditBalance {
  balance: number;
  lastUpdated: string;
}

interface CreditHistory {
  type: 'purchase' | 'usage';
  amount: number;
  timestamp: string;
  service?: string;
  requestId?: string;
  cost?: number;
}

interface PurchaseCreditsParams {
  amount: number;
  paymentMethodId: string;
}

export const useCredits = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCreditBalance = useCallback(async (): Promise<CreditBalance> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/credits/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch credit balance');
      }
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCreditHistory = useCallback(async (
    startDate?: string,
    endDate?: string
  ): Promise<CreditHistory[]> => {
    try {
      setIsLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await fetch(`/api/credits/history?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch credit history');
      }
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchaseCredits = useCallback(async ({
    amount,
    paymentMethodId,
  }: PurchaseCreditsParams): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to purchase credits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const useCredits = useCallback(async (
    service: string,
    amount: number,
    requestId: string
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/credits/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service,
          amount,
          requestId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to use credits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getCreditBalance,
    getCreditHistory,
    purchaseCredits,
    useCredits,
    isLoading,
    error,
  };
}; 