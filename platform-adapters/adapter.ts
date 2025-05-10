import { promises as fs } from 'fs';
import path from 'path';
import specs from './specs.json';

export interface PlatformSpec {
  video?: {
    aspect_ratio: string;
    max_duration: number;
    min_duration: number;
    max_file_size: string;
    supported_formats: string[];
    resolution: {
      min: string;
      recommended: string;
    };
  };
  image?: {
    aspect_ratio?: string;
    max_file_size: string;
    supported_formats: string[];
    resolution: {
      min?: string;
      max?: string;
      recommended?: string;
    };
  };
  text: {
    max_length: number;
    [key: string]: any;
  };
}

export class PlatformAdapter {
  private spec: PlatformSpec;

  constructor(platform: keyof typeof specs) {
    this.spec = specs[platform];
  }

  async validateVideo(videoPath: string): Promise<boolean> {
    if (!this.spec.video) {
      throw new Error('Video not supported for this platform');
    }

    const stats = await fs.stat(videoPath);
    const fileSize = stats.size;
    const maxSize = this.parseFileSize(this.spec.video.max_file_size);

    if (fileSize > maxSize) {
      throw new Error(`Video file size exceeds maximum allowed size of ${this.spec.video.max_file_size}`);
    }

    const ext = path.extname(videoPath).toLowerCase().slice(1);
    if (!this.spec.video.supported_formats.includes(ext)) {
      throw new Error(`Video format ${ext} not supported. Supported formats: ${this.spec.video.supported_formats.join(', ')}`);
    }

    return true;
  }

  async validateImage(imagePath: string): Promise<boolean> {
    if (!this.spec.image) {
      throw new Error('Image not supported for this platform');
    }

    const stats = await fs.stat(imagePath);
    const fileSize = stats.size;
    const maxSize = this.parseFileSize(this.spec.image.max_file_size);

    if (fileSize > maxSize) {
      throw new Error(`Image file size exceeds maximum allowed size of ${this.spec.image.max_file_size}`);
    }

    const ext = path.extname(imagePath).toLowerCase().slice(1);
    if (!this.spec.image.supported_formats.includes(ext)) {
      throw new Error(`Image format ${ext} not supported. Supported formats: ${this.spec.image.supported_formats.join(', ')}`);
    }

    return true;
  }

  validateText(text: string): boolean {
    if (text.length > this.spec.text.max_length) {
      throw new Error(`Text exceeds maximum length of ${this.spec.text.max_length} characters`);
    }
    return true;
  }

  private parseFileSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+)([A-Z]+)$/);
    if (!match) {
      throw new Error(`Invalid file size format: ${sizeStr}`);
    }

    const [, size, unit] = match;
    return parseInt(size) * units[unit];
  }

  getSpec(): PlatformSpec {
    return this.spec;
  }
} 