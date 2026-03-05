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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: { status?: string } = {};
    if (status) where.status = status;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: { select: { id: true, accountName: true, accountNumber: true } },
            },
          },
          createdByUser: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { entryDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entryDate, description, lines, referenceType, referenceId, notes } = body;

    if (!entryDate || !description || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate balanced entry (total debits = total credits)
    const totalDebit = lines.reduce((sum: number, line: { debitAmount?: number }) => sum + (line.debitAmount || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: { creditAmount?: number }) => sum + (line.creditAmount || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'Journal entry is not balanced. Total debits must equal total credits.' },
        { status: 400 }
      );
    }

    // Generate entry number
    const latestEntry = await prisma.journalEntry.findFirst({
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });

    const lastNum = latestEntry ? parseInt(latestEntry.entryNumber.substring(2)) : 0;
    const entryNumber = `JE${String(lastNum + 1).padStart(6, '0')}`;

    // Create journal entry with lines
    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: new Date(entryDate),
        description,
        referenceType,
        referenceId,
        notes,
        totalDebit,
        totalCredit,
        createdBy: payload.userId,
        organizationId: 'default',
        lines: {
          create: lines.map((line: { accountId: string; description?: string; debitAmount?: number; creditAmount?: number }, index: number) => ({
            accountId: line.accountId,
            lineNumber: index + 1,
            description: line.description,
            debitAmount: line.debitAmount || 0,
            creditAmount: line.creditAmount || 0,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: { select: { accountName: true, accountNumber: true } },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: entry },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}
