import { z } from 'zod';

// Base schemas
export const baseRequestSchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
  timestamp: z.number().int().positive(),
});

// Copy service schemas
export const copyGenerationRequestSchema = baseRequestSchema.extend({
  text: z.string().min(1).max(1000),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  targetPlatform: z.string().optional(),
});

// Graphics service schemas
export const graphicsGenerationRequestSchema = baseRequestSchema.extend({
  prompt: z.string().min(1).max(500),
  style: z.string().optional(),
  size: z.object({
    width: z.number().int().min(1).max(4096),
    height: z.number().int().min(1).max(4096),
  }).optional(),
});

// Video service schemas
export const videoGenerationRequestSchema = baseRequestSchema.extend({
  script: z.string().min(1).max(2000),
  style: z.string().optional(),
  duration: z.number().int().min(1).max(600).optional(),
  resolution: z.object({
    width: z.number().int().min(1).max(4096),
    height: z.number().int().min(1).max(4096),
  }).optional(),
});

// Audio service schemas
export const audioGenerationRequestSchema = baseRequestSchema.extend({
  text: z.string().min(1).max(1000),
  voice: z.string().optional(),
  provider: z.enum(['elevenlabs', 'aws']).optional(),
});

// Storage schemas
export const storageFileSchema = z.object({
  url: z.string().url(),
  key: z.string(),
  contentType: z.string(),
  size: z.number().int().positive(),
  createdAt: z.number().int().positive(),
});

// Response schemas
export const baseResponseSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['success', 'error']),
  error: z.string().optional(),
  timestamp: z.number().int().positive(),
});

export const copyGenerationResponseSchema = baseResponseSchema.extend({
  text: z.string(),
  storageFile: storageFileSchema.optional(),
});

export const graphicsGenerationResponseSchema = baseResponseSchema.extend({
  storageFile: storageFileSchema,
});

export const videoGenerationResponseSchema = baseResponseSchema.extend({
  storageFile: storageFileSchema,
  thumbnailFile: storageFileSchema.optional(),
});

export const audioGenerationResponseSchema = baseResponseSchema.extend({
  storageFile: storageFileSchema,
}); 