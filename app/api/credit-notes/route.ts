import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createCreditNoteSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import type { TransactionClient } from '@/lib/types';
import { z } from 'zod';

// GET /api/credit-notes - List credit notes with filters
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');
    const creditNoteType = searchParams.get('creditNoteType');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const where: {
      customerId?: string;
      invoiceId?: string;
      status?: string;
      creditNoteType?: string;
    } = {};
    if (customerId) where.customerId = customerId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (status) where.status = status;
    if (creditNoteType) where.creditNoteType = creditNoteType;

    const creditNotes = await prisma.creditNote.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
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
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            creditNote: false,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Calculate summary
    type CreditNoteSummaryItem = {
      status: string;
      totalAmount: number;
      appliedAmount: number;
      remainingAmount: number;
    };

    const summary = {
      total: creditNotes.length,
      draft: creditNotes.filter((cn: CreditNoteSummaryItem) => cn.status === 'DRAFT').length,
      pending: creditNotes.filter((cn: CreditNoteSummaryItem) => cn.status === 'PENDING').length,
      approved: creditNotes.filter((cn: CreditNoteSummaryItem) => cn.status === 'APPROVED').length,
      applied: creditNotes.filter((cn: CreditNoteSummaryItem) => cn.status === 'APPLIED').length,
      cancelled: creditNotes.filter((cn: CreditNoteSummaryItem) => cn.status === 'CANCELLED').length,
      totalAmount: creditNotes.reduce((sum: number, cn: CreditNoteSummaryItem) => sum + cn.totalAmount, 0),
      totalApplied: creditNotes.reduce((sum: number, cn: CreditNoteSummaryItem) => sum + cn.appliedAmount, 0),
      totalRemaining: creditNotes.reduce((sum: number, cn: CreditNoteSummaryItem) => sum + cn.remainingAmount, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        creditNotes,
        summary,
      },
    });
  } catch (error) {
    console.error('GET /api/credit-notes error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch credit notes' } },
      { status: 500 }
    );
  }
}

// POST /api/credit-notes - Create a new credit note
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCreditNoteSchema.parse(body);

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const itemsWithTotals = validatedData.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * (item.taxRate || 0) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        ...item,
        taxAmount: itemTax,
        totalAmount: itemTotal,
      };
    });

    const totalAmount = subtotal + taxAmount;

    // Create credit note with items in a transaction
    const creditNote = await prisma.$transaction(async (tx: TransactionClient) => {
      // Generate unique credit note number
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const creditNoteNumber = `CN-${timestamp}-${random}`;

      // Create credit note
      const created = await tx.creditNote.create({
        data: {
          creditNoteNumber,
          customerId: validatedData.customerId,
          invoiceId: validatedData.invoiceId,
          creditNoteType: validatedData.creditNoteType,
          reason: validatedData.reason,
          referenceType: validatedData.referenceType,
          referenceId: validatedData.referenceId,
          notes: validatedData.notes,
          internalNotes: validatedData.internalNotes,
          subtotal,
          taxAmount,
          totalAmount,
          appliedAmount: 0,
          remainingAmount: totalAmount,
          issueDate: new Date(),
          status: 'DRAFT',
          createdBy: user.userId,
        },
      });

      // Create credit note items
      for (const item of itemsWithTotals) {
        await tx.creditNoteItem.create({
          data: {
            creditNoteId: created.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
            productId: item.productId,
            sku: item.sku,
            notes: item.notes,
          },
        });
      }

      // Return full credit note with relations
      return tx.creditNote.findUnique({
        where: { id: created.id },
        include: {
          customer: true,
          invoice: true,
          items: true,
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });

    // Audit log
    await createAuditLog({
      userId: user.userId,
      action: 'UPDATE_CREDIT_NOTE',
      entityType: 'CreditNote',
      entityId: creditNote!.id,
      description: `Created credit note ${creditNote!.creditNoteNumber} for ${totalAmount.toFixed(2)}`,
    });

    return NextResponse.json({
      success: true,
      data: creditNote,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/credit-notes error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: 'Validation error', details: error.errors } },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to create credit note';
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}
