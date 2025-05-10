import { Logger } from '@adtest/shared-logger';
import { ServiceError } from '@adtest/shared-types';
import { User } from '../models/user.model';
import { Usage } from '../models/usage.model';
import { StripeService } from './stripe.service';

export interface CreditPurchase {
  userId: string;
  amount: number;
  paymentMethodId: string;
}

export class CreditService {
  private logger: Logger;
  private stripeService: StripeService;

  constructor(stripeService: StripeService) {
    this.logger = new Logger({ service: 'credit-service' });
    this.stripeService = stripeService;
  }

  async purchaseCredits(purchase: CreditPurchase): Promise<void> {
    try {
      const user = await User.findOne({ userId: purchase.userId });
      if (!user) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND');
      }

      // Calculate cost based on credit amount
      const cost = this.calculateCreditCost(purchase.amount);

      // Create a payment intent
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: cost,
        currency: 'usd',
        paymentMethod: purchase.paymentMethodId,
        customer: user.stripeCustomerId,
        metadata: {
          userId: purchase.userId,
          creditAmount: purchase.amount
        }
      });

      // Confirm the payment
      await this.stripeService.confirmPayment(paymentIntent.id);

      // Add credits to user's account
      await User.findOneAndUpdate(
        { userId: purchase.userId },
        { $inc: { credits: purchase.amount } }
      );

      // Log the credit purchase
      await Usage.create({
        userId: purchase.userId,
        service: 'credit_purchase',
        creditsUsed: -purchase.amount, // Negative because we're adding credits
        requestId: paymentIntent.id,
        metadata: {
          cost,
          paymentMethod: purchase.paymentMethodId
        }
      });

    } catch (error) {
      this.logger.error('Failed to purchase credits', { error, purchase });
      throw new ServiceError('Failed to purchase credits', 'CREDIT_PURCHASE_ERROR');
    }
  }

  async useCredits(userId: string, service: string, credits: number, requestId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND');
      }

      if (user.credits < credits) {
        throw new ServiceError('Insufficient credits', 'INSUFFICIENT_CREDITS');
      }

      // Deduct credits
      await User.findOneAndUpdate(
        { userId },
        { $inc: { credits: -credits } }
      );

      // Log the credit usage
      await Usage.create({
        userId,
        service,
        creditsUsed: credits,
        requestId,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to use credits', { error, userId, service, credits });
      throw new ServiceError('Failed to use credits', 'CREDIT_USAGE_ERROR');
    }
  }

  async getCreditBalance(userId: string): Promise<number> {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND');
      }
      return user.credits;
    } catch (error) {
      this.logger.error('Failed to get credit balance', { error, userId });
      throw new ServiceError('Failed to get credit balance', 'CREDIT_BALANCE_ERROR');
    }
  }

  async getCreditHistory(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const query: any = { userId };
      if (startDate && endDate) {
        query.timestamp = {
          $gte: startDate,
          $lte: endDate
        };
      }

      const history = await Usage.find(query)
        .sort({ timestamp: -1 })
        .limit(100);

      return history;
    } catch (error) {
      this.logger.error('Failed to get credit history', { error, userId });
      throw new ServiceError('Failed to get credit history', 'CREDIT_HISTORY_ERROR');
    }
  }

  private calculateCreditCost(credits: number): number {
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
} 