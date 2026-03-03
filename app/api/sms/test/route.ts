import { NextRequest, NextResponse } from 'next/server';
import { verifySmsConfiguration, sendSms } from '@/lib/sms-service';

/**
 * GET /api/sms/test
 * Test and verify SMS configuration
 */
export async function GET() {
  const config = verifySmsConfiguration();
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    smsConfiguration: {
      provider: config.provider,
      configured: config.configured,
      errors: config.errors.length > 0 ? config.errors : null,
    },
    environment: {
      SMS_PROVIDER: process.env.SMS_PROVIDER || 'not set',
      AFRICAS_TALKING_USERNAME: process.env.AFRICAS_TALKING_USERNAME ? '***' : 'not set',
      AFRICAS_TALKING_API_KEY: process.env.AFRICAS_TALKING_API_KEY ? '***' : 'not set',
      AFRICAS_TALKING_SENDER_ID: process.env.AFRICAS_TALKING_SENDER_ID || 'not set',
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '***' : 'not set',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '***' : 'not set',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'not set',
    },
    status: config.configured ? 'OK' : 'NOT_CONFIGURED',
    message: config.configured 
      ? `SMS module is ready. Using ${config.provider} provider.`
      : `SMS module is not properly configured. Issues: ${config.errors.join(', ')}`,
  });
}

/**
 * POST /api/sms/test
 * Send a test SMS (requires phone number in request body)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verify configuration first
    const config = verifySmsConfiguration();
    if (!config.configured) {
      return NextResponse.json(
        {
          error: 'SMS module not configured',
          details: config.errors,
          status: 'NOT_CONFIGURED',
        },
        { status: 500 }
      );
    }

    // Attempt to send SMS
    const result = await sendSms({
      to: phoneNumber,
      message,
      type: 'transactional',
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testSms: {
        phoneNumber,
        provider: result.provider,
        success: result.success,
        messageId: result.messageId || null,
        cost: result.cost || null,
        error: result.error || null,
      },
      status: result.success ? 'SUCCESS' : 'FAILED',
      message: result.success
        ? 'Test SMS sent successfully'
        : `Failed to send test SMS: ${result.error}`,
    });
  } catch (error) {
    console.error('SMS test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process test request',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'ERROR',
      },
      { status: 500 }
    );
  }
}
