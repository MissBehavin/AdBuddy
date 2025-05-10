import Stripe from 'stripe';
import { Logger } from '@adtest/shared-logger';
import { ServiceError } from '@adtest/shared-types';
import { User } from '../models/user.model';

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

export class StripeService {
  private stripe: Stripe;
  private logger: Logger;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16'
    });
    this.logger = new Logger({ service: 'stripe-service' });
  }

  async createCustomer(email: string, userId: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId
        }
      });
      return customer.id;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer', { error });
      throw new ServiceError('Failed to create customer', 'STRIPE_ERROR');
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          billingCycle
        }
      });

      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription', { error });
      throw new ServiceError('Failed to create subscription', 'STRIPE_ERROR');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.del(subscriptionId);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', { error });
      throw new ServiceError('Failed to cancel subscription', 'STRIPE_ERROR');
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
      }
    } catch (error) {
      this.logger.error('Failed to handle webhook', { error, event });
      throw new ServiceError('Failed to handle webhook', 'STRIPE_ERROR');
    }
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    const planId = subscription.items.data[0].price.nickname;
    const status = subscription.status;

    await User.findOneAndUpdate(
      { userId },
      {
        subscriptionStatus: status === 'active' ? 'active' : 'inactive',
        currentPlan: planId,
        subscriptionId: subscription.id,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    );
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;

    await User.findOneAndUpdate(
      { userId },
      {
        subscriptionStatus: 'cancelled',
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    );
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = customer.metadata.userId;

    // Add credits based on the plan
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
    const planId = subscription.items.data[0].price.nickname;

    await User.findOneAndUpdate(
      { userId },
      {
        $inc: { credits: this.getPlanCredits(planId) }
      }
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = customer.metadata.userId;

    await User.findOneAndUpdate(
      { userId },
      { subscriptionStatus: 'inactive' }
    );
  }

  private getPlanCredits(planId: string): number {
    const credits = {
      basic: 100,
      pro: 500,
      enterprise: 2000
    };
    return credits[planId] || 0;
  }
} 