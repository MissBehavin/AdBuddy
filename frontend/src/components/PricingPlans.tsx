import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useStripe } from '@stripe/stripe-react';
import { PricingPlan } from '../types/pricing';

interface PricingPlansProps {
  plans: PricingPlan[];
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ plans }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const stripe = useStripe();

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !user || !stripe) return;

    setIsLoading(true);
    try {
      // Create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle,
          userId: user.id,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error:', error);
      // Handle error (show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Select the plan that best fits your needs
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="relative bg-gray-100 rounded-lg p-1">
            <button
              className={`${
                billingCycle === 'monthly'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500'
              } relative py-2 px-6 rounded-md text-sm font-medium focus:outline-none`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`${
                billingCycle === 'yearly'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500'
              } relative py-2 px-6 rounded-md text-sm font-medium focus:outline-none`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg shadow-sm divide-y divide-gray-200 ${
                selectedPlan === plan.id
                  ? 'border-indigo-500 ring-2 ring-indigo-500'
                  : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </p>
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 ${
                    selectedPlan === plan.id ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h4 className="text-sm font-medium text-gray-900 tracking-wide">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe Button */}
        <div className="mt-12 text-center">
          <button
            onClick={handleSubscribe}
            disabled={!selectedPlan || isLoading}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (!selectedPlan || isLoading) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
}; 