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
    const accountType = searchParams.get('type');
    const isActive = searchParams.get('active') !== 'false';

    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        ...(accountType && { accountType }),
        isActive,
      },
      include: {
        childAccounts: {
          select: { id: true, accountName: true },
        },
      },
      orderBy: { accountNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: accounts,
      count: accounts.length,
    });
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
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
    const { accountNumber, accountName, accountType, subType, description, parentAccountId } = body;

    // Validate required fields
    if (!accountNumber || !accountName || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if account number already exists
    const existing = await prisma.chartOfAccount.findUnique({
      where: { accountNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Account number already exists' },
        { status: 409 }
      );
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        accountNumber,
        accountName,
        accountType,
        subType,
        description,
        parentAccountId,
        organizationId: 'default',
      },
    });

    return NextResponse.json(
      { success: true, data: account },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
