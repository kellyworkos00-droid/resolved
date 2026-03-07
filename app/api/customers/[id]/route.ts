import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { updateCustomerSchema } from '@/lib/validations';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

/**
 * GET /api/customers/[id]
 * Get customer details with invoices
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(request, 'customer.view');

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json(
        createErrorResponse('Customer not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Get all invoices for this customer
    const allInvoices = await prisma.invoice.findMany({
      where: { customerId: params.id },
      orderBy: { issueDate: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        issueDate: true,
        dueDate: true,
        paidAmount: true,
      },
    });

    // Get current (unpaid/pending) invoices
    const currentInvoices = allInvoices.filter(
      (inv: { status: string }) => inv.status !== 'PAID' && inv.status !== 'CANCELLED'
    );

    return NextResponse.json(
      createSuccessResponse({
        customer,
        invoices: allInvoices,
        currentInvoices,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customers/[id]
 * Update a customer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(request, 'customer.update');

    const body = (await request.json()) as {
      customerCode?: string;
      name?: string;
      email?: string;
      phone?: string;
      billingAddress?: string;
      creditLimit?: number | string;
    };

    const parsed = updateCustomerSchema.safeParse({
      ...body,
      creditLimit:
        body.creditLimit === undefined || body.creditLimit === null || body.creditLimit === ''
          ? undefined
          : Number(body.creditLimit),
    });

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Validation error', 'VALIDATION_ERROR', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        createErrorResponse('Customer not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    if (parsed.data.customerCode && parsed.data.customerCode !== existing.customerCode) {
      const duplicate = await prisma.customer.findUnique({
        where: { customerCode: parsed.data.customerCode },
      });

      if (duplicate) {
        return NextResponse.json(
          createErrorResponse('Customer code already exists', 'DUPLICATE_CODE'),
          { status: 400 }
        );
      }
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        customerCode: parsed.data.customerCode ?? existing.customerCode,
        name: parsed.data.name ?? existing.name,
        email: parsed.data.email ?? existing.email,
        phone: parsed.data.phone ?? existing.phone,
        billingAddress: parsed.data.billingAddress ?? existing.billingAddress,
        creditLimit: parsed.data.creditLimit ?? existing.creditLimit,
      },
    });

    return NextResponse.json(
      createSuccessResponse(updated, 'Customer updated successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete a customer (soft delete via isActive flag)
 * Only ADMIN and OWNER roles can delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission(request, 'customer.delete');

    // Check if user has ADMIN or OWNER role
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return NextResponse.json(
        createErrorResponse('Only Admins and Owners can delete customers', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        invoices: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        createErrorResponse('Customer not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Check if customer has active invoices
    const activeInvoices = existing.invoices?.filter(
      (inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED'
    ) || [];

    if (activeInvoices.length > 0) {
      return NextResponse.json(
        createErrorResponse(
          `Cannot delete customer with ${activeInvoices.length} active invoice(s). Please settle all invoices first.`,
          'CUSTOMER_HAS_ACTIVE_INVOICES'
        ),
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive
    const deleted = await prisma.customer.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json(
      createSuccessResponse(deleted, 'Customer deleted successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
