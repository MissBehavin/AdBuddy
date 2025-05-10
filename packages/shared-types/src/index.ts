// Common interfaces
export interface BaseRequest {
  requestId: string;
  userId: string;
  timestamp: number;
}

export interface BaseResponse {
  requestId: string;
  status: 'success' | 'error';
  error?: string;
  timestamp: number;
}

// Storage interfaces
export interface StorageFile {
  url: string;
  key: string;
  contentType: string;
  size: number;
  createdAt: number;
}

// Copy service interfaces
export interface CopyGenerationRequest extends BaseRequest {
  text: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  targetPlatform?: string;
}

export interface CopyGenerationResponse extends BaseResponse {
  text: string;
  storageFile?: StorageFile;
}

// Graphics service interfaces
export interface GraphicsGenerationRequest extends BaseRequest {
  prompt: string;
  style?: string;
  size?: {
    width: number;
    height: number;
  };
}

export interface GraphicsGenerationResponse extends BaseResponse {
  storageFile: StorageFile;
}

// Video service interfaces
export interface VideoGenerationRequest extends BaseRequest {
  script: string;
  style?: string;
  duration?: number;
  resolution?: {
    width: number;
    height: number;
  };
}

export interface VideoGenerationResponse extends BaseResponse {
  storageFile: StorageFile;
  thumbnailFile?: StorageFile;
}

// Audio service interfaces
export interface AudioGenerationRequest extends BaseRequest {
  text: string;
  voice?: string;
  provider?: 'elevenlabs' | 'aws';
}

export interface AudioGenerationResponse extends BaseResponse {
  storageFile: StorageFile;
}

// Platform adapter interfaces
export interface PlatformAdapter {
  formatCopy(copy: string): string;
  formatImage(imageUrl: string): string;
  formatVideo(videoUrl: string): string;
  formatAudio(audioUrl: string): string;
}

// Error types
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Queue names
export const QUEUE_NAMES = {
  COPY_GENERATION: 'copy-generation-queue',
  GRAPHICS_GENERATION: 'graphics-generation-queue',
  VIDEO_GENERATION: 'video-generation-queue',
  AUDIO_GENERATION: 'audio-generation-queue',
  STORAGE_UPLOAD: 'storage-upload-queue',
  RESULTS: 'results-queue'
} as const; 