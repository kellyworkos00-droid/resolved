import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateCreditNoteSchema } from '@/lib/validations';
import { verifyAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

// GET /api/credit-notes/[id] - Get credit note details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const creditNote = await prisma.creditNote.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            balanceAmount: true,
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
        items: true,
      },
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: { message: 'Credit note not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: creditNote,
    });
  } catch (error) {
    console.error('GET /api/credit-notes/[id] error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch credit note' } },
      { status: 500 }
    );
  }
}

// PATCH /api/credit-notes/[id] - Update credit note (approve, apply, cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Get current credit note
    const creditNote = await prisma.creditNote.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: { message: 'Credit note not found' } },
        { status: 404 }
      );
    }

    let updated;
    let auditMessage = '';

    // Handle different actions
    if (action === 'APPROVE') {
      // Can only approve PENDING credit notes
      if (creditNote.status !== 'PENDING' && creditNote.status !== 'DRAFT') {
        return NextResponse.json(
          { error: { message: `Cannot approve credit note with status ${creditNote.status}` } },
          { status: 400 }
        );
      }

      updated = await prisma.creditNote.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedBy: user.userId,
          approvedDate: new Date(),
        },
        include: {
          customer: true,
          invoice: true,
          items: true,
          createdByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          approvedByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      auditMessage = `Approved credit note ${creditNote.creditNoteNumber}`;
    } else if (action === 'APPLY') {
      // Can only apply APPROVED credit notes
      if (creditNote.status !== 'APPROVED') {
        return NextResponse.json(
          { error: { message: `Cannot apply credit note with status ${creditNote.status}` } },
          { status: 400 }
        );
      }

      const { invoiceId, amount } = body;
      if (!invoiceId || !amount) {
        return NextResponse.json(
          { error: { message: 'Invoice ID and amount are required to apply credit note' } },
          { status: 400 }
        );
      }

      if (amount > creditNote.remainingAmount) {
        return NextResponse.json(
          { error: { message: 'Amount exceeds remaining credit' } },
          { status: 400 }
        );
      }

      // Update credit note and invoice in transaction
      updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Get invoice
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (!invoice) {
          throw new Error('Invoice not found');
        }

        // Update invoice balance
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: invoice.paidAmount + amount,
            balanceAmount: invoice.balanceAmount - amount,
            status: invoice.balanceAmount - amount <= 0 ? 'PAID' : 'PARTIALLY_PAID',
          },
        });

        // Update credit note
        const newAppliedAmount = creditNote.appliedAmount + amount;
        const newRemainingAmount = creditNote.remainingAmount - amount;

        return tx.creditNote.update({
          where: { id: params.id },
          data: {
            appliedAmount: newAppliedAmount,
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount <= 0 ? 'APPLIED' : 'APPROVED',
            appliedDate: newRemainingAmount <= 0 ? new Date() : creditNote.appliedDate,
          },
          include: {
            customer: true,
            invoice: true,
            items: true,
            createdByUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            approvedByUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        });
      });

      auditMessage = `Applied ${amount} from credit note ${creditNote.creditNoteNumber} to invoice`;
    } else if (action === 'CANCEL') {
      // Can only cancel DRAFT or PENDING credit notes
      if (creditNote.status !== 'DRAFT' && creditNote.status !== 'PENDING') {
        return NextResponse.json(
          { error: { message: `Cannot cancel credit note with status ${creditNote.status}` } },
          { status: 400 }
        );
      }

      updated = await prisma.creditNote.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          customer: true,
          invoice: true,
          items: true,
          createdByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          approvedByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      auditMessage = `Cancelled credit note ${creditNote.creditNoteNumber}`;
    } else {
      // Regular update (notes, etc.)
      const validatedData = updateCreditNoteSchema.parse(body);
      
      updated = await prisma.creditNote.update({
        where: { id: params.id },
        data: validatedData,
        include: {
          customer: true,
          invoice: true,
          items: true,
          createdByUser: {
            select: { id: true, firstName:true, lastName: true, email: true },
          },
          approvedByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      auditMessage = `Updated credit note ${creditNote.creditNoteNumber}`;
    }

    // Audit log
    await createAuditLog({
      userId: user.userId,
      action: 'UPDATE_CREDIT_NOTE',
      entityType: 'CreditNote',
      entityId: params.id,
      description: auditMessage,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    console.error('PATCH /api/credit-notes/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: 'Validation error', details: error.errors } },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to update credit note';
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}

// DELETE /api/credit-notes/[id] - Delete credit note (only DRAFT)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Get credit note
    const creditNote = await prisma.creditNote.findUnique({
      where: { id: params.id },
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: { message: 'Credit note not found' } },
        { status: 404 }
      );
    }

    // Can only delete DRAFT credit notes
    if (creditNote.status !== 'DRAFT') {
      return NextResponse.json(
        { error: { message: 'Can only delete draft credit notes' } },
        { status: 400 }
      );
    }

    // Delete credit note (items will be cascade deleted)
    await prisma.creditNote.delete({
      where: { id: params.id },
    });

    // Audit log
    await createAuditLog({
      userId: user.userId,
      action: 'DELETE_RECORD',
      entityType: 'CreditNote',
      entityId: params.id,
      description: `Deleted credit note ${creditNote.creditNoteNumber}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Credit note deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/credit-notes/[id] error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to delete credit note' } },
      { status: 500 }
    );
  }
}
