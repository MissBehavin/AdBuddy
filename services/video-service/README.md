# Video Service

This service handles AI-powered video generation for advertisements. It processes video generation requests from a message queue and generates videos using FFmpeg.

## Features

- Video generation from images and audio
- Thumbnail generation
- Support for various video formats and resolutions
- Integration with message queue for asynchronous processing
- Docker support with FFmpeg included

## Prerequisites

- Node.js 18 or higher
- FFmpeg
- RabbitMQ
- Docker (optional)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672

# Storage Configuration
STORAGE_TYPE=local
STORAGE_PATH=/data/videos

# Video Generation Settings
DEFAULT_VIDEO_WIDTH=1920
DEFAULT_VIDEO_HEIGHT=1080
DEFAULT_VIDEO_FPS=30
DEFAULT_VIDEO_DURATION=30

# FFmpeg Settings
FFMPEG_THREADS=4
FFMPEG_PRESET=medium
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript code:
   ```bash
   npm run build
   ```

3. Start the service:
   ```bash
   npm start
   ```

## Docker

Build and run the service using Docker:

```bash
docker build -t video-service .
docker run -d --name video-service video-service
```

## Development

Run the service in development mode:

```bash
npm run dev
```

## Testing

Run the test suite:

```bash
npm test
```

## Message Queue Integration

The service listens to the `video-generation-queue` queue for incoming requests and sends results to the `video-generation-results` queue.

### Request Format

```typescript
interface VideoGenerationRequest {
  requestId: string;
  images: string[];  // Array of image URLs or base64 strings
  audio?: string;    // Audio URL or base64 string
  duration?: number; // Video duration in seconds
  width?: number;    // Video width
  height?: number;   // Video height
  fps?: number;      // Frames per second
}
```

### Response Format

```typescript
interface VideoGenerationResponse {
  requestId: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
}
```

## License

MIT 