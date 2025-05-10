import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, startDate, endDate } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Verify that the user is requesting their own history
    if (session.user?.id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Build the query
    const query: any = {
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Limit to last 100 transactions
    };

    // Add date range if provided
    if (startDate || endDate) {
      query.where.timestamp = {};
      if (startDate) {
        query.where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        query.where.timestamp.lte = new Date(endDate as string);
      }
    }

    // Get credit usage history
    const usageHistory = await prisma.creditUsage.findMany(query);

    // Get credit purchase history
    const purchaseHistory = await prisma.creditPurchase.findMany({
      where: {
        userId,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate as string) } : {}),
                ...(endDate ? { lte: new Date(endDate as string) } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Combine and sort all transactions
    const history = [
      ...usageHistory.map((usage) => ({
        type: 'usage',
        timestamp: usage.timestamp,
        amount: -usage.creditsUsed, // Negative because it's usage
        service: usage.service,
        requestId: usage.requestId,
        metadata: usage.metadata,
      })),
      ...purchaseHistory.map((purchase) => ({
        type: 'purchase',
        timestamp: purchase.createdAt,
        amount: purchase.amount,
        cost: purchase.cost,
        status: purchase.status,
        paymentMethodId: purchase.paymentMethodId,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.status(200).json({ history });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(500).json({ message: 'Error fetching credit history' });
  }
} 