import { Schema, model, Document } from 'mongoose';

export interface IUsage extends Document {
  userId: string;
  service: 'copy' | 'graphics' | 'video' | 'audio';
  creditsUsed: number;
  requestId: string;
  timestamp: Date;
  metadata: {
    inputLength?: number;
    outputSize?: number;
    quality?: string;
    duration?: number;
  };
}

const usageSchema = new Schema<IUsage>({
  userId: { type: String, required: true, index: true },
  service: {
    type: String,
    required: true,
    enum: ['copy', 'graphics', 'video', 'audio']
  },
  creditsUsed: { type: Number, required: true },
  requestId: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, default: Date.now },
  metadata: {
    inputLength: { type: Number },
    outputSize: { type: Number },
    quality: { type: String },
    duration: { type: Number }
  }
});

// Create compound index for efficient querying
usageSchema.index({ userId: 1, timestamp: -1 });

export const Usage = model<IUsage>('Usage', usageSchema); 