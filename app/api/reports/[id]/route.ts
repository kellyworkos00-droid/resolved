import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/reports/[id]
 * Fetch a specific custom report template
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;

    if (!id || typeof id !== 'string') {
      return errorResponse('Invalid report ID', 400);
    }

    const report = await prisma.reportTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        reportType: true,
        columns: true,
        filters: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!report) {
      return errorResponse('Report not found', 404);
    }

    // Check if user owns this report or has admin access
    if (report.createdById !== user.userId && user.role !== 'ADMIN') {
      return errorResponse('Access denied', 403);
    }

    return successResponse(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return errorResponse('Failed to fetch report', 500);
  }
}

/**
 * PUT /api/reports/[id]
 * Update a custom report template
 *
 * Body:
 * - name: string
 * - description: string
 * - columns: string[]
 * - filters: object
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;

    if (!id || typeof id !== 'string') {
      return errorResponse('Invalid report ID', 400);
    }

    // Verify ownership
    const existing = await prisma.reportTemplate.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existing) {
      return errorResponse('Report not found', 404);
    }

    if (existing.createdById !== user.userId && user.role !== 'ADMIN') {
      return errorResponse('Access denied', 403);
    }

    const body = await request.json();
    const { name, description, columns, filters } = body;

    // Validation
    type JsonInputValue =
      | string
      | number
      | boolean
      | { [key: string]: JsonInputValue | null }
      | Array<JsonInputValue | null>;

    const updateData: {
      name?: string;
      description?: string | null;
      columns?: string[];
      filters?: JsonInputValue;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return errorResponse('Name must be a non-empty string', 400);
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (columns !== undefined) {
      if (!Array.isArray(columns) || columns.length === 0) {
        return errorResponse('Columns must be a non-empty array', 400);
      }

      const allowedColumns = [
        'date',
        'amount',
        'customer',
        'status',
        'reference',
        'description',
        'daysOutstanding',
        'invoiceCount',
        'totalAmount',
      ];

      for (const col of columns) {
        if (typeof col !== 'string' || !allowedColumns.includes(col)) {
          return errorResponse(`Invalid column: ${col}`, 400);
        }
      }

      updateData.columns = columns;
    }

    if (filters !== undefined) {
      updateData.filters = filters || {};
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    const report = await prisma.reportTemplate.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        reportType: true,
        columns: true,
        filters: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return errorResponse('Failed to update report', 500);
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a custom report template
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;

    if (!id || typeof id !== 'string') {
      return errorResponse('Invalid report ID', 400);
    }

    // Verify ownership
    const existing = await prisma.reportTemplate.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existing) {
      return errorResponse('Report not found', 404);
    }

    if (existing.createdById !== user.userId && user.role !== 'ADMIN') {
      return errorResponse('Access denied', 403);
    }

    await prisma.reportTemplate.delete({
      where: { id },
    });

    return successResponse({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    return errorResponse('Failed to delete report', 500);
  }
}
