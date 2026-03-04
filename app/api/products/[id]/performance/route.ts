import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { authMiddleware } from '@/lib/auth';

/**
 * GET /api/products/[id]/performance
 * Get product performance analytics including sales, revenue, top buyers, and ranking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401),
        { status: 401 }
      );
    }

    const productId = params.id;

    // Get product to verify it exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        createErrorResponse('Product not found', 'NOT_FOUND', 404),
        { status: 404 }
      );
    }

    // Get total sales statistics for this product from POS orders
    const orderItems = await prisma.posOrderItem.findMany({
      where: {
        productId: productId,
        posOrder: {
          status: 'COMPLETED',
        },
      },
      include: {
        posOrder: {
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate basic metrics
    const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalOrders = new Set(orderItems.map((item) => item.posOrderId)).size;
    const avgQuantityPerOrder = totalOrders > 0 ? totalSold / totalOrders : 0;

    // Calculate top buyers
    const buyerMap = new Map<
      string,
      { customerName: string; totalQuantity: number; totalSpent: number }
    >();

    orderItems.forEach((item) => {
      const customerName = item.posOrder.customer?.name || 'Walk-in Customer';
      const existing = buyerMap.get(customerName) || {
        customerName,
        totalQuantity: 0,
        totalSpent: 0,
      };
      existing.totalQuantity += item.quantity;
      existing.totalSpent += item.totalPrice;
      buyerMap.set(customerName, existing);
    });

    const topBuyers = Array.from(buyerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Calculate sales trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrderItems = orderItems.filter(
      (item) => new Date(item.createdAt) >= thirtyDaysAgo
    );

    // Group by date
    const salesByDate = new Map<string, { quantity: number; revenue: number }>();
    recentOrderItems.forEach((item) => {
      const dateKey = new Date(item.createdAt).toISOString().split('T')[0];
      const existing = salesByDate.get(dateKey) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.totalPrice;
      salesByDate.set(dateKey, existing);
    });

    const salesTrend = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days with sales

    // Get product ranking based on total revenue
    const allProducts = await prisma.product.findMany({
      select: { id: true },
    });

    const productRevenueMap = new Map<string, number>();

    // Get revenue for all products
    for (const p of allProducts) {
      const items = await prisma.posOrderItem.findMany({
        where: {
          productId: p.id,
          posOrder: {
            status: 'COMPLETED',
          },
        },
        select: {
          totalPrice: true,
        },
      });

      const revenue = items.reduce((sum, item) => sum + item.totalPrice, 0);
      productRevenueMap.set(p.id, revenue);
    }

    // Sort products by revenue to get ranking
    const sortedProducts = Array.from(productRevenueMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const rank = sortedProducts.findIndex(([id]) => id === productId) + 1;

    const performanceData = {
      totalSold,
      totalRevenue,
      totalOrders,
      avgQuantityPerOrder: Number(avgQuantityPerOrder.toFixed(2)),
      topBuyers,
      salesTrend,
      rank,
      totalProducts: allProducts.length,
    };

    return NextResponse.json(createSuccessResponse(performanceData), {
      status: 200,
    });
  } catch (error) {
    console.error('Get product performance error:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get product performance',
        'INTERNAL_ERROR',
        500
      ),
      { status: 500 }
    );
  }
}
