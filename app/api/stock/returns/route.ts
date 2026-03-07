import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { createProductReturnSchema } from '@/lib/validations';
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import type { TransactionClient } from '@/lib/types';

function buildReturnNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `RET-${timestamp}-${random}`;
}

// GET /api/stock/returns - List all product returns
export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, 'stock.view');

    const { searchParams } = new URL(request.url);
    const returnType = searchParams.get('returnType');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const supplierId = searchParams.get('supplierId');

    const where: {
      returnType?: string;
      status?: string;
      customerId?: string;
      supplierId?: string;
    } = {};
    if (returnType) where.returnType = returnType;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (supplierId) where.supplierId = supplierId;

    const returns = await prisma.productReturn.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
              },
            },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const summary = {
      total: returns.length,
      pending: returns.filter((r) => r.status === 'PENDING').length,
      approved: returns.filter((r) => r.status === 'APPROVED').length,
      processing: returns.filter((r) => r.status === 'PROCESSING').length,
      completed: returns.filter((r) => r.status === 'COMPLETED').length,
      rejected: returns.filter((r) => r.status === 'REJECTED').length,
      totalRefundAmount: returns.reduce((sum, r) => sum + r.refundAmount, 0),
      totalRestockFee: returns.reduce((sum, r) => sum + r.restockFee, 0),
    };

    return NextResponse.json(
      createSuccessResponse({ returns, summary }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get returns error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

// POST /api/stock/returns - Create a new product return
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'stock.return');
    const body = await request.json();

    const parsed = createProductReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Validation error', 'VALIDATION_ERROR', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const {
      returnType,
      referenceType,
      referenceId,
      customerId,
      supplierId,
      reason,
      restockFee,
      notes,
      items,
    } = parsed.data;

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const refundAmount = totalAmount - (restockFee || 0);

    const productReturn = await prisma.$transaction(async (tx: TransactionClient) => {
      const created = await tx.productReturn.create({
        data: {
          returnNumber: buildReturnNumber(),
          returnType,
          referenceType,
          referenceId,
          customerId,
          supplierId,
          reason,
          status: 'PENDING',
          totalAmount,
          refundAmount,
          restockFee: restockFee || 0,
          notes,
          createdBy: user.userId,
        },
      });

      // Create return items
      for (const item of items) {
        await tx.productReturnItem.create({
          data: {
            returnId: created.id,
            productId: item.productId,
            locationId: item.locationId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            condition: item.condition || 'GOOD',
            restockable: item.restockable !== false,
            notes: item.notes,
          },
        });
      }

      return tx.productReturn.findUnique({
        where: { id: created.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          createdByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });

    await createAuditLog({
      userId: user.userId,
      action: 'PRODUCT_RETURN_CREATE',
      entityType: 'ProductReturn',
      entityId: productReturn?.id,
      description: `Product return created: ${productReturn?.returnNumber}`,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: {
        returnNumber: productReturn?.returnNumber,
        returnType,
        itemCount: items.length,
      },
    });

    return NextResponse.json(
      createSuccessResponse(productReturn, 'Product return created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create return error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
