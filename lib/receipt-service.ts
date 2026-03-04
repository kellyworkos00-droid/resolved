/**
 * Receipt Generation Service
 * Handles receipt generation for payments with PDF and print capabilities
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { format as formatDate } from 'date-fns';

type AutoTableOptions = {
  head?: string[][];
  body?: string[][];
  startY?: number;
  theme?: string;
  headStyles?: object;
  bodyStyles?: object;
  columnStyles?: object;
  margin?: { top: number };
  styles?: object;
};

function getAutoTable(doc: jsPDF): (options: AutoTableOptions) => void {
  return (doc as unknown as { autoTable: (options: AutoTableOptions) => void }).autoTable;
}

export interface ReceiptData {
  id: string;
  paymentNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  reference: string;
  status: string;
  notes?: string | null;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  invoice?: {
    invoiceNumber: string;
    totalAmount: number;
    balanceAmount: number;
  } | null;
  createdAt: Date;
}

export interface ReceiptOptions {
  includeCompanyLogo?: boolean;
  includeWatermark?: boolean;
  format?: 'A4' | 'Letter' | 'Receipt';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Get receipt data by payment ID
 */
export async function getReceiptData(paymentId: string): Promise<ReceiptData | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            balanceAmount: true,
          },
        },
      },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      status: payment.status,
      notes: payment.notes,
      customer: payment.customer,
      invoice: payment.invoice,
      createdAt: payment.createdAt,
    };
  } catch (error) {
    console.error('Error fetching receipt data:', error);
    throw new Error('Failed to fetch receipt data');
  }
}

/**
 * Get receipt data by payment number
 */
export async function getReceiptDataByNumber(paymentNumber: string): Promise<ReceiptData | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { paymentNumber },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            totalAmount: true,
            balanceAmount: true,
          },
        },
      },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      status: payment.status,
      notes: payment.notes,
      customer: payment.customer,
      invoice: payment.invoice,
      createdAt: payment.createdAt,
    };
  } catch (error) {
    console.error('Error fetching receipt data by number:', error);
    throw new Error('Failed to fetch receipt data');
  }
}

/**
 * Generate receipt PDF
 */
