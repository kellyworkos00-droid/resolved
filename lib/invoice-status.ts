/**
 * Invoice Status Calculator
 * Ensures accurate invoice status based on payment state
 */

import prisma from '@/lib/prisma';
import { calculateInvoiceStatus, InvoiceStatus, isInvoiceNotPaid } from '@/lib/payment-methods';

/**
 * Calculate and update invoice status based on actual payments
 */
export async function calculateAndUpdateInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: {
        where: { status: 'CONFIRMED' },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Calculate actual paid amount from confirmed payments
  const actualPaidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

  // Calculate new status
  const newStatus = calculateInvoiceStatus(
    invoice.totalAmount,
    actualPaidAmount,
    invoice.dueDate,
    invoice.status
  );

  // Update if changed
  if (newStatus !== invoice.status) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidAmount: actualPaidAmount,
        balanceAmount: Math.max(invoice.totalAmount - actualPaidAmount, 0),
        ...(newStatus === InvoiceStatus.PAID && { paidDate: new Date() }),
        ...(newStatus !== InvoiceStatus.PAID && { paidDate: null }),
      },
    });
  }

  return newStatus;
}

/**
 * Get invoice with accurate status
 */
export async function getInvoiceWithAccurateStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      payments: {
        where: { status: 'CONFIRMED' },
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!invoice) {
    return null;
  }

  // Calculate actual amounts
  const actualPaidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
  const actualStatus = calculateInvoiceStatus(
    invoice.totalAmount,
    actualPaidAmount,
    invoice.dueDate,
    invoice.status
  );

  return {
    ...invoice,
    status: actualStatus,
    paidAmount: actualPaidAmount,
    balanceAmount: Math.max(invoice.totalAmount - actualPaidAmount, 0),
    isNotPaid: isInvoiceNotPaid(actualStatus),
    isFullyPaid: actualStatus === InvoiceStatus.PAID,
  };
}

/**
 * Get all invoices for customer with accurate statuses
 */
export async function getCustomerInvoicesWithAccurateStatus(customerId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    include: {
      payments: {
        where: { status: 'CONFIRMED' },
      },
    },
    orderBy: { issueDate: 'desc' },
  });

  return invoices.map((invoice) => {
    const actualPaidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    const actualStatus = calculateInvoiceStatus(
      invoice.totalAmount,
      actualPaidAmount,
      invoice.dueDate,
      invoice.status
    );

    return {
      ...invoice,
      status: actualStatus,
      paidAmount: actualPaidAmount,
      balanceAmount: Math.max(invoice.totalAmount - actualPaidAmount, 0),
      isNotPaid: isInvoiceNotPaid(actualStatus),
      isFullyPaid: actualStatus === InvoiceStatus.PAID,
    };
  });
}

/**
 * Get all unpaid invoices
 */
export async function getUnpaidInvoices(customerId?: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      ...(customerId && { customerId }),
      status: {
        notIn: [InvoiceStatus.CANCELLED, InvoiceStatus.PAID],
      },
    },
    include: {
      customer: true,
      payments: {
        where: { status: 'CONFIRMED' },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return invoices
    .map((invoice) => {
      const actualPaidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      const actualStatus = calculateInvoiceStatus(
        invoice.totalAmount,
        actualPaidAmount,
        invoice.dueDate,
        invoice.status
      );

      return {
        ...invoice,
        status: actualStatus,
        paidAmount: actualPaidAmount,
        balanceAmount: Math.max(invoice.totalAmount - actualPaidAmount, 0),
        isNotPaid: isInvoiceNotPaid(actualStatus),
        isFullyPaid: actualStatus === InvoiceStatus.PAID,
      };
    })
    .filter((inv) => isInvoiceNotPaid(inv.status as InvoiceStatus));
}

/**
 * Get invoice summary with payment status
 */
export async function getInvoiceSummary(invoiceId: string) {
  const invoice = await getInvoiceWithAccurateStatus(invoiceId);

  if (!invoice) {
    return null;
  }

  const remainingBalance = invoice.balanceAmount;
  const percentagePaid = (invoice.paidAmount / invoice.totalAmount) * 100;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    isNotPaid: invoice.isNotPaid,
    isFullyPaid: invoice.isFullyPaid,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    remainingBalance,
    percentagePaid: Math.round(percentagePaid),
    paymentCount: invoice.payments.length,
    lastPaymentDate: invoice.payments[0]?.paymentDate || null,
    dueDate: invoice.dueDate,
    isOverdue: new Date() > invoice.dueDate && invoice.isNotPaid,
    customerName: invoice.customer.name,
  };
}

