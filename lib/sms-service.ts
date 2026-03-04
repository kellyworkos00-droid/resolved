/**
 * SMS Service for Kelly OS
 * Supports Africa's Talking, Twilio, TextSMS.co.ke, and AppSMS for sending SMS notifications
 * 
 * Setup Instructions:
 * 1. For Africa's Talking:
 *    - Sign up at https://africastalking.com
 *    - Add environment variables: AFRICAS_TALKING_USERNAME, AFRICAS_TALKING_API_KEY, AFRICAS_TALKING_SENDER_ID
 * 
 * 2. For Twilio:
 *    - Sign up at https://www.twilio.com
 *    - Add environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 * 
 * 3. For TextSMS.co.ke:
 *    - Sign up at https://textsms.co.ke
 *    - Add environment variables: TEXTSMS_API_KEY, TEXTSMS_API_URL, TEXTSMS_SENDER_ID
 * 
 * 4. For AppSMS:
 *    - Sign up at https://appsms.textsms.co.ke
 *    - Add environment variables: APPSMS_API_KEY, APPSMS_API_URL, APPSMS_SENDER_ID
 */

import { ExternalApiError } from '@/lib/errors';

// SMS Provider configuration
type SmsProvider = 'africastalking' | 'twilio' | 'textsms' | 'appsms' | 'none';

const SMS_PROVIDER: SmsProvider = (process.env.SMS_PROVIDER as SmsProvider) || 'none';

// Helper function to get active SMS provider
function getActiveSmsProvider(): SmsProvider {
  // If SMS_PROVIDER is explicitly set, use it
  if (SMS_PROVIDER !== 'none') {
    return SMS_PROVIDER;
  }
  
  // If AppSMS is enabled, use it as primary fallback
  if (process.env.APPSMS_PROVIDER_ENABLED === 'true' && process.env.APPSMS_API_KEY) {
    return 'appsms';
  }
  
  // If TextSMS is enabled, use it as fallback
  if (process.env.TEXTSMS_PROVIDER_ENABLED === 'true' && process.env.TEXTSMS_API_KEY) {
    return 'textsms';
  }
  
  // If Africa's Talking is configured, use it as fallback
  if (process.env.AFRICAS_TALKING_API_KEY) {
    return 'africastalking';
  }
  
  return 'none';
}

/**
 * SMS options interface
 */
export interface SendSmsOptions {
  to: string; // Phone number in international format (e.g., +254712345678)
  message: string;
  type?: 'transactional' | 'marketing' | 'notification';
}

/**
 * SMS result interface
 */
export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: string;
  cost?: number;
  error?: string;
}

/**
 * Format phone number to international format
 * Supports Kenya numbers starting with 07 or 7
 */
function formatPhoneNumber(phone: string): string {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // If starts with 0, replace with +254 (Kenya)
  if (cleaned.startsWith('0')) {
    cleaned = '+254' + cleaned.substring(1);
  }
  
  // If starts with 7 (without country code), add +254
  if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '+254' + cleaned;
  }
  
  // If doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Check if it matches international format with country code
  return /^\+\d{10,15}$/.test(formatted);
}

/**
 * Send SMS via Africa's Talking
 */
async function sendViaAfricasTalking(options: SendSmsOptions): Promise<SmsResult> {
  const username = process.env.AFRICAS_TALKING_USERNAME;
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const senderId = process.env.AFRICAS_TALKING_SENDER_ID || 'KELLY_OS';

  if (!username || !apiKey) {
    throw new ExternalApiError('Africa\'s Talking credentials not configured');
  }

  try {
    const formattedPhone = formatPhoneNumber(options.to);
    
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        username: username,
        to: formattedPhone,
        message: options.message,
        from: senderId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Africa's Talking API error: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.SMSMessageData?.Recipients?.length > 0) {
      const recipient = data.SMSMessageData.Recipients[0];
      
      if (recipient.status === 'Success') {
        return {
          success: true,
          provider: 'africastalking',
          messageId: recipient.messageId,
          cost: recipient.cost ? parseFloat(recipient.cost.replace('KES ', '')) : undefined,
        };
      } else {
        return {
          success: false,
          provider: 'africastalking',
          error: recipient.status,
        };
      }
    }

    throw new Error('No recipients in response');
  } catch (error) {
    console.error('Africa\'s Talking SMS error:', error);
    throw new ExternalApiError('AfricasTalking', 500, error);
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(options: SendSmsOptions): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new ExternalApiError('Twilio credentials not configured');
  }

  try {
    const formattedPhone = formatPhoneNumber(options.to);
    
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: fromNumber,
          Body: options.message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${errorData.message}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      provider: 'twilio',
      messageId: data.sid,
      cost: data.price ? Math.abs(parseFloat(data.price)) : undefined,
    };
  } catch (error) {
    console.error('Twilio SMS error:', error);
    throw new ExternalApiError('Twilio', 500, error);
  }
}

/**
 * Send SMS via TextSMS.co.ke
 */
async function sendViaTextSms(options: SendSmsOptions): Promise<SmsResult> {
  const apiKey = process.env.TEXTSMS_API_KEY;
  const apiUrl = process.env.TEXTSMS_API_URL || 'https://api.textsms.co.ke/api/v1/send';
  const senderId = process.env.TEXTSMS_SENDER_ID || 'KELLY_OS';

  if (!apiKey) {
    throw new ExternalApiError('TextSMS.co.ke API key not configured');
  }

  try {
    const formattedPhone = formatPhoneNumber(options.to);
    
    console.log('[TextSMS] Sending SMS:', {
      url: apiUrl,
      phone: formattedPhone,
      messageLength: options.message.length,
      senderId,
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: options.message,
        sender_id: senderId,
      }),
    });

    const responseText = await response.text();
    console.log('[TextSMS] Response status:', response.status);
    console.log('[TextSMS] Response body:', responseText);

    if (!response.ok) {
      console.error('[TextSMS] API error:', response.status, responseText);
      throw new Error(`TextSMS API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[TextSMS] Failed to parse response:', responseText);
      throw new Error(`Invalid JSON response from TextSMS: ${responseText}`);
    }
    
    console.log('[TextSMS] Parsed response:', data);
    
    if (data.success || data.status === 'success') {
      console.log('[TextSMS] SMS sent successfully:', data.message_id || data.id);
      return {
        success: true,
        provider: 'textsms',
        messageId: data.message_id || data.id,
      };
    } else {
      console.error('[TextSMS] SMS sending failed:', data.message || data.error);
      return {
        success: false,
        provider: 'textsms',
        error: data.message || data.error || 'Failed to send SMS',
      };
    }
  } catch (error) {
    console.error('[TextSMS] Exception:', error);
    if (error instanceof Error) {
      console.error('[TextSMS] Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
      });
    }
    throw new ExternalApiError('TextSMS', 500, error);
  }
}

/**
 * Send SMS via AppSMS
 */
async function sendViaAppSms(options: SendSmsOptions): Promise<SmsResult> {
  const apiKey = process.env.APPSMS_API_KEY;
  const apiUrl = process.env.APPSMS_API_URL || 'https://api.textsms.co.ke/api/v1/send';
  const senderId = process.env.APPSMS_SENDER_ID || 'KELLY_OS';

  if (!apiKey) {
    throw new ExternalApiError('AppSMS API key not configured');
  }

  try {
    const formattedPhone = formatPhoneNumber(options.to);
    
    console.log('[AppSMS] Sending SMS:', {
      url: apiUrl,
      phone: formattedPhone,
      messageLength: options.message.length,
      senderId,
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: options.message,
        sender_id: senderId,
      }),
    });

    const responseText = await response.text();
    console.log('[AppSMS] Response status:', response.status);
    console.log('[AppSMS] Response body:', responseText);

    if (!response.ok) {
      console.error('[AppSMS] API error:', response.status, responseText);
      throw new Error(`AppSMS API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[AppSMS] Failed to parse response:', responseText);
      throw new Error(`Invalid JSON response from AppSMS: ${responseText}`);
    }
    
    console.log('[AppSMS] Parsed response:', data);
    
    if (data.success || data.status === 'success') {
      console.log('[AppSMS] SMS sent successfully:', data.message_id || data.id);
      return {
        success: true,
        provider: 'appsms',
        messageId: data.message_id || data.id,
      };
    } else {
      console.error('[AppSMS] SMS sending failed:', data.message || data.error);
      return {
        success: false,
        provider: 'appsms',
        error: data.message || data.error || 'Failed to send SMS',
      };
    }
  } catch (error) {
    console.error('[AppSMS] Exception:', error);
    throw new ExternalApiError('AppSMS', 500, error);
  }
}

/**
 * Send SMS notification
 * Automatically selects provider based on configuration
 */
