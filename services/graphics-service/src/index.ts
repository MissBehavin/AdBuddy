import * as amqp from 'amqplib';
import { config } from 'dotenv';
import { GraphicsService } from './graphics.service';

// Load environment variables
config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const GRAPHICS_QUEUE = 'graphics-generation-queue';
const GRAPHICS_RESULT_QUEUE = 'graphics-generation-results';

async function main() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Ensure queues exist
    await channel.assertQueue(GRAPHICS_QUEUE, { durable: true });
    await channel.assertQueue(GRAPHICS_RESULT_QUEUE, { durable: true });

    // Initialize graphics service
    const graphicsService = new GraphicsService();

    console.log('Graphics service started. Waiting for messages...');

    // Consume messages from the queue
    channel.consume(GRAPHICS_QUEUE, async (msg) => {
      if (msg) {
        try {
          const request = JSON.parse(msg.content.toString());
          console.log('Received graphics generation request:', request);

          // Generate images
          const result = await graphicsService.generateImages(request);

          // Send result to results queue
          channel.sendToQueue(
            GRAPHICS_RESULT_QUEUE,
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
            GRAPHICS_RESULT_QUEUE,
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
      console.log('Shutting down graphics service...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start graphics service:', error);
    process.exit(1);
  }
}

main(); 