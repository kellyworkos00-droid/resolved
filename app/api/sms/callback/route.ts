import { NextRequest, NextResponse } from 'next/server';

/**
 * SMS Callback/Webhook Endpoint
 * Receives delivery reports (DLR) from SMS providers
 * 
 * For TextSMS.co.ke, configure this URL in your account dashboard:
 * Production: https://your-domain.com/api/sms/callback
 * Development: http://localhost:3001/api/sms/callback
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[SMS Callback] Received delivery report:', body);

    // TextSMS callback format (adjust based on actual provider documentation)
    const {
      messageId,
      message_id,
      status,
      mobile,
      phone,
      network,
      cost,
      deliveryStatus,
      delivery_status,
    } = body;

    const id = messageId || message_id;
    const phoneNumber = mobile || phone;
    const dlrStatus = status || deliveryStatus || delivery_status;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing message ID in callback' },
        { status: 400 }
      );
    }

    // Log the delivery report
    console.log('[SMS Callback] Processing:', {
      messageId: id,
      phone: phoneNumber,
      status: dlrStatus,
      network,
      cost,
    });

    // TODO: Update message status in database if you have a messages table
    // Example:
    // await prisma.message.update({
    //   where: { messageId: id },
    //   data: {
    //     status: dlrStatus,
    //     deliveredAt: dlrStatus === 'delivered' ? new Date() : undefined,
    //     failedAt: ['failed', 'undelivered'].includes(dlrStatus) ? new Date() : undefined,
    //     cost: cost ? parseFloat(cost) : undefined,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Delivery report received',
      messageId: id,
    });
  } catch (error) {
    console.error('[SMS Callback] Error processing delivery report:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing the callback URL
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'SMS Callback/Webhook',
    status: 'active',
    methods: ['POST'],
    description: 'Receives delivery reports from SMS providers',
    provider: process.env.SMS_PROVIDER || 'none',
    timestamp: new Date().toISOString(),
  });
}
