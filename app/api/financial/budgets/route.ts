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
    const fiscalYear = searchParams.get('fiscalYear');
    const budgetType = searchParams.get('type');

    const where: { organizationId: string; status?: string; fiscalYear?: number; budgetType?: string } = { organizationId: 'default' };
    if (status) where.status = status;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (budgetType) where.budgetType = budgetType;

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        budgetLines: {
          include: {
            account: { select: { id: true, accountName: true, accountNumber: true } },
          },
        },
        budgetReviews: {
          orderBy: { reviewDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { fiscalYear: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: budgets,
      count: budgets.length,
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
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
    const { budgetName, fiscalYear, budgetType, startDate, endDate, budgetLines } = body;

    if (!budgetName || !fiscalYear || !budgetType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate budget
    const existing = await prisma.budget.findFirst({
      where: {
        organizationId: 'default',
        fiscalYear,
        budgetType,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Budget for FY${fiscalYear} ${budgetType} already exists` },
        { status: 409 }
      );
    }

    // Calculate total budgeted amount
    const totalBudgetedAmount = budgetLines.reduce(
      (sum: number, line: { budgetAmount?: number }) => sum + (line.budgetAmount || 0),
      0
    );

    const budget = await prisma.budget.create({
      data: {
        budgetName,
        fiscalYear,
        budgetType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalBudgetedAmount,
        createdBy: payload.userId,
        organizationId: 'default',
        budgetLines: {
          create: budgetLines.map((line: { accountId: string; budgetAmount: number; notes?: string; isControlLine?: boolean }) => ({
            accountId: line.accountId,
            budgetAmount: line.budgetAmount,
            notes: line.notes,
            isControlLine: line.isControlLine || false,
          })),
        },
      },
      include: {
        budgetLines: {
          include: {
            account: { select: { accountName: true, accountNumber: true } },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: budget },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}