export function generateReceiptPDF(
  receiptData: ReceiptData,
  options: ReceiptOptions = {}
): jsPDF {
  const {
    format = 'A4',
    orientation = 'portrait',
    includeWatermark = false,
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Header - Company Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ELEGANT STEEL', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Trusted Business Partner', pageWidth / 2, 32, { align: 'center' });

  // Receipt Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 204);
  doc.text('PAYMENT RECEIPT', pageWidth / 2, 45, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Watermark if needed
  if (includeWatermark && receiptData.status !== 'COMPLETED') {
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    doc.text(receiptData.status.toUpperCase(), pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    doc.setTextColor(0, 0, 0);
  }

  let yPos = 60;

  // Receipt Information Box
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Left column
  doc.text('Receipt No:', margin + 5, yPos + 8);
  doc.text('Payment Date:', margin + 5, yPos + 16);
  doc.text('Payment Method:', margin + 5, yPos + 24);
  doc.text('Reference:', margin + 5, yPos + 32);

  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.paymentNumber, margin + 50, yPos + 8);
  doc.text(formatDate(new Date(receiptData.paymentDate), 'PPP'), margin + 50, yPos + 16);
  doc.text(receiptData.paymentMethod.replace(/_/g, ' '), margin + 50, yPos + 24);
  doc.text(receiptData.reference, margin + 50, yPos + 32);

  // Right column - Amount (highlighted)
  const amountX = pageWidth - margin - 60;
  doc.setFillColor(0, 102, 204);
  doc.rect(amountX - 5, yPos + 3, 60, 15, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('AMOUNT PAID', amountX + 30, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.text(formatCurrency(receiptData.amount), amountX + 30, yPos + 16, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  yPos += 45;

  // Customer Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CUSTOMER INFORMATION', margin, yPos);
  
  yPos += 8;
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', margin + 5, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.customer.name, margin + 25, yPos + 7);

  if (receiptData.customer.email) {
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', margin + 5, yPos + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.customer.email, margin + 25, yPos + 14);
  }

  if (receiptData.customer.phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', margin + 5, yPos + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.customer.phone, margin + 25, yPos + 21);
  }

  yPos += 35;

  // Invoice Information (if applicable)
  if (receiptData.invoice) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INVOICE INFORMATION', margin, yPos);
    
    yPos += 8;
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No:', margin + 5, yPos + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.invoice.invoiceNumber, margin + 35, yPos + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Total:', margin + 5, yPos + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(receiptData.invoice.totalAmount), margin + 35, yPos + 14);

    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', pageWidth / 2 + 10, yPos + 14);
    doc.setFont('helvetica', 'normal');
    if (receiptData.invoice.balanceAmount > 0) {
      doc.setTextColor(204, 0, 0);
    } else {
      doc.setTextColor(0, 153, 0);
    }
    doc.text(formatCurrency(receiptData.invoice.balanceAmount), pageWidth / 2 + 40, yPos + 14);
    doc.setTextColor(0, 0, 0);

    yPos += 30;
  }

  // Payment Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PAYMENT SUMMARY', margin, yPos);
  yPos += 5;

  const autoTable = getAutoTable(doc);
  autoTable({
    startY: yPos,
    head: [['Description', 'Amount']],
    body: [
      ['Payment Amount', formatCurrency(receiptData.amount)],
      ['Payment Method', receiptData.paymentMethod.replace(/_/g, ' ')],
      ['Transaction Reference', receiptData.reference],
      ['Status', receiptData.status],
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
    margin: { top: yPos },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Notes (if any)
  if (receiptData.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(receiptData.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPos + 5);
    yPos += 5 + splitNotes.length * 5;
  }

  // Footer
  const footerY = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 6, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text(
    `Generated on ${formatDate(new Date(), 'PPP')} at ${formatDate(new Date(), 'p')}`,
    pageWidth / 2,
    footerY + 12,
    { align: 'center' }
  );

  // Status Badge
  if (receiptData.status === 'COMPLETED') {
    doc.setFillColor(0, 153, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.rect(pageWidth - margin - 30, 15, 25, 8, 'F');
    doc.text('PAID', pageWidth - margin - 17.5, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  return doc;
}

/**
 * Generate receipt PDF as buffer for download
 */
export async function generateReceiptPDFBuffer(
  paymentId: string,
  options?: ReceiptOptions
): Promise<Buffer> {
  const receiptData = await getReceiptData(paymentId);
  
  if (!receiptData) {
    throw new Error('Payment not found');
  }

  const doc = generateReceiptPDF(receiptData, options);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return pdfBuffer;
}

/**
 * Get receipt filename
 */
export function getReceiptFilename(receiptData: ReceiptData): string {
  const date = formatDate(new Date(receiptData.paymentDate), 'yyyy-MM-dd');
  return `Receipt_${receiptData.paymentNumber}_${date}.pdf`;
}

/**
 * Generate HTML receipt for print/preview
 */
export function generateReceiptHTML(receiptData: ReceiptData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt ${receiptData.paymentNumber}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
      @page { margin: 1cm; }
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .receipt-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
    }
    
    .company-name {
      font-size: 32px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 5px;
    }
    
    .receipt-title {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      margin-top: 15px;
    }
    
    .info-box {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    
    .info-label {
      font-weight: bold;
      min-width: 150px;
      color: #555;
    }
    
    .amount-box {
      background: #0066cc;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .amount-label {
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    .amount-value {
      font-size: 32px;
      font-weight: bold;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
      margin-top: 25px;
      margin-bottom: 10px;
      border-bottom: 2px solid #eee;
      padding-bottom: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background: #0066cc;
      color: white;
      font-weight: bold;
    }
    
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #eee;
      color: #666;
      font-size: 12px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .status-completed { background: #00aa00; color: white; }
    .status-pending { background: #ff9900; color: white; }
    .status-failed { background: #cc0000; color: white; }
    
    .print-button {
      background: #0066cc;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      margin: 20px 0;
    }
    
    .print-button:hover {
      background: #0052a3;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print Receipt</button>
  
  <div class="receipt-header">
    <div class="company-name">ELEGANT STEEL</div>
    <div style="color: #666;">Your Trusted Business Partner</div>
    <div class="receipt-title">PAYMENT RECEIPT</div>
  </div>
  
  <div class="amount-box">
    <div class="amount-label">AMOUNT PAID</div>
    <div class="amount-value">${formatCurrency(receiptData.amount)}</div>
  </div>
  
  <div class="info-box">
    <div>
      <div class="info-row">
        <span class="info-label">Receipt No:</span>
        <span>${receiptData.paymentNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Date:</span>
        <span>${formatDate(new Date(receiptData.paymentDate), 'PPP')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Method:</span>
        <span>${receiptData.paymentMethod.replace(/_/g, ' ')}</span>
      </div>
    </div>
    <div>
      <div class="info-row">
        <span class="info-label">Reference:</span>
        <span>${receiptData.reference}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="status-badge status-${receiptData.status.toLowerCase()}">${receiptData.status}</span>
      </div>
    </div>
  </div>
  
  <div class="section-title">CUSTOMER INFORMATION</div>
  <div class="info-box">
    <div>
      <div class="info-row">
        <span class="info-label">Name:</span>
        <span>${receiptData.customer.name}</span>
      </div>
      ${receiptData.customer.email ? `
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span>${receiptData.customer.email}</span>
      </div>
      ` : ''}
    </div>
    <div>
      ${receiptData.customer.phone ? `
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span>${receiptData.customer.phone}</span>
      </div>
      ` : ''}
    </div>
  </div>
  
  ${receiptData.invoice ? `
  <div class="section-title">INVOICE INFORMATION</div>
  <table>
    <tr>
      <th>Invoice Number</th>
      <th>Invoice Total</th>
      <th>Balance Due</th>
    </tr>
    <tr>
      <td>${receiptData.invoice.invoiceNumber}</td>
      <td>${formatCurrency(receiptData.invoice.totalAmount)}</td>
      <td style="color: ${receiptData.invoice.balanceAmount > 0 ? '#cc0000' : '#00aa00'}; font-weight: bold;">
        ${formatCurrency(receiptData.invoice.balanceAmount)}
      </td>
    </tr>
  </table>
  ` : ''}
  
  <div class="section-title">PAYMENT DETAILS</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Payment Amount</td>
        <td><strong>${formatCurrency(receiptData.amount)}</strong></td>
      </tr>
      <tr>
        <td>Payment Method</td>
        <td>${receiptData.paymentMethod.replace(/_/g, ' ')}</td>
      </tr>
      <tr>
        <td>Transaction Reference</td>
        <td>${receiptData.reference}</td>
      </tr>
      <tr>
        <td>Payment Status</td>
        <td><span class="status-badge status-${receiptData.status.toLowerCase()}">${receiptData.status}</span></td>
      </tr>
    </tbody>
  </table>
  
  ${receiptData.notes ? `
  <div class="section-title">NOTES</div>
  <div class="info-box">
    <div style="grid-column: 1 / -1;">${receiptData.notes}</div>
  </div>
  ` : ''}
  
  <div class="footer">
    <p><strong>Thank you for your business!</strong></p>
    <p>Generated on ${formatDate(new Date(), 'PPP')} at ${formatDate(new Date(), 'p')}</p>
    <p>This is a computer-generated receipt and does not require a signature.</p>
  </div>
</body>
</html>
  `;
}
