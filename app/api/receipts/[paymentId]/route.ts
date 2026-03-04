/**
 * API Route: /api/receipts/[paymentId]
 * Get receipt data or download receipt PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import {
  getReceiptData,
  generateReceiptPDFBuffer,
  generateReceiptHTML,
  getReceiptFilename,
} from '@/lib/receipt-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/receipts/[paymentId]
 * Get receipt data or download as PDF/HTML
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    // Require authentication
    await requireAuth(request);

    const { paymentId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, pdf, html

    // Get receipt data
    const receiptData = await getReceiptData(paymentId);

    if (!receiptData) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Return based on requested format
    if (format === 'pdf') {
      // Generate and download PDF
      const pdfBuffer = await generateReceiptPDFBuffer(paymentId, {
        includeWatermark: receiptData.status !== 'COMPLETED',
      });

      const filename = getReceiptFilename(receiptData);

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } else if (format === 'html') {
      // Generate HTML for print/preview
      const html = generateReceiptHTML(receiptData);

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } else {
      // Return JSON data
      return NextResponse.json({
        success: true,
        receipt: receiptData,
        downloadLinks: {
          pdf: `/api/receipts/${paymentId}?format=pdf`,
          html: `/api/receipts/${paymentId}?format=html`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate receipt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
