import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/whatsapp-commerce/settings
 * Get WhatsApp Commerce integration settings
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }

    // Try to get existing settings
    const settings = await prisma.whatsAppCommerceSettings.findFirst({
      where: { organizationId: payload.organizationId || 'default' },
    });

    return NextResponse.json(
      createSuccessResponse(settings, 'Settings retrieved successfully')
    );
  } catch (error) {
    console.error('Failed to get WhatsApp commerce settings:', error);
    return NextResponse.json(
      createErrorResponse('Failed to get settings', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp-commerce/settings
 * Create or update WhatsApp Commerce integration settings
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json(
        createErrorResponse('Invalid token', 'INVALID_TOKEN'),
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const {
      whatsappNumber,
      whatsappApiKey,
      whatsappWebhookUrl,
      storeType,
      storeUrl,
      storeApiKey,
      storeApiSecret,
      autoSyncEnabled,
      syncInterval,
      autoNotificationsEnabled,
      catalogEnabled,
    } = body;

    // Check if settings already exist
    const existingSettings = await prisma.whatsAppCommerceSettings.findFirst({
      where: { organizationId: payload.organizationId },
    });

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.whatsAppCommerceSettings.update({
        where: { id: existingSettings.id },
        data: {
          whatsappNumber,
          whatsappApiKey,
          whatsappWebhookUrl,
          storeType,
          storeUrl,
          storeApiKey,
          storeApiSecret,
          autoSyncEnabled,
          syncInterval,
          autoNotificationsEnabled,
          catalogEnabled,
          isConnected: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new settings
      settings = await prisma.whatsAppCommerceSettings.create({
        data: {
          organizationId: payload.organizationId,
          whatsappNumber,
          whatsappApiKey,
          whatsappWebhookUrl,
          storeType,
          storeUrl,
          storeApiKey,
          storeApiSecret,
          autoSyncEnabled,
          syncInterval,
          autoNotificationsEnabled,
          catalogEnabled,
          isConnected: true,
        },
      });
    }

    return NextResponse.json(
      createSuccessResponse(settings, 'Settings saved successfully')
    );
  } catch (error) {
    console.error('Failed to save WhatsApp commerce settings:', error);
    return NextResponse.json(
      createErrorResponse('Failed to save settings', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
