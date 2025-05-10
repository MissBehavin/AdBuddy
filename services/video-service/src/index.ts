import * as amqp from 'amqplib';
import { config } from 'dotenv';
import { VideoService } from './video.service';

// Load environment variables
config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const VIDEO_QUEUE = 'video-generation-queue';
const VIDEO_RESULT_QUEUE = 'video-generation-results';

async function main() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Ensure queues exist
    await channel.assertQueue(VIDEO_QUEUE, { durable: true });
    await channel.assertQueue(VIDEO_RESULT_QUEUE, { durable: true });

    // Initialize video service
    const videoService = new VideoService();

    console.log('Video service started. Waiting for messages...');

    // Consume messages from the queue
    channel.consume(VIDEO_QUEUE, async (msg) => {
      if (msg) {
        try {
          const request = JSON.parse(msg.content.toString());
          console.log('Received video generation request:', request);

          // Generate video
          const result = await videoService.generateVideo(request);

          // Send result to results queue
          channel.sendToQueue(
            VIDEO_RESULT_QUEUE,
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
            VIDEO_RESULT_QUEUE,
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
      console.log('Shutting down video service...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start video service:', error);
    process.exit(1);
  }
}

main(); 