/**
 * Recalculate and update all invoices for a customer
 */
export async function recalculateCustomerInvoices(customerId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    include: {
      payments: {
        where: { status: 'CONFIRMED' },
      },
    },
  });

  const updates = invoices.map(async (invoice) => {
    const actualPaidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    const newStatus = calculateInvoiceStatus(
      invoice.totalAmount,
      actualPaidAmount,
      invoice.dueDate,
      invoice.status
    );

    if (newStatus !== invoice.status || actualPaidAmount !== invoice.paidAmount) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          paidAmount: actualPaidAmount,
          balanceAmount: Math.max(invoice.totalAmount - actualPaidAmount, 0),
          ...(newStatus === InvoiceStatus.PAID && { paidDate: new Date() }),
        },
      });

      return {
        invoiceId: invoice.id,
        oldStatus: invoice.status,
        newStatus,
        updated: true,
      };
    }

    return {
      invoiceId: invoice.id,
      status: newStatus,
      updated: false,
    };
  });

  return Promise.all(updates);
}

/**
 * Get payment summary for dashboard
 */
export async function getPaymentSummary(startDate?: Date, endDate?: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      status: 'CONFIRMED',
      ...(startDate || endDate
        ? {
            paymentDate: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    },
  });

  const totalCollected = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
  const paymentsByMethod: Record<string, number> = {};

  payments.forEach((payment: { paymentMethod: string; amount: number }) => {
    paymentsByMethod[payment.paymentMethod] =
      (paymentsByMethod[payment.paymentMethod] || 0) + payment.amount;
  });

  return {
    totalPayments: payments.length,
    totalCollected,
    averagePayment: Math.round(totalCollected / payments.length) || 0,
    paymentsByMethod,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * Get invoice aging report
 */
export async function getInvoiceAgingReport(customerId?: string) {
  const invoices = await getUnpaidInvoices(customerId);
  const today = new Date();

  const current: typeof invoices = [];
  const thirtyDaysOverdue: typeof invoices = [];
  const sixtyDaysOverdue: typeof invoices = [];
  const ninetyDaysOverdue: typeof invoices = [];
  const over90DaysOverdue: typeof invoices = [];

  invoices.forEach((invoice) => {
    const daysOverdue = Math.floor(
      (today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue < 0) {
      current.push(invoice);
    } else if (daysOverdue < 30) {
      thirtyDaysOverdue.push(invoice);
    } else if (daysOverdue < 60) {
      sixtyDaysOverdue.push(invoice);
    } else if (daysOverdue < 90) {
      ninetyDaysOverdue.push(invoice);
    } else {
      over90DaysOverdue.push(invoice);
    }
  });

  return {
    current: {
      count: current.length,
      total: current.reduce((sum, inv) => sum + inv.balanceAmount, 0),
      invoices: current,
    },
    thirtyDaysOverdue: {
      count: thirtyDaysOverdue.length,
      total: thirtyDaysOverdue.reduce((sum, inv) => sum + inv.balanceAmount, 0),
      invoices: thirtyDaysOverdue,
    },
    sixtyDaysOverdue: {
      count: sixtyDaysOverdue.length,
      total: sixtyDaysOverdue.reduce((sum, inv) => sum + inv.balanceAmount, 0),
      invoices: sixtyDaysOverdue,
    },
    ninetyDaysOverdue: {
      count: ninetyDaysOverdue.length,
      total: ninetyDaysOverdue.reduce((sum, inv) => sum + inv.balanceAmount, 0),
      invoices: ninetyDaysOverdue,
    },
    over90DaysOverdue: {
      count: over90DaysOverdue.length,
      total: over90DaysOverdue.reduce((sum, inv) => sum + inv.balanceAmount, 0),
      invoices: over90DaysOverdue,
    },
  };
}
