import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: { accountId?: string; entryDate?: { gte?: Date; lte?: Date } } = {};
    if (accountId) where.accountId = accountId;
    if (startDate) where.entryDate = { gte: new Date(startDate) };
    if (endDate) {
      where.entryDate = { ...where.entryDate, lte: new Date(endDate) };
    }

    const [entries, total] = await Promise.all([
      prisma.generalLedgerEntry.findMany({
        where,
        include: {
          account: { select: { id: true, accountName: true, accountNumber: true } },
        },
        orderBy: { entryDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.generalLedgerEntry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching general ledger:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ledger entries' },
      { status: 500 }
    );
  }
}
