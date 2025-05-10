import React, { useState } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useStripe, useElements, CardElement } from '@stripe/stripe-react';

const creditPackages = [
  { amount: 100, price: 10, discount: 0 },
  { amount: 500, price: 45, discount: 10 },
  { amount: 1000, price: 80, discount: 20 },
];

export const CreditPurchase: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { purchaseCredits } = useCredits();
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      await purchaseCredits({
        amount: selectedPackage.amount,
        paymentMethodId: paymentMethod.id,
      });

      // Reset form
      elements.getElement(CardElement)?.clear();
      setSelectedPackage(creditPackages[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase Credits</h2>

        {/* Credit Packages */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {creditPackages.map((pkg) => (
            <button
              key={pkg.amount}
              onClick={() => setSelectedPackage(pkg)}
              className={`p-4 rounded-lg border ${
                selectedPackage.amount === pkg.amount
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="text-lg font-semibold text-gray-900">
                {pkg.amount} Credits
              </div>
              <div className="text-sm text-gray-500">
                ${pkg.price}
                {pkg.discount > 0 && (
                  <span className="ml-1 text-green-600">
                    ({pkg.discount}% off)
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Details
            </label>
            <div className="p-3 border border-gray-300 rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (!stripe || isProcessing) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'Processing...' : `Purchase ${selectedPackage.amount} Credits`}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your payment is secure and encrypted</p>
          <p className="mt-1">
            Powered by{' '}
            <img
              src="/stripe-badge.svg"
              alt="Stripe"
              className="inline-block h-4"
            />
          </p>
        </div>
      </div>
    </div>
  );
}; 