import { Logger } from '@adtest/shared-logger';
import { ServiceError } from '@adtest/shared-types';

export interface CreditCost {
  copy: number;
  graphics: number;
  video: number;
  audio: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  creditCosts: CreditCost;
}

export interface UsageMetrics {
  userId: string;
  creditsUsed: number;
  lastUsed: Date;
  serviceUsage: {
    copy: number;
    graphics: number;
    video: number;
    audio: number;
  };
}

export class PricingService {
  private logger: Logger;
  private readonly plans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29.99,
      credits: 100,
      features: [
        'Basic copy generation',
        'Standard image generation',
        'Basic audio generation',
        '720p video generation'
      ],
      creditCosts: {
        copy: 1,
        graphics: 2,
        video: 10,
        audio: 2
      }
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 99.99,
      credits: 500,
      features: [
        'Advanced copy generation',
        'HD image generation',
        'Professional audio generation',
        '1080p video generation',
        'Priority processing'
      ],
      creditCosts: {
        copy: 1,
        graphics: 2,
        video: 8,
        audio: 2
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299.99,
      credits: 2000,
      features: [
        'Premium copy generation',
        '4K image generation',
        'Studio-quality audio',
        '4K video generation',
        'Priority processing',
        'Dedicated support',
        'Custom branding'
      ],
      creditCosts: {
        copy: 1,
        graphics: 2,
        video: 5,
        audio: 1
      }
    }
  ];

  constructor() {
    this.logger = new Logger({ service: 'pricing-service' });
  }

  getPlans(): PricingPlan[] {
    return this.plans;
  }

  getPlanById(planId: string): PricingPlan {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) {
      throw new ServiceError('Plan not found', 'PLAN_NOT_FOUND', 404);
    }
    return plan;
  }

  calculateServiceCost(planId: string, service: keyof CreditCost): number {
    const plan = this.getPlanById(planId);
    return plan.creditCosts[service];
  }

  calculateTotalCost(
    planId: string,
    usage: {
      copy?: number;
      graphics?: number;
      video?: number;
      audio?: number;
    }
  ): number {
    const plan = this.getPlanById(planId);
    let totalCost = 0;

    if (usage.copy) {
      totalCost += usage.copy * plan.creditCosts.copy;
    }
    if (usage.graphics) {
      totalCost += usage.graphics * plan.creditCosts.graphics;
    }
    if (usage.video) {
      totalCost += usage.video * plan.creditCosts.video;
    }
    if (usage.audio) {
      totalCost += usage.audio * plan.creditCosts.audio;
    }

    return totalCost;
  }

  validateCredits(planId: string, requiredCredits: number): boolean {
    const plan = this.getPlanById(planId);
    return plan.credits >= requiredCredits;
  }

  async trackUsage(metrics: UsageMetrics): Promise<void> {
    try {
      // Here you would implement actual usage tracking
      // For example, storing in MongoDB or sending to a metrics service
      this.logger.info('Usage tracked', { metrics });
    } catch (error) {
      this.logger.error('Failed to track usage', { error });
      throw new ServiceError('Failed to track usage', 'USAGE_TRACKING_FAILED');
    }
  }
} 