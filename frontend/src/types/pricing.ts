export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  credits: number;
  maxGenerations: number;
  maxTeamMembers?: number;
  priority?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  billingCycle: 'monthly' | 'yearly';
}

export interface CreditPurchase {
  id: string;
  userId: string;
  amount: number;
  cost: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  paymentMethodId: string;
}

export interface CreditUsage {
  id: string;
  userId: string;
  service: string;
  creditsUsed: number;
  requestId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BillingInfo {
  userId: string;
  stripeCustomerId: string;
  defaultPaymentMethod?: {
    id: string;
    type: string;
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
} 