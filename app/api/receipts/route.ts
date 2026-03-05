/**
 * API Route: /api/receipts
 * List and search receipts
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/receipts
 * List all receipts with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filters
    const customerId = searchParams.get('customerId');
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search'); // Search by payment number or reference

    // Build where clause
    const where: Prisma.PaymentWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.payment.count({ where });

    // Get payments
    const payments = await prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: payments.map((payment: any) => ({
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
        status: payment.status,
        customer: payment.customer,
        invoice: payment.invoice,
        receiptUrl: `/api/receipts/${payment.id}`,
        downloadUrl: `/api/receipts/${payment.id}?format=pdf`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch receipts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
