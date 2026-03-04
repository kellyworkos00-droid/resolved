import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = request.nextUrl.searchParams.get('period') || 'monthly';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now.setHours(23, 59, 59, 999));
    let periodName = 'Monthly';

    switch (period) {
      case 'quarterly':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        periodName = 'Quarterly';
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        periodName = 'Yearly';
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodName = 'Monthly';
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    // Fetch revenue data
    const [
      confirmedPayments,
      completedPosOrders,
      invoiceRevenue,
      allExpenses,
      supplierPayments,
    ] = await Promise.all([
      // Payments (customer payments on invoices)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paymentDate: { gte: startDate, lte: endDate },
          status: { in: ['CONFIRMED', 'RECONCILED'] },
        },
      }),
      // POS orders (direct sales)
      prisma.posOrder.aggregate({
        _sum: { totalAmount: true, subtotal: true, tax: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'PAID',
        },
      }),
      // Sales orders/invoices created in period
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
          issueDate: { gte: startDate, lte: endDate },
          status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] },
        },
      }),
      // Operating expenses
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate, lte: endDate },
        },
        include: {
          categoryRef: true,
        },
      }),
      // Supplier payments (COGS proxy)
      prisma.supplierPayment.aggregate({
        _sum: { amount: true },
        where: {
          paymentDate: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Calculate revenue
    const paymentRevenue = confirmedPayments._sum.amount || 0;
    const posRevenue = completedPosOrders._sum.totalAmount || 0;
    const invoiceRevenueTotal = invoiceRevenue._sum.totalAmount || 0;
    
    // Use the higher of payment/POS vs invoice totals to avoid double counting
    const sales = Math.max(paymentRevenue, posRevenue);
    const serviceIncome = invoiceRevenueTotal > sales ? invoiceRevenueTotal - sales : 0;
    const revenue = sales + serviceIncome;

    // Calculate Cost of Goods Sold (using supplier payments as proxy)
    const costOfGoods = supplierPayments._sum.amount || 0;

    // Categorize expenses
    let salaries = 0;
    let utilities = 0;
    let depreciation = 0;
    let interestExpense = 0;
    let taxExpense = 0;
    let otherExpenses = 0;

    allExpenses.forEach((expense) => {
      const categoryName = (expense.categoryRef?.name || expense.category || '').toLowerCase();
      const amount = expense.amount;

      if (categoryName.includes('salary') || categoryName.includes('wage') || categoryName.includes('payroll')) {
        salaries += amount;
      } else if (categoryName.includes('utility') || categoryName.includes('utilities') || categoryName.includes('electric') || categoryName.includes('water')) {
        utilities += amount;
      } else if (categoryName.includes('depreciation') || categoryName.includes('amortization')) {
        depreciation += amount;
      } else if (categoryName.includes('interest') || categoryName.includes('loan') || categoryName.includes('finance')) {
        interestExpense += amount;
      } else if (categoryName.includes('tax')) {
        taxExpense += amount;
      } else {
        otherExpenses += amount;
      }
    });

    const operatingExpenses = salaries + utilities + depreciation + otherExpenses;

    // Calculate P&L metrics
    const grossProfit = revenue - costOfGoods;
    const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const operatingIncome = grossProfit - operatingExpenses;
    const netIncome = operatingIncome - interestExpense - taxExpense;
    const netProfitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    const data = {
      period: periodName,
      revenue,
      costOfGoods,
      grossProfit,
      grossProfitMargin,
      operatingExpenses,
      operatingIncome,
      interestExpense,
      taxExpense,
      netIncome,
      netProfitMargin,
      breakdown: {
        sales,
        serviceIncome,
        costOfSales: costOfGoods,
        salaries,
        utilities,
        depreciation,
        otherExpenses,
      },
    };

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('P&L Report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch P&L report' },
      { status: 500 }
    );
  }
}
