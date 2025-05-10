import * as amqp from 'amqplib';
import { config } from 'dotenv';
import { AudioService } from './audio.service';

// Load environment variables
config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const AUDIO_QUEUE = 'audio-generation-queue';
const AUDIO_RESULT_QUEUE = 'audio-generation-results';

async function main() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Ensure queues exist
    await channel.assertQueue(AUDIO_QUEUE, { durable: true });
    await channel.assertQueue(AUDIO_RESULT_QUEUE, { durable: true });

    // Initialize audio service
    const audioService = new AudioService();

    console.log('Audio service started. Waiting for messages...');

    // Consume messages from the queue
    channel.consume(AUDIO_QUEUE, async (msg) => {
      if (msg) {
        try {
          const request = JSON.parse(msg.content.toString());
          console.log('Received audio generation request:', request);

          // Generate audio
          const result = await audioService.generateAudio(request);

          // Send result to results queue
          channel.sendToQueue(
            AUDIO_RESULT_QUEUE,
            Buffer.from(JSON.stringify({
              requestId: request.requestId,
              result,
              status: 'success'
            }))
          );

          // Acknowledge the message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);

          // Send error to results queue
          channel.sendToQueue(
            AUDIO_RESULT_QUEUE,
            Buffer.from(JSON.stringify({
              requestId: msg.content.requestId,
              error: error.message,
              status: 'error'
            }))
          );

          // Acknowledge the message to remove it from the queue
          channel.ack(msg);
        }
      }
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Shutting down audio service...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start audio service:', error);
    process.exit(1);
  }
}

main(); 