import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface VideoGenerationRequest {
  script: string;
  duration: number;
  aspectRatio: string;
  style?: 'cinematic' | 'corporate' | 'social' | 'minimal';
  backgroundMusic?: boolean;
  voiceover?: boolean;
  voiceGender?: 'male' | 'female';
  language?: string;
}

export interface VideoGenerationResponse {
  videoUrl: string;
  thumbnailUrl?: string;
}

export class VideoService {
  private readonly outputDir: string;

  constructor() {
    this.outputDir = process.env.VIDEO_OUTPUT_DIR || path.join(process.cwd(), 'output');
    this.ensureOutputDirectory();
  }

  private async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const videoId = uuidv4();
    const outputPath = path.join(this.outputDir, `${videoId}.mp4`);
    const thumbnailPath = path.join(this.outputDir, `${videoId}_thumb.jpg`);

    try {
      // Generate video using ffmpeg
      await this.generateWithFfmpeg(request, outputPath);

      // Generate thumbnail
      await this.generateThumbnail(outputPath, thumbnailPath);

      // Upload to storage (implement your preferred storage solution)
      const videoUrl = await this.uploadToStorage(outputPath);
      const thumbnailUrl = await this.uploadToStorage(thumbnailPath);

      return {
        videoUrl,
        thumbnailUrl,
      };
    } catch (error) {
      console.error('Error generating video:', error);
      throw new Error('Failed to generate video');
    }
  }

  private async generateWithFfmpeg(request: VideoGenerationRequest, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = this.buildFfmpegArgs(request, outputPath);
      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`ffmpeg: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg process exited with code ${code}`));
        }
      });
    });
  }

  private buildFfmpegArgs(request: VideoGenerationRequest, outputPath: string): string[] {
    const args = [
      '-y', // Overwrite output file if it exists
    ];

    // Add input options based on request
    if (request.backgroundMusic) {
      args.push('-i', 'background_music.mp3');
    }

    if (request.voiceover) {
      args.push('-i', 'voiceover.mp3');
    }

    // Add video filters
    const filters = [];

    // Add aspect ratio filter
    filters.push(`scale=${this.getAspectRatioDimensions(request.aspectRatio)}`);

    // Add style filters
    if (request.style) {
      filters.push(this.getStyleFilter(request.style));
    }

    if (filters.length > 0) {
      args.push('-vf', filters.join(','));
    }

    // Add output options
    args.push(
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputPath
    );

    return args;
  }

  private getAspectRatioDimensions(aspectRatio: string): string {
    const [width, height] = aspectRatio.split(':').map(Number);
    const baseHeight = 1080;
    const baseWidth = Math.round((baseHeight * width) / height);
    return `${baseWidth}:${baseHeight}`;
  }

  private getStyleFilter(style: string): string {
    switch (style) {
      case 'cinematic':
        return 'colorbalance=rs=.3:gs=.3:bs=.3:rm=.3:gm=.3:bm=.3:rh=.3:gh=.3:bh=.3';
      case 'corporate':
        return 'eq=contrast=1.1:brightness=0.1:saturation=0.9';
      case 'social':
        return 'eq=contrast=1.2:brightness=0.05:saturation=1.1';
      case 'minimal':
        return 'eq=contrast=1.1:brightness=0.05:saturation=0.9';
      default:
        return '';
    }
  }

  private async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', '00:00:01',
        '-vframes', '1',
        '-q:v', '2',
        thumbnailPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to generate thumbnail: ${code}`));
        }
      });
    });
  }

  private async uploadToStorage(filePath: string): Promise<string> {
    // Implement your preferred storage solution (e.g., AWS S3, Google Cloud Storage)
    // For now, return a placeholder URL
    return `https://storage.example.com/${path.basename(filePath)}`;
  }
} 