import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  assetsValue: number;
  liabilities: number;
  equity: number;
  debtToEquityRatio: number;
  returnOnAssets: number;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now.setHours(23, 59, 59, 999));

    switch (period) {
      case 'quarterly':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(2000, 0, 1); // Far past date for all-time
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    // Fetch real data from database
    const [
      confirmedPayments,
      completedPosOrders,
      expenses,
      supplierPayments,
      accountsReceivable,
      accountsPayable
    ] = await Promise.all([
      // Revenue from confirmed payments
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paymentDate: { gte: startDate, lte: endDate },
          status: { in: ['CONFIRMED', 'RECONCILED'] },
        },
      }),
      // Revenue from completed POS orders (paid)
      prisma.posOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'PAID',
        },
      }),
      // Total expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
      }),
      // Supplier payments (also expenses)
      prisma.supplierPayment.aggregate({
        _sum: { amount: true },
        where: {
          paymentDate: { gte: startDate, lte: endDate },
        },
      }),
      // Accounts Receivable (outstanding invoices)
      prisma.invoice.aggregate({
        _sum: { balanceAmount: true },
        where: {
          balanceAmount: { gt: 0 },
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
      }),
      // Accounts Payable (outstanding supplier bills)
      prisma.supplierBill.aggregate({
        _sum: { balanceAmount: true },
        where: {
          balanceAmount: { gt: 0 },
          status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
      }),
    ]);

    // Calculate totals
    const paymentRevenue = confirmedPayments._sum.amount || 0;
    const posRevenue = completedPosOrders._sum.totalAmount || 0;
    const totalRevenue = paymentRevenue + posRevenue;

    const expenseAmount = expenses._sum.amount || 0;
    const supplierPaymentAmount = supplierPayments._sum.amount || 0;
    const totalExpenses = expenseAmount + supplierPaymentAmount;

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get average product price for inventory valuation
    const productsForValuation = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { quantity: true, price: true },
    });
    
    const inventoryAssetValue = productsForValuation.reduce(
      (sum, product) => sum + (product.quantity * product.price),
      0
    );

    const arValue = accountsReceivable._sum.balanceAmount || 0;
    const apValue = accountsPayable._sum.balanceAmount || 0;

    // Calculate financial metrics
    const assetsValue = inventoryAssetValue + arValue;
    const liabilities = apValue;
    const equity = assetsValue - liabilities;
    const debtToEquityRatio = equity > 0 ? liabilities / equity : 0;
    const returnOnAssets = assetsValue > 0 ? (netProfit / assetsValue) * 100 : 0;

    const data: FinancialMetrics = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      assetsValue,
      liabilities,
      equity,
      debtToEquityRatio,
      returnOnAssets,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    );
  }
}
