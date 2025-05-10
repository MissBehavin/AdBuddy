import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getSession } from 'next-auth/react';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { planId, billingCycle, userId } = req.body;

    // Get the price ID from your database or configuration
    const priceId = await getPriceId(planId, billingCycle);

    // Create a checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      customer_email: session.user?.email,
      metadata: {
        userId,
        planId,
        billingCycle,
      },
    });

    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Error creating checkout session' });
  }
}

async function getPriceId(planId: string, billingCycle: 'monthly' | 'yearly'): Promise<string> {
  // In a real application, you would fetch this from your database
  const priceMap: Record<string, { monthly: string; yearly: string }> = {
    basic: {
      monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID!,
    },
    pro: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    },
    enterprise: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
    },
  };

  const plan = priceMap[planId];
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  return billingCycle === 'yearly' ? plan.yearly : plan.monthly;
} 