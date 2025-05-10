import React from 'react';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Elements } from '@stripe/stripe-react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditHistory } from '../components/CreditHistory';
import { CreditPurchase } from '../components/CreditPurchase';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CreditsPage: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Credit Purchase Section */}
            <div>
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Purchase Credits
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Buy credits to use our AI-powered services.</p>
                  </div>
                  <div className="mt-5">
                    <Elements stripe={stripePromise}>
                      <CreditPurchase />
                    </Elements>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit History Section */}
            <div>
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Credit History
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>View your credit usage and purchase history.</p>
                  </div>
                  <div className="mt-5">
                    <CreditHistory />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Usage Information */}
          <div className="mt-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Credit Usage Information
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Here's how credits are used for each service:</p>
                </div>
                <div className="mt-5">
                  <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Copy Generation
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        5 credits
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        per generation
                      </dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Image Generation
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        10 credits
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        per image
                      </dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Video Generation
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        50 credits
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        per video
                      </dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Audio Generation
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        15 credits
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        per audio clip
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsPage; 