import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

/**
 * Financial Analytics Service
 * Provides calculations for cash flow, aging reports, financial ratios, and more
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AgeingBucket {
  range: string; // e.g., "0-30 days", "31-60 days"
  days: { min: number; max: number };
  invoiceCount: number;
  totalAmount: Decimal;
  percentage: number;
}

export interface AgingReport {
  date: Date;
  invoices: AgeingBucket[];
  totalOutstanding: Decimal;
  totalInvoices: number;
}

export interface CashFlowData {
  date: Date;
  inflows: Decimal;
  outflows: Decimal;
  netFlow: Decimal;
  cumulativeBalance: Decimal;
}

export interface FinancialRatio {
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  debtToAssets: number;
  assetTurnover: number;
  returnOnAssets: number;
  returnOnEquity: number;
  profitMargin: number;
  timestamp: Date;
}

export interface DashboardMetrics {
  totalRevenue: Decimal;
  totalExpenses: Decimal;
  netIncome: Decimal;
  totalAssets: Decimal;
  totalLiabilities: Decimal;
  totalEquity: Decimal;
  cashOnHand: Decimal;
  accountsReceivable: Decimal;
  accountsPayable: Decimal;
  outstandingInvoices: number;
  overdueInvoices: number;
  metrics: FinancialRatio;
}

// ============================================================================
// AGING REPORT
// ============================================================================

/**
 * Generate aging report for outstanding invoices
 */
export async function generateAgingReport(asOfDate: Date = new Date()): Promise<AgingReport> {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lte: asOfDate },
      },
      include: { customer: true },
    });

    const buckets: AgeingBucket[] = [
      {
        range: 'Current (0-30)',
        days: { min: 0, max: 30 },
        invoiceCount: 0,
        totalAmount: new Decimal(0),
        percentage: 0,
      },
      {
        range: '31-60 Days',
        days: { min: 31, max: 60 },
        invoiceCount: 0,
        totalAmount: new Decimal(0),
        percentage: 0,
      },
      {
        range: '61-90 Days',
        days: { min: 61, max: 90 },
        invoiceCount: 0,
        totalAmount: new Decimal(0),
        percentage: 0,
      },
      {
        range: '90+ Days',
        days: { min: 91, max: Infinity },
        invoiceCount: 0,
        totalAmount: new Decimal(0),
        percentage: 0,
      },
    ];

    let totalOutstanding = new Decimal(0);

    for (const invoice of invoices) {
      const daysOverdue = Math.floor(
        (asOfDate.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const amount = new Decimal(String(invoice.totalAmount));
      totalOutstanding = totalOutstanding.plus(amount);

      const bucket = buckets.find((b) => daysOverdue >= b.days.min && daysOverdue <= b.days.max);
      if (bucket) {
        bucket.invoiceCount++;
        bucket.totalAmount = bucket.totalAmount.plus(amount);
      }
    }

    // Calculate percentages
    for (const bucket of buckets) {
      bucket.percentage =
        totalOutstanding.toNumber() > 0
          ? (bucket.totalAmount.toNumber() / totalOutstanding.toNumber()) * 100
          : 0;
    }

    return {
      date: asOfDate,
      invoices: buckets,
      totalOutstanding,
      totalInvoices: invoices.length,
    };
  } catch (error) {
    console.error('Error generating aging report:', error);
    throw new Error('Failed to generate aging report');
  }
}

// ============================================================================
// CASH FLOW ANALYSIS
// ============================================================================

/**
 * Generate cash flow forecast for specified period
 */
