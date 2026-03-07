import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

// GET /api/stock/movements - List all stock movements with filters
export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, 'stock.view');

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const locationId = searchParams.get('locationId');
    const warehouseId = searchParams.get('warehouseId');
    const movementType = searchParams.get('movementType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: {
      productId?: string;
      locationId?: string;
      warehouseId?: string;
      movementType?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (movementType) where.movementType = movementType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unit: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true,
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
      take: limit,
    });

    // Calculate summary statistics
    const summary = {
      totalMovements: movements.length,
      inboundMovements: movements.filter((m) => m.quantity > 0).length,
      outboundMovements: movements.filter((m) => m.quantity < 0).length,
      totalQuantityIn: movements
        .filter((m) => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0),
      totalQuantityOut: Math.abs(
        movements.filter((m) => m.quantity < 0).reduce((sum, m) => sum + m.quantity, 0)
      ),
    };

    return NextResponse.json(
      createSuccessResponse({ movements, summary }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get movements error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
