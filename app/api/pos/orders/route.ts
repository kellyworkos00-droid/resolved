import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit';
import Decimal from 'decimal.js';

const MAX_PRICE_DEVIATION_PERCENT = 30;
const MAX_DISCOUNT_PERCENT = 15;

/**
 * GET /api/pos/orders
 * Get all POS orders with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        createErrorResponse('Invalid token', 'INVALID_TOKEN'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.posOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          orderItems: {
            include: { product: true },
          },
          createdByUser: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.posOrder.count({ where }),
    ]);

    return NextResponse.json(
      createSuccessResponse(
        {
          items: orders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        'Orders retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Failed to get orders:', error);
    return NextResponse.json(
      createErrorResponse('Failed to get orders', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/pos/orders
 * Create a new POS order
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        createErrorResponse('Invalid token', 'INVALID_TOKEN'),
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      customerId?: string | null;
      items?: Array<{
        productId: string;
        quantity: number;
        discount?: number;
        unitPrice?: number;
      }>;
      tax?: number;
      discount?: number;
    };
    const { customerId, items, tax = 0, discount = 0 } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        createErrorResponse('Invalid items', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (discount > MAX_DISCOUNT_PERCENT) {
      return NextResponse.json(
        createErrorResponse('Discount exceeds guardrail', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate all products exist
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        createErrorResponse('Some products not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Calculate totals and validate stock
    let subtotal = new Decimal(0);
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          createErrorResponse('Product not found', 'NOT_FOUND'),
          { status: 404 }
        );
      }
      if (item.quantity > product.quantity) {
        return NextResponse.json(
          createErrorResponse('Insufficient stock', 'INSUFFICIENT_STOCK'),
          { status: 400 }
        );
      }

      const unitPrice =
        typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)
          ? item.unitPrice
          : product.price;

      const isOverride = unitPrice !== product.price;
      if (product.price > 0) {
        const deviationPercent = (Math.abs(unitPrice - product.price) / product.price) * 100;
        if (deviationPercent > MAX_PRICE_DEVIATION_PERCENT) {
          return NextResponse.json(
            createErrorResponse('Price override exceeds guardrail', 'VALIDATION_ERROR'),
            { status: 400 }
          );
        }
      }

      if (unitPrice < 0) {
        return NextResponse.json(
          createErrorResponse('Invalid unit price', 'VALIDATION_ERROR'),
          { status: 400 }
        );
      }

      const itemTotal = new Decimal(unitPrice).mul(item.quantity);
      subtotal = subtotal.plus(itemTotal);
    }

    const taxAmount = subtotal.mul(new Decimal(tax)).div(100);
    const discountAmount = subtotal.mul(new Decimal(discount)).div(100);
    const totalAmount = subtotal.plus(taxAmount).minus(discountAmount);

    // Create order with items
    const order = await prisma.posOrder.create({
      data: {
        customerId: customerId || null,
        subtotal: subtotal.toNumber(),
        tax: taxAmount.toNumber(),
        discount: discountAmount.toNumber(),
        totalAmount: totalAmount.toNumber(),
        status: 'DRAFT',
        createdBy: payload.userId,
        orderItems: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
              throw new Error('Product not found');
            }
            const unitPrice =
              typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)
                ? item.unitPrice
                : product.price;
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice,
              totalPrice: unitPrice * item.quantity,
              discount: item.discount || 0,
            };
          }),
        },
      },
      include: {
        customer: true,
        orderItems: {
          include: { product: true },
        },
        createdByUser: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: payload.userId,
      action: 'CREATE_POS_ORDER',
      entityType: 'PosOrder',
      entityId: order.id,
      description: `Created POS order with ${items.length} item(s) - Total: ${totalAmount.toNumber()} KES`,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: {
        itemCount: items.length,
        subtotal: subtotal.toNumber(),
        totalAmount: totalAmount.toNumber(),
        customerId: customerId || null,
      },
    });

    return NextResponse.json(
      createSuccessResponse(order, 'Order created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      createErrorResponse(errorMessage, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
