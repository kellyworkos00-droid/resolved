import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/invoices
 * Get all invoices with pagination and filters
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, 'invoice.view');

    const { searchParams } = new URL(request.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const all = searchParams.get('all') === 'true';
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;
    const customerId = searchParams.get('customerId');
    const statusParam = searchParams.get('status');
    const statuses = statusParam
      ? statusParam
          .split(',')
          .map((status) => status.trim())
          .filter((status) => status.length > 0)
      : [];

    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      ...(customerId ? { customerId } : {}),
      ...(statuses.length === 1
        ? { status: statuses[0] }
        : statuses.length > 1
          ? { status: { in: statuses } }
          : {}),
    };

    const queryBase = {
      where,
      orderBy: { issueDate: 'desc' as const },
      include: {
        customer: true,
        payments: true,
      },
    };

    const [invoices, total] = all
      ? await Promise.all([
          prisma.invoice.findMany(queryBase),
          prisma.invoice.count({ where }),
        ])
      : await Promise.all([
          prisma.invoice.findMany({
            ...queryBase,
            skip,
            take: limit,
          }),
          prisma.invoice.count({ where }),
        ]);

    // Calculate accurate status for each invoice based on actual payment amounts
    const invoicesWithAccurateStatus = invoices.map((invoice) => {
      let calculatedStatus = 'SENT';
      // Only mark as PAID if payment is confirmed in invoice module
      if (invoice.payments && invoice.payments.length > 0) {
        const confirmedPayments = invoice.payments.filter((p: { status: string }) => p.status === 'CONFIRMED');
        const totalConfirmed = confirmedPayments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
        if (totalConfirmed >= invoice.totalAmount) {
          calculatedStatus = 'PAID';
        } else if (totalConfirmed > 0) {
          calculatedStatus = 'PARTIALLY_PAID';
        }
      }
      return {
        ...invoice,
        status: calculatedStatus,
      };
    });

    return NextResponse.json(
      createSuccessResponse({
        invoices: invoicesWithAccurateStatus,
        pagination: {
          page: all ? 1 : page,
          limit: all ? total : limit,
          total,
          totalPages: all ? 1 : Math.ceil(total / limit),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