export async function sendSms(options: SendSmsOptions): Promise<SmsResult> {
  // Validate phone number
  if (!isValidPhoneNumber(options.to)) {
    return {
      success: false,
      provider: 'none',
      error: 'Invalid phone number format',
    };
  }

  // Get active provider
  const activeProvider = getActiveSmsProvider();
  
  // Check if SMS is configured
  if (activeProvider === 'none') {
    console.warn('SMS provider not configured. Set SMS_PROVIDER environment variable or configure TextSMS.');
    return {
      success: false,
      provider: 'none',
      error: 'SMS provider not configured',
    };
  }

  // Truncate message if too long (160 chars for single SMS, 1530 for concatenated)
  const maxLength = 1530;
  const message = options.message.length > maxLength 
    ? options.message.substring(0, maxLength - 3) + '...'
    : options.message;

  // Send via configured provider
  try {
    if (activeProvider === 'africastalking') {
      return await sendViaAfricasTalking({ ...options, message });
    } else if (activeProvider === 'twilio') {
      return await sendViaTwilio({ ...options, message });
    } else if (activeProvider === 'textsms') {
      return await sendViaTextSms({ ...options, message });
    } else if (activeProvider === 'appsms') {
      return await sendViaAppSms({ ...options, message });
    }
    
    return {
      success: false,
      provider: 'none',
      error: `Unknown SMS provider: ${activeProvider}`,
    };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      provider: activeProvider,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send invoice payment reminder SMS
 */
export async function sendInvoiceReminderSms(
  customerPhone: string,
  customerName: string,
  invoiceNumber: string,
  totalAmount: number,
  balanceAmount: number,
  dueDate: Date,
  daysOverdue: number
): Promise<SmsResult> {
  const formattedDueDate = dueDate.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedAmount = `KES ${balanceAmount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  let message: string;

  if (daysOverdue > 0) {
    // Overdue invoice
    message = `Hi ${customerName},\n\n` +
      `Your invoice ${invoiceNumber} is OVERDUE by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}.\n\n` +
      `Amount due: ${formattedAmount}\n` +
      `Due date: ${formattedDueDate}\n\n` +
      `Please settle this invoice urgently to avoid service interruption.\n\n` +
      `Thank you,\nKelly OS`;
  } else {
    // Upcoming or due today
    const daysToDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToDue === 0) {
      message = `Hi ${customerName},\n\n` +
        `Invoice ${invoiceNumber} is DUE TODAY.\n\n` +
        `Amount due: ${formattedAmount}\n\n` +
        `Please process payment today to avoid late charges.\n\n` +
        `Thank you,\nKelly OS`;
    } else {
      message = `Hi ${customerName},\n\n` +
        `Payment reminder for invoice ${invoiceNumber}.\n\n` +
        `Amount due: ${formattedAmount}\n` +
        `Due date: ${formattedDueDate} (${daysToDue} days)\n\n` +
        `Thank you for your business!\n\n` +
        `Kelly OS`;
    }
  }

  return await sendSms({
    to: customerPhone,
    message,
    type: 'transactional',
  });
}

/**
 * Send generic notification SMS
 */
export async function sendNotificationSms(
  phone: string,
  title: string,
  message: string
): Promise<SmsResult> {
  const fullMessage = title ? `${title}\n\n${message}` : message;
  
  return await sendSms({
    to: phone,
    message: fullMessage,
    type: 'notification',
  });
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSms(
  recipients: Array<{ phone: string; message: string }>,
  batchSize: number = 100
): Promise<SmsResult[]> {
  const results: SmsResult[] = [];
  
  // Process in batches to avoid rate limiting
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(recipient =>
      sendSms({
        to: recipient.phone,
        message: recipient.message,
        type: 'notification',
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Verify SMS configuration
 */
export function verifySmsConfiguration(): {
  configured: boolean;
  provider: string;
  errors: string[];
} {
  const errors: string[] = [];
  
  const activeProvider = getActiveSmsProvider();
  
  if (activeProvider === 'none') {
    errors.push('No SMS provider configured');
    return { configured: false, provider: 'none', errors };
  }

  if (activeProvider === 'africastalking') {
    if (!process.env.AFRICAS_TALKING_USERNAME) {
      errors.push('AFRICAS_TALKING_USERNAME not set');
    }
    if (!process.env.AFRICAS_TALKING_API_KEY) {
      errors.push('AFRICAS_TALKING_API_KEY not set');
    }
  } else if (activeProvider === 'twilio') {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      errors.push('TWILIO_ACCOUNT_SID not set');
    }
    if (!process.env.TWILIO_AUTH_TOKEN) {
      errors.push('TWILIO_AUTH_TOKEN not set');
    }
    if (!process.env.TWILIO_PHONE_NUMBER) {
      errors.push('TWILIO_PHONE_NUMBER not set');
    }
  } else if (activeProvider === 'textsms') {
    if (!process.env.TEXTSMS_API_KEY) {
      errors.push('TEXTSMS_API_KEY not set');
    }
    if (!process.env.TEXTSMS_API_URL) {
      errors.push('TEXTSMS_API_URL not set (defaults to https://api.textsms.co.ke/api/v1/send)');
    }
  } else if (activeProvider === 'appsms') {
    if (!process.env.APPSMS_API_KEY) {
      errors.push('APPSMS_API_KEY not set');
    }
    if (!process.env.APPSMS_API_URL) {
      errors.push('APPSMS_API_URL not set (defaults to https://api.textsms.co.ke)');
    }
  } else {
    errors.push(`Unknown SMS provider: ${activeProvider}`);
  }

  return {
    configured: errors.length === 0,
    provider: activeProvider,
    errors,
  };
}
