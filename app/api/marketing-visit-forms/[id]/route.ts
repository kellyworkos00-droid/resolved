import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { createAuditLog, getClientIp, getUserAgent } from '@/lib/audit';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

const updateMarketingVisitSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  siteName: z.string().min(1).max(200).optional(),
  locationDescription: z.string().min(1).max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  knowsElegant: z.boolean().optional(),
  clientFeedback: z.string().max(2000).optional(),
  routeName: z.string().min(1).max(200).optional(),
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
 * PATCH /api/marketing-visit-forms/:id
 * Marketing/sales can edit only once and only their own forms.
 * Admin/owner can edit any form.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requirePermission(request, 'marketing_form.edit');

    const existing = await prisma.marketingVisitForm.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(createErrorResponse('Form not found', 'NOT_FOUND'), { status: 404 });
    }

    const isPrivileged =
      user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'FINANCE_MANAGER';

    if (!isPrivileged && existing.createdBy !== user.userId) {
      return NextResponse.json(
        createErrorResponse('You can only edit your own forms', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    if (!isPrivileged && existing.editCount >= 1) {
      return NextResponse.json(
        createErrorResponse('This form has already been edited once', 'EDIT_LIMIT_REACHED'),
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    const rawLatitude = formData.get('latitude');
    const rawLongitude = formData.get('longitude');

    const parsed = updateMarketingVisitSchema.safeParse({
      customerName: (formData.get('customerName') as string) || undefined,
      customerPhone: (formData.get('customerPhone') as string) || undefined,
      customerEmail: (formData.get('customerEmail') as string) || undefined,
      siteName: (formData.get('siteName') as string) || undefined,
      locationDescription: (formData.get('locationDescription') as string) || undefined,
      latitude:
        typeof rawLatitude === 'string' && rawLatitude.trim() !== '' ? Number(rawLatitude) : undefined,
      longitude:
        typeof rawLongitude === 'string' && rawLongitude.trim() !== ''
          ? Number(rawLongitude)
          : undefined,
      knowsElegant:
        formData.get('knowsElegant') !== null
          ? String(formData.get('knowsElegant')) === 'true'
          : undefined,
      clientFeedback: (formData.get('clientFeedback') as string) || undefined,
      routeName: (formData.get('routeName') as string) || undefined,
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

    const updated = await prisma.marketingVisitForm.update({
      where: { id: params.id },
      data: {
        customerName: parsed.data.customerName ?? undefined,
        customerPhone: parsed.data.customerPhone ?? undefined,
        customerEmail: parsed.data.customerEmail ?? undefined,
        siteName: parsed.data.siteName ?? undefined,
        locationDescription: parsed.data.locationDescription ?? undefined,
        latitude: parsed.data.latitude ?? undefined,
        longitude: parsed.data.longitude ?? undefined,
        knowsElegant: parsed.data.knowsElegant ?? undefined,
        clientFeedback: parsed.data.clientFeedback ?? undefined,
        routeName: parsed.data.routeName ?? undefined,
        photoUrl: photoUrl ?? undefined,
        editCount: {
          increment: isPrivileged ? 0 : 1,
        },
      },
    });

    await createAuditLog({
      userId: user.userId,
      action: 'UPDATE_MARKETING_VISIT_FORM',
      entityType: 'MarketingVisitForm',
      entityId: updated.id,
      description: `Updated marketing visit form for ${updated.customerName}`,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json(createSuccessResponse(updated, 'Form updated successfully'));
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

    console.error('Update marketing form error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
