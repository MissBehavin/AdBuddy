import * as amqp from 'amqplib';
import { config } from 'dotenv';
import { CopyService } from './copy.service';

// Load environment variables
config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const COPY_QUEUE = 'copy-generation-queue';
const COPY_RESULT_QUEUE = 'copy-generation-results';

async function main() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Ensure queues exist
    await channel.assertQueue(COPY_QUEUE, { durable: true });
    await channel.assertQueue(COPY_RESULT_QUEUE, { durable: true });

    // Initialize copy service
    const copyService = new CopyService();

    console.log('Copy service started. Waiting for messages...');

    // Consume messages from the queue
    channel.consume(COPY_QUEUE, async (msg) => {
      if (msg) {
        try {
          const request = JSON.parse(msg.content.toString());
          console.log('Received copy generation request:', request);

          // Generate copy
          const result = await copyService.generateCopy(request);

          // Send result to results queue
          channel.sendToQueue(
            COPY_RESULT_QUEUE,
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
            COPY_RESULT_QUEUE,
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
      console.log('Shutting down copy service...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start copy service:', error);
    process.exit(1);
  }
}

main(); 