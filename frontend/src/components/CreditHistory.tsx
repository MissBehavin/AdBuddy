import React, { useEffect, useState } from 'react';
import { useCredits } from '../hooks/useCredits';
import { format } from 'date-fns';

interface CreditTransaction {
  type: 'usage' | 'purchase';
  timestamp: Date;
  amount: number;
  service?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  cost?: number;
  status?: string;
  paymentMethodId?: string;
}

export const CreditHistory: React.FC = () => {
  const { getCreditHistory, getCreditBalance } = useCredits();
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [historyData, balanceData] = await Promise.all([
          getCreditHistory(),
          getCreditBalance(),
        ]);
        setHistory(historyData);
        setBalance(balanceData);
      } catch (err) {
        setError('Failed to fetch credit history');
        console.error('Error fetching credit data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getCreditHistory, getCreditBalance]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Credit History
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Current Balance: {balance} credits
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {history.map((transaction, index) => (
            <li key={index} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'purchase' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'purchase' ? (
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.type === 'purchase' ? 'Credit Purchase' : 'Credit Usage'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.service && `Service: ${transaction.service}`}
                      {transaction.status && `Status: ${transaction.status}`}
                    </p>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.type === 'purchase'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'purchase' ? '+' : '-'}{Math.abs(transaction.amount)} credits
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    {format(new Date(transaction.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {transaction.cost && (
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>Cost: ${transaction.cost.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 