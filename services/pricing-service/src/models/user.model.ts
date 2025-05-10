import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  email: string;
  currentPlan: string;
  credits: number;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  subscriptionId?: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  currentPlan: { type: String, required: true, enum: ['basic', 'pro', 'enterprise'] },
  credits: { type: Number, required: true, default: 0 },
  subscriptionStatus: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'inactive'
  },
  subscriptionId: { type: String },
  billingCycle: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  nextBillingDate: { type: Date, required: true },
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema); 