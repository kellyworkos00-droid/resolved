import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { sendBulkSms } from '@/lib/sms-service';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

/**
 * POST /api/sms/send-bulk
 * Send bulk SMS to multiple recipients
 */
export async function POST(request: NextRequest) {
  try {
    await requirePermission(request, 'invoice.manage');

    const body = await request.json();
    const { message, phoneNumbers } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        createErrorResponse('Message is required and must be a non-empty string', 'INVALID_MESSAGE'),
        { status: 400 }
      );
    }

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        createErrorResponse('Phone numbers array is required and must not be empty', 'INVALID_PHONES'),
        { status: 400 }
      );
    }

    // Prepare recipients
    const recipients = phoneNumbers
      .filter((phone) => phone && typeof phone === 'string' && phone.trim())
      .map((phone) => ({
        phone: phone.trim(),
        message: message.trim(),
      }));

    if (recipients.length === 0) {
      return NextResponse.json(
        createErrorResponse('No valid phone numbers provided', 'NO_VALID_PHONES'),
        { status: 400 }
      );
    }

    // Send bulk SMS
    const results = await sendBulkSms(recipients);

    // Count successes and failures
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json(
      createSuccessResponse({
        message: `Bulk SMS sent. ${successful} successful, ${failed} failed.`,
        sent: successful,
        failed,
        total: results.length,
        results,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk SMS error:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to send bulk SMS',
        'BULK_SMS_ERROR'
      ),
      { status: 500 }
    );
  }
}
