import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

const createMarketingVisitSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  siteName: z.string().min(1, 'Site name is required').max(200),
  locationDescription: z.string().min(1, 'Location is required').max(500),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  knowsElegant: z.boolean(),
  clientFeedback: z.string().max(2000).optional(),
  routeName: z.string().min(1, 'Route name is required').max(200),
});

async function savePhoto(file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
  }

  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 8MB limit');
  }

  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'marketing-visits');
  await mkdir(uploadsDir, { recursive: true });

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `visit-${timestamp}-${random}.${extension}`;

  const filepath = join(uploadsDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return `/uploads/marketing-visits/${filename}`;
}

/**
 * GET /api/marketing-visit-forms
 * Marketing/sales: own forms only
 * Admin/owner: all forms
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'marketing_form.view');

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const search = (searchParams.get('search') || '').trim();

    const isPrivileged =
      user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'FINANCE_MANAGER';
    const skip = (page - 1) * limit;

    const where = {
      ...(isPrivileged ? {} : { createdBy: user.userId }),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: 'insensitive' as const } },
              { siteName: { contains: search, mode: 'insensitive' as const } },
              { routeName: { contains: search, mode: 'insensitive' as const } },
              { locationDescription: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [forms, total] = await Promise.all([
      prisma.marketingVisitForm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.marketingVisitForm.count({ where }),
    ]);

    return NextResponse.json(
      createSuccessResponse({
        forms,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
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

    console.error('Get marketing forms error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing-visit-forms
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'marketing_form.create');

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    const rawLatitude = formData.get('latitude');
    const rawLongitude = formData.get('longitude');

    const parsed = createMarketingVisitSchema.safeParse({
      customerName: (formData.get('customerName') as string) || '',
      customerPhone: ((formData.get('customerPhone') as string) || '').trim() || undefined,
      customerEmail: ((formData.get('customerEmail') as string) || '').trim(),
      siteName: (formData.get('siteName') as string) || '',
      locationDescription: (formData.get('locationDescription') as string) || '',
      latitude:
        typeof rawLatitude === 'string' && rawLatitude.trim() !== '' ? Number(rawLatitude) : undefined,
      longitude:
        typeof rawLongitude === 'string' && rawLongitude.trim() !== ''
          ? Number(rawLongitude)
          : undefined,
      knowsElegant: String(formData.get('knowsElegant') || 'false') === 'true',
      clientFeedback: ((formData.get('clientFeedback') as string) || '').trim() || undefined,
      routeName: (formData.get('routeName') as string) || '',
    });

    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Validation error', 'VALIDATION_ERROR', parsed.error.flatten()),
        { status: 400 }
      );
    }

    if (
      parsed.data.latitude !== undefined &&
      (Number.isNaN(parsed.data.latitude) || parsed.data.latitude < -90 || parsed.data.latitude > 90)
    ) {
      return NextResponse.json(
        createErrorResponse('Latitude must be between -90 and 90', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (
      parsed.data.longitude !== undefined &&
      (Number.isNaN(parsed.data.longitude) || parsed.data.longitude < -180 || parsed.data.longitude > 180)
    ) {
      return NextResponse.json(
        createErrorResponse('Longitude must be between -180 and 180', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    let photoUrl: string | undefined;
    if (file && file.size > 0) {
      photoUrl = await savePhoto(file);
    }

    const marketingForm = await prisma.marketingVisitForm.create({
      data: {
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone || null,
        customerEmail: parsed.data.customerEmail || null,
        siteName: parsed.data.siteName,
        locationDescription: parsed.data.locationDescription,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        photoUrl: photoUrl || null,
        knowsElegant: parsed.data.knowsElegant,
        clientFeedback: parsed.data.clientFeedback || null,
        routeName: parsed.data.routeName,
        createdBy: user.userId,
      },
    });

    await createAuditLog({
      userId: user.userId,
      action: 'CREATE_MARKETING_VISIT_FORM',
      entityType: 'MarketingVisitForm',
      entityId: marketingForm.id,
      description: `Created marketing visit form for ${marketingForm.customerName}`,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
      metadata: {
        siteName: marketingForm.siteName,
        routeName: marketingForm.routeName,
      },
    });

    return NextResponse.json(
      createSuccessResponse(marketingForm, 'Marketing visit form submitted successfully'),
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

      if (error.message.includes('Invalid file type') || error.message.includes('File size exceeds')) {
        return NextResponse.json(createErrorResponse(error.message, 'VALIDATION_ERROR'), { status: 400 });
      }
    }

    console.error('Create marketing form error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
