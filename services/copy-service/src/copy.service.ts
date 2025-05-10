import { Configuration, OpenAIApi } from 'openai';
import { CohereClient } from 'cohere-ai';
import { Anthropic } from '@anthropic-ai/sdk';

export interface CopyGenerationRequest {
  productName: string;
  productDescription: string;
  targetPlatform: string;
  tone: 'professional' | 'casual' | 'humorous' | 'emotional';
  maxLength?: number;
  keywords?: string[];
}

export interface CopyGenerationResponse {
  headline?: string;
  description: string;
  callToAction?: string;
  hashtags?: string[];
}

export class CopyService {
  private openai: OpenAIApi;
  private cohere: CohereClient;
  private anthropic: Anthropic;

  constructor() {
    // Initialize OpenAI
    const openaiConfig = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(openaiConfig);

    // Initialize Cohere
    this.cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });

    // Initialize Anthropic
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateCopy(request: CopyGenerationRequest): Promise<CopyGenerationResponse> {
    const prompt = this.buildPrompt(request);
    
    try {
      // Try OpenAI first
      const openaiResponse = await this.generateWithOpenAI(prompt);
      if (openaiResponse) {
        return this.parseResponse(openaiResponse);
      }

      // Fallback to Cohere
      const cohereResponse = await this.generateWithCohere(prompt);
      if (cohereResponse) {
        return this.parseResponse(cohereResponse);
      }

      // Last resort: Anthropic
      const anthropicResponse = await this.generateWithAnthropic(prompt);
      return this.parseResponse(anthropicResponse);
    } catch (error) {
      console.error('Error generating copy:', error);
      throw new Error('Failed to generate copy with any available AI service');
    }
  }

  private buildPrompt(request: CopyGenerationRequest): string {
    const { productName, productDescription, targetPlatform, tone, maxLength, keywords } = request;
    
    return `
      Generate an advertisement for the following product:
      
      Product Name: ${productName}
      Description: ${productDescription}
      Platform: ${targetPlatform}
      Tone: ${tone}
      ${maxLength ? `Maximum Length: ${maxLength} characters` : ''}
      ${keywords ? `Keywords to include: ${keywords.join(', ')}` : ''}
      
      Please provide:
      1. A compelling headline
      2. A detailed description
      3. A call-to-action
      4. Relevant hashtags (if applicable for the platform)
      
      Format the response as JSON with the following structure:
      {
        "headline": "string",
        "description": "string",
        "callToAction": "string",
        "hashtags": ["string"]
      }
    `;
  }

  private async generateWithOpenAI(prompt: string): Promise<string | null> {
    try {
      const response = await this.openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.data.choices[0]?.text || null;
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      return null;
    }
  }

  private async generateWithCohere(prompt: string): Promise<string | null> {
    try {
      const response = await this.cohere.generate({
        prompt,
        max_tokens: 500,
        temperature: 0.7,
        k: 0,
        p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE',
      });

      return response.generations[0]?.text || null;
    } catch (error) {
      console.error('Cohere generation failed:', error);
      return null;
    }
  }

  private async generateWithAnthropic(prompt: string): Promise<string> {
    const response = await this.anthropic.completions.create({
      model: 'claude-2',
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 500,
      temperature: 0.7,
    });

    return response.completion;
  }

  private parseResponse(response: string): CopyGenerationResponse {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI service');
    }
  }
} 