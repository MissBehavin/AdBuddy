import { ElevenLabs } from 'elevenlabs-node';
import { Polly } from 'aws-sdk';

export interface AudioGenerationRequest {
  text: string;
  voice?: string;
  provider?: 'elevenlabs' | 'aws';
}

export interface AudioGenerationResponse {
  audioUrl: string;
}

export class AudioService {
  private elevenlabs: ElevenLabs;
  private polly: Polly;

  constructor() {
    this.elevenlabs = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    this.polly = new Polly({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async generateAudio(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    if (request.provider === 'aws') {
      return this.generateWithAWS(request);
    } else {
      return this.generateWithElevenLabs(request);
    }
  }

  private async generateWithElevenLabs(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    const voice = request.voice || 'default';
    const audio = await this.elevenlabs.textToSpeech({
      text: request.text,
      voice,
    });

    // In a real implementation, you would upload the audio to a storage service
    // For now, we'll return a placeholder URL
    return {
      audioUrl: `https://storage.example.com/audio/${Date.now()}.mp3`,
    };
  }

  private async generateWithAWS(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    const params = {
      Text: request.text,
      OutputFormat: 'mp3',
      VoiceId: request.voice || 'Joanna',
    };

    const data = await this.polly.synthesizeSpeech(params).promise();

    // In a real implementation, you would upload the audio to a storage service
    // For now, we'll return a placeholder URL
    return {
      audioUrl: `https://storage.example.com/audio/${Date.now()}.mp3`,
    };
  }
} 