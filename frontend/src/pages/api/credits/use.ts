import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, service, credits, requestId } = req.body;

    if (!userId || !service || !credits || !requestId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify that the user is using credits for themselves
    if (session.user?.id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get user's current credit balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.credits < credits) {
        throw new Error('Insufficient credits');
      }

      // Deduct credits
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: credits,
          },
        },
      });

      // Log the credit usage
      const creditUsage = await tx.creditUsage.create({
        data: {
          userId,
          service,
          creditsUsed: credits,
          requestId,
          timestamp: new Date(),
        },
      });

      return creditUsage;
    });

    res.status(200).json({ success: true, creditUsage: result });
  } catch (error) {
    console.error('Error using credits:', error);
    if (error instanceof Error && error.message === 'Insufficient credits') {
      return res.status(402).json({ message: 'Insufficient credits' });
    }
    res.status(500).json({ message: 'Error using credits' });
  }
} 