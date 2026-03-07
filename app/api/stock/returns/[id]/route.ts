import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { adjustStockLevel } from '@/lib/stock';
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import type { TransactionClient } from '@/lib/types';
import type { AuditAction } from '@/lib/audit';

interface RouteParams {
  params: { id: string };
}

// GET /api/stock/returns/[id] - Get a specific return
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(request, 'stock.view');

    const productReturn = await prisma.productReturn.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                price: true,
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
    });

    if (!productReturn) {
      return NextResponse.json(
        createErrorResponse('Product return not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(productReturn), { status: 200 });
  } catch (error) {
    console.error('Get return error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

// PATCH /api/stock/returns/[id] - Update return status (approve, process, complete, reject)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, 'stock.return');
    const body = await request.json();
    const { action } = body; // APPROVE, PROCESS, COMPLETE, REJECT

    if (!['APPROVE', 'PROCESS', 'COMPLETE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        createErrorResponse('Invalid action', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const productReturn = await tx.productReturn.findUnique({
        where: { id: params.id },
        include: { items: true },
      });

      if (!productReturn) {
        return null;
      }

      const updateData: {
        updatedAt: Date;
        status?: 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
        approvedDate?: Date;
        approvedBy?: string;
        completedDate?: Date;
      } = { updatedAt: new Date() };

      switch (action) {
        case 'APPROVE':
          if (productReturn.status !== 'PENDING') {
            throw new Error('Only pending returns can be approved');
          }
          updateData.status = 'APPROVED';
          updateData.approvedDate = new Date();
          updateData.approvedBy = user.userId;
          break;

        case 'PROCESS':
          if (productReturn.status !== 'APPROVED') {
            throw new Error('Only approved returns can be processed');
          }
          updateData.status = 'PROCESSING';
          break;

        case 'COMPLETE':
          if (productReturn.status !== 'PROCESSING') {
            throw new Error('Only processing returns can be completed');
          }

          // Restock items if they are restockable
          for (const item of productReturn.items) {
            const returnItem = await tx.productReturnItem.findUnique({
              where: { id: item.id },
            });

            if (returnItem?.restockable && returnItem.locationId) {
              await adjustStockLevel({
                prisma: tx,
                productId: item.productId,
                locationId: returnItem.locationId,
                quantityDelta: item.quantity,
                reference: productReturn.returnNumber,
                reason: `Return restocked: ${productReturn.returnType}`,
                createdById: user.userId,
              });
            }
          }

          updateData.status = 'COMPLETED';
          updateData.completedDate = new Date();
          break;

        case 'REJECT':
          if (!['PENDING', 'APPROVED'].includes(productReturn.status)) {
            throw new Error('Only pending or approved returns can be rejected');
          }
          updateData.status = 'REJECTED';
          break;
      }

      return tx.productReturn.update({
        where: { id: params.id },
        data: updateData,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    if (!result) {
      return NextResponse.json(
        createErrorResponse('Product return not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const auditActionMap: Record<string, AuditAction> = {
      'APPROVE': 'PRODUCT_RETURN_APPROVE',
      'PROCESS': 'PRODUCT_RETURN_PROCESS',
      'COMPLETE': 'PRODUCT_RETURN_COMPLETE',
      'REJECT': 'PRODUCT_RETURN_REJECT',
    };

    await createAuditLog({
      userId: user.userId,
      action: auditActionMap[action],
      entityType: 'ProductReturn',
      entityId: result.id,
      description: `Product return ${action.toLowerCase()}: ${result.returnNumber}`,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: { returnNumber: result.returnNumber, action },
    });

    return NextResponse.json(createSuccessResponse(result), { status: 200 });
  } catch (error) {
    console.error('Update return error:', error);

    const errorMessage = String((error as Error)?.message || '');
    if (errorMessage.includes('Only')) {
      return NextResponse.json(
        createErrorResponse(errorMessage, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

// DELETE /api/stock/returns/[id] - Delete a return (only if pending)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, 'stock.delete');

    const productReturn = await prisma.productReturn.findUnique({
      where: { id: params.id },
    });

    if (!productReturn) {
      return NextResponse.json(
        createErrorResponse('Product return not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    if (productReturn.status !== 'PENDING') {
      return NextResponse.json(
        createErrorResponse('Only pending returns can be deleted', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await prisma.productReturn.delete({
      where: { id: params.id },
    });

    await createAuditLog({
      userId: user.userId,
      action: 'PRODUCT_RETURN_DELETE',
      entityType: 'ProductReturn',
      entityId: params.id,
      description: `Product return deleted: ${productReturn.returnNumber}`,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: { returnNumber: productReturn.returnNumber },
    });

    return NextResponse.json(
      createSuccessResponse(null, 'Product return deleted successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete return error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
