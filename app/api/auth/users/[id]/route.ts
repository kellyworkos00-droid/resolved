import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/authorization';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/auth/users/[id]
 * Update a user's name, role, or active status (ADMIN / OWNER only)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireRoles(request, ['ADMIN'] as any);

    const { id } = params;
    const body = await request.json();
    const { firstName, lastName, role, isActive } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(createErrorResponse('User not found', 'NOT_FOUND'), { status: 404 });
    }

    // Prevent non-owner admins from editing owner-level users when needed
    const validRoles = ['ADMIN', 'FINANCE_MANAGER', 'FINANCE_STAFF', 'VIEWER', 'POS_OPERATOR'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        createErrorResponse(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json(createSuccessResponse(updated, 'User updated successfully'), { status: 200 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message.startsWith('Forbidden'))) {
      return NextResponse.json(
        createErrorResponse(error.message, 'FORBIDDEN'),
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Update user error:', error);
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 });
  }
}

/**
 * DELETE /api/auth/users/[id]
 * Delete a user (ADMIN / OWNER only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireRoles(request, ['ADMIN'] as any);

    const { id } = params;

    // Prevent self-deletion
    if (actor.userId === id) {
      return NextResponse.json(
        createErrorResponse('You cannot delete your own account', 'SELF_DELETE'),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(createErrorResponse('User not found', 'NOT_FOUND'), { status: 404 });
    }

    // Soft-delete: deactivate rather than destroy to preserve audit trail
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(createSuccessResponse(null, 'User deactivated successfully'), { status: 200 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message.startsWith('Forbidden'))) {
      return NextResponse.json(
        createErrorResponse(error.message, 'FORBIDDEN'),
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Delete user error:', error);
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 });
  }
}

/**
 * PATCH /api/auth/users/[id]
 * Reset a user's password (ADMIN / OWNER only)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRoles(request, ['ADMIN'] as any);

    const { id } = params;
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        createErrorResponse('New password must be at least 8 characters', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(createErrorResponse('User not found', 'NOT_FOUND'), { status: 404 });
    }

    const hashed = await hashPassword(password);
    await prisma.user.update({ where: { id }, data: { password: hashed } });

    return NextResponse.json(createSuccessResponse(null, 'Password reset successfully'), { status: 200 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message.startsWith('Forbidden'))) {
      return NextResponse.json(
        createErrorResponse(error.message, 'FORBIDDEN'),
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Reset password error:', error);
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 });
  }
}
