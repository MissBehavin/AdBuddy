# AI-Powered Advertisement Generator

A full-stack application that automatically generates high-quality advertisements for multiple platforms using AI.

## Features

- Multi-platform ad generation (TikTok, Google Ads, YouTube, Bluesky, X/Twitter, Amazon, Facebook)
- AI-powered copywriting, graphics, video, and audio generation
- Campaign management and preview
- Platform-specific formatting and optimization

## Tech Stack

### Frontend
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Shadcn/ui components

### Backend
- NestJS (TypeScript)
- MongoDB
- RabbitMQ
- AWS S3

### Microservices
- Copy Service (OpenAI/GPT-4, Cohere, Anthropic)
- Graphics Service (DALL·E, Stable Diffusion)
- Video Service (ffmpeg + AI video generation)
- Audio Service (ElevenLabs, AWS Polly)

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB
- AWS Account (for S3)
- API Keys for:
  - OpenAI
  - Cohere
  - Anthropic
  - ElevenLabs
  - AWS Polly
  - DALL·E
  - Stable Diffusion

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd ai-ad-generator
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Copy example env files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp services/copy-service/.env.example services/copy-service/.env
cp services/graphics-service/.env.example services/graphics-service/.env
cp services/video-service/.env.example services/video-service/.env
cp services/audio-service/.env.example services/audio-service/.env
```

4. Update the environment variables with your API keys and configuration.

5. Start the development environment:
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api

## Project Structure

```
.
├── frontend/                 # Next.js frontend application
├── backend/                  # NestJS backend application
├── services/                 # Microservices
│   ├── copy-service/        # AI copywriting service
│   ├── graphics-service/    # Image generation service
│   ├── video-service/       # Video generation service
│   └── audio-service/       # Audio generation service
├── platform-adapters/       # Platform-specific formatting
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # Project documentation
```

## Development

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Proprietary Notice

This is a proprietary project. All rights reserved. Unauthorized copying, distribution, or use of this software is strictly prohibited. 