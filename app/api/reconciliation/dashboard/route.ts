import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import prisma from '@/lib/prisma';

/**
 * GET /api/reconciliation/dashboard
 * Get dashboard summary statistics
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, 'reconciliation.view');

    // Get statistics in parallel
    const [
      totalCollected,
      pendingCount,
      unmatchedCount,
      matchedCount,
      recentTransactions,
      topCustomers,
    ] = await Promise.all([
      // Total collected this month
      prisma.bankTransaction.aggregate({
        where: {
          status: 'MATCHED',
          transactionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),

      // Pending transactions count
      prisma.bankTransaction.count({
        where: { status: 'PENDING' },
      }),

      // Unmatched transactions count
      prisma.bankTransaction.count({
        where: { status: 'UNMATCHED' },
      }),

      // Matched transactions count
      prisma.bankTransaction.count({
        where: { status: 'MATCHED' },
      }),

      // Recent transactions
      prisma.bankTransaction.findMany({
        take: 10,
        orderBy: { transactionDate: 'desc' },
        include: {
          payments: {
            include: {
              customer: true,
              invoice: true,
            },
          },
        },
      }),

      // Top customers by payment amount this month
      prisma.payment.groupBy({
        by: ['customerId'],
        where: {
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          status: 'CONFIRMED',
        },
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Get customer details for top customers
    const topCustomerIds = topCustomers.map((c) => c.customerId);
    const customerDetails = await prisma.customer.findMany({
      where: { id: { in: topCustomerIds } },
      select: { id: true, name: true, customerCode: true },
    });

    const topCustomersWithDetails = topCustomers.map((tc) => {
      const customer = customerDetails.find((c) => c.id === tc.customerId);
      return {
        customer,
        totalPaid: Number(tc._sum?.amount ?? 0),
        paymentsCount: tc._count?._all ?? 0,
      };
    });

    // Calculate outstanding balance
    const outstandingInvoices = await prisma.invoice.aggregate({
      where: {
        status: {
          in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
      },
      _sum: { balanceAmount: true },
    });

    return NextResponse.json(
      createSuccessResponse({
        summary: {
          totalCollectedThisMonth: totalCollected._sum.amount || 0,
          outstandingBalance: outstandingInvoices._sum.balanceAmount || 0,
          pendingTransactions: pendingCount,
          unmatchedTransactions: unmatchedCount,
          matchedTransactions: matchedCount,
        },
        recentTransactions,
        topCustomers: topCustomersWithDetails,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
