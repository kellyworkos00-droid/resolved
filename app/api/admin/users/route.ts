import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRoles } from '@/lib/authorization';
import { hashPassword, toPublicUser } from '@/lib/auth';
import { createUserSchema } from '@/lib/validations';
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

/**
 * GET /api/admin/users
 * Admin/owner list users
 */
export async function GET(request: NextRequest) {
  try {
    await requireRoles(request, ['ADMIN', 'OWNER', 'FINANCE_MANAGER']);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json(createSuccessResponse({ users }));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
      }

      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          createErrorResponse('Insufficient permissions', 'FORBIDDEN'),
          { status: 403 }
        );
      }
    }

    console.error('List users error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Admin/owner create accounts and assign roles.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireRoles(request, ['ADMIN', 'OWNER', 'FINANCE_MANAGER']);
    const body = await request.json();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Validation error', 'VALIDATION_ERROR', parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        createErrorResponse('Email is already registered', 'DUPLICATE_EMAIL'),
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        isActive: true,
      },
    });

    await createAuditLog({
      userId: actor.userId,
      action: 'CREATE_USER_ACCOUNT',
      entityType: 'User',
      entityId: user.id,
      description: `Created user account ${user.email} with role ${user.role}`,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: {
        role,
      },
    });

    return NextResponse.json(
      createSuccessResponse(toPublicUser(user), 'User account created successfully'),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
      }

      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          createErrorResponse('Insufficient permissions', 'FORBIDDEN'),
          { status: 403 }
        );
      }
    }

    console.error('Create user error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
