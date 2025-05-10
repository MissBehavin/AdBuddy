import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { prisma } from '../../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ message: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId, billingCycle } = session.metadata!;

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId,
      status: 'active',
      stripeSubscriptionId: session.subscription as string,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      billingCycle,
    },
    update: {
      planId,
      status: 'active',
      stripeSubscriptionId: session.subscription as string,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      billingCycle,
    },
  });

  // Add initial credits based on plan
  const credits = getPlanCredits(planId);
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: credits,
      },
    },
  });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const planId = subscription.items.data[0].price.nickname;
  const status = subscription.status === 'active' ? 'active' : 'inactive';

  await prisma.subscription.update({
    where: { userId },
    data: {
      status,
      planId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'cancelled',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: true,
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.userId;

  // Add credits based on the plan
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const planId = subscription.items.data[0].price.nickname;
  const credits = getPlanCredits(planId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: credits,
      },
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = customer.metadata.userId;

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'inactive',
    },
  });
}

function getPlanCredits(planId: string): number {
  const credits = {
    basic: 100,
    pro: 500,
    enterprise: 2000,
  };
  return credits[planId] || 0;
} 