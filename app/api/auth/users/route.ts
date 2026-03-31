import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireRoles } from '@/lib/authorization';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/users
 * List all users (ADMIN / OWNER only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRoles(request, ['ADMIN'] as any);

    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(createSuccessResponse(users), { status: 200 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message.startsWith('Forbidden'))) {
      return NextResponse.json(
        createErrorResponse(error.message, 'FORBIDDEN'),
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('List users error:', error);
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 });
  }
}

/**
 * POST /api/auth/users
 * Create a new user (ADMIN / OWNER only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireRoles(request, ['ADMIN'] as any);

    const body = await request.json();
    const { email, firstName, lastName, role, password, isActive } = body;

    if (!email || !firstName || !lastName || !role || !password) {
      return NextResponse.json(
        createErrorResponse('email, firstName, lastName, role and password are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const validRoles = ['ADMIN', 'FINANCE_MANAGER', 'FINANCE_STAFF', 'VIEWER', 'POS_OPERATOR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        createErrorResponse(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        createErrorResponse('Password must be at least 8 characters', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        createErrorResponse('A user with this email already exists', 'DUPLICATE_EMAIL'),
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        password: hashed,
        isActive: isActive !== false,
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

    return NextResponse.json(createSuccessResponse(user, 'User created successfully'), { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message.startsWith('Forbidden'))) {
      return NextResponse.json(
        createErrorResponse(error.message, 'FORBIDDEN'),
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Create user error:', error);
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 });
  }
}