export async function generateCashFlowForecast(
  startDate: Date,
  endDate: Date
): Promise<CashFlowData[]> {
  try {
    const cashFlowData: CashFlowData[] = [];
    const daysDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let cumulativeBalance = await getCurrentCashBalance();

    for (let dayOffset = 0; dayOffset <= daysDuration; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);

      // Get inflows (payments received)
      const payments = await prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            lte: new Date(currentDate.setHours(23, 59, 59, 999)),
          },
          status: 'COMPLETED',
        },
      });

      const inflows = payments.reduce(
        (sum: Decimal, p: any) => sum.plus(new Decimal(String(p.amount))),
        new Decimal(0)
      );

      // Get outflows (supplier payments)
      const supplierPayments = await prisma.supplierPayment.findMany({
        where: {
          paymentDate: {
            gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            lte: new Date(currentDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      const outflows = supplierPayments.reduce(
        (sum: Decimal, p: any) => sum.plus(new Decimal(String(p.amount))),
        new Decimal(0)
      );

      const netFlow = inflows.minus(outflows);
      cumulativeBalance = cumulativeBalance.plus(netFlow);

      cashFlowData.push({
        date: currentDate,
        inflows,
        outflows,
        netFlow,
        cumulativeBalance,
      });
    }

    return cashFlowData;
  } catch (error) {
    console.error('Error generating cash flow forecast:', error);
    throw new Error('Failed to generate cash flow forecast');
  }
}

/**
 * Get current cash balance from bank account
 */
async function getCurrentCashBalance(): Promise<Decimal> {
  try {
    // Get the main bank account (typically '1010')
    const cashAccount = await prisma.account.findFirst({
      where: {
        accountCode: '1010',
      },
    });

    return new Decimal(String(cashAccount?.currentBalance || 0));
  } catch {
    return new Decimal(0);
  }
}

// ============================================================================
// FINANCIAL RATIOS
// ============================================================================

/**
 * Calculate key financial ratios
 */
export async function calculateFinancialRatios(): Promise<FinancialRatio> {
  try {
    // Fetch financial data
    const [assets, liabilities, equity, revenue, netIncome] = await Promise.all([
      getTotalAssets(),
      getTotalLiabilities(),
      getTotalEquity(),
      getTotalRevenue(),
      getNetIncome(),
    ]);

    // Debt to Equity Ratio
    const debtToEquity = equity.toNumber() > 0 ? liabilities.dividedBy(equity).toNumber() : 0;

    // Current Ratio (simplified - assets / liabilities)
    const currentRatio = liabilities.toNumber() > 0 ? assets.dividedBy(liabilities).toNumber() : 0;

    // Quick Ratio (liquid assets / current liabilities)
    const quickRatio = currentRatio * 0.8; // Conservative estimate

    // Debt to Assets Ratio
    const debtToAssets = assets.toNumber() > 0 ? liabilities.dividedBy(assets).toNumber() : 0;

    // Asset Turnover (revenue / assets)
    const assetTurnover = assets.toNumber() > 0 ? revenue.dividedBy(assets).toNumber() : 0;

    // Return on Assets (net income / assets)
    const returnOnAssets = assets.toNumber() > 0 ? netIncome.dividedBy(assets).toNumber() : 0;

    // Return on Equity (net income / equity)
    const returnOnEquity = equity.toNumber() > 0 ? netIncome.dividedBy(equity).toNumber() : 0;

    // Profit Margin (net income / revenue)
    const profitMargin = revenue.toNumber() > 0 ? netIncome.dividedBy(revenue).toNumber() : 0;

    return {
      debtToEquity,
      currentRatio,
      quickRatio,
      debtToAssets,
      assetTurnover,
      returnOnAssets,
      returnOnEquity,
      profitMargin,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error calculating financial ratios:', error);
    throw new Error('Failed to calculate financial ratios');
  }
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const [
      totalRevenue,
      totalExpenses,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquity,
      cashOnHand,
      accountsReceivable,
      accountsPayable,
    ] = await Promise.all([
      getTotalRevenue(),
      getTotalExpenses(),
      getNetIncome(),
      getTotalAssets(),
      getTotalLiabilities(),
      getTotalEquity(),
      getCashBalance(),
      getAccountsReceivable(),
      getAccountsPayable(),
    ]);

    const metrics = await calculateFinancialRatios();

    const [outstandingInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalEquity,
      cashOnHand,
      accountsReceivable,
      accountsPayable,
      outstandingInvoices,
      overdueInvoices,
      metrics,
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw new Error('Failed to get dashboard metrics');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getTotalAssets(): Promise<Decimal> {
  const accounts = await prisma.account.findMany({
    where: {
      accountType: 'ASSET',
    },
  });

  return accounts.reduce(
    (sum: Decimal, account: any) => sum.plus(new Decimal(String(account.currentBalance || 0))),
    new Decimal(0)
  );
}

async function getTotalLiabilities(): Promise<Decimal> {
  const accounts = await prisma.account.findMany({
    where: {
      accountType: 'LIABILITY',
    },
  });

  return accounts.reduce(
    (sum: Decimal, account: any) => sum.plus(new Decimal(String(account.currentBalance || 0))),
    new Decimal(0)
  );
}

async function getTotalEquity(): Promise<Decimal> {
  const accounts = await prisma.account.findMany({
    where: {
      accountType: 'EQUITY',
    },
  });

  return accounts.reduce(
    (sum: Decimal, account: any) => sum.plus(new Decimal(String(account.currentBalance || 0))),
    new Decimal(0)
  );
}

async function getTotalRevenue(): Promise<Decimal> {
  const accounts = await prisma.account.findMany({
    where: {
      accountType: 'REVENUE',
    },
  });

  return accounts.reduce(
    (sum: Decimal, account: any) => sum.plus(new Decimal(String(account.currentBalance || 0))),
    new Decimal(0)
  );
}

async function getTotalExpenses(): Promise<Decimal> {
  const accounts = await prisma.account.findMany({
    where: {
      accountType: 'EXPENSE',
    },
  });

  return accounts.reduce(
    (sum: Decimal, account: any) => sum.plus(new Decimal(String(account.currentBalance || 0))),
    new Decimal(0)
  );
}

async function getNetIncome(): Promise<Decimal> {
  const revenue = await getTotalRevenue();
  const expenses = await getTotalExpenses();
  return revenue.minus(expenses);
}

async function getCashBalance(): Promise<Decimal> {
  return getCurrentCashBalance();
}

async function getAccountsReceivable(): Promise<Decimal> {
  try {
    const arAccount = await prisma.account.findFirst({
      where: { accountCode: '1200' },
    });

    return new Decimal(String(arAccount?.currentBalance || 0));
  } catch {
    return new Decimal(0);
  }
}

async function getAccountsPayable(): Promise<Decimal> {
  try {
    const apAccount = await prisma.account.findFirst({
      where: { accountCode: '2000' },
    });

    return new Decimal(String(apAccount?.currentBalance || 0));
  } catch {
    return new Decimal(0);
  }
}

/**
 * Format Decimal to currency string
 */
export function formatCurrency(value: Decimal | number, decimals = 2): string {
  const num = typeof value === 'number' ? new Decimal(value) : value;
  return num.toFixed(decimals);
}

/**
 * Format Decimal to percentage
 */
export function formatPercentage(value: Decimal | number, decimals = 2): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return (num * 100).toFixed(decimals) + '%';
}
