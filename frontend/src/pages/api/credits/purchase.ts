import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';

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

    const { userId, amount, paymentMethodId } = req.body;

    if (!userId || !amount || !paymentMethodId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify that the user is purchasing credits for themselves
    if (session.user?.id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate cost based on credit amount
    const cost = calculateCreditCost(amount);

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: cost,
      currency: 'usd',
      payment_method: paymentMethodId,
      customer: user.stripeCustomerId!,
      confirm: true,
      metadata: {
        userId,
        creditAmount: amount,
      },
    });

    // Create credit purchase record
    const creditPurchase = await prisma.creditPurchase.create({
      data: {
        userId,
        amount,
        cost: cost / 100, // Convert from cents to dollars
        status: 'completed',
        paymentMethodId,
      },
    });

    // Add credits to user's account
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });

    res.status(200).json({
      success: true,
      creditPurchase,
      paymentIntent,
    });
  } catch (error) {
    console.error('Error purchasing credits:', error);
    res.status(500).json({ message: 'Error purchasing credits' });
  }
}

function calculateCreditCost(credits: number): number {
  // Base price: $0.10 per credit
  const basePrice = 0.10;
  
  // Volume discounts
  let discount = 0;
  if (credits >= 1000) {
    discount = 0.20; // 20% discount for 1000+ credits
  } else if (credits >= 500) {
    discount = 0.15; // 15% discount for 500+ credits
  } else if (credits >= 100) {
    discount = 0.10; // 10% discount for 100+ credits
  }

  const price = credits * basePrice * (1 - discount);
  return Math.round(price * 100); // Convert to cents for Stripe
} 