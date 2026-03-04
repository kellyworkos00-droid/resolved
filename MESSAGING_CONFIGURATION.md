# Messaging System Configuration Guide

## Overview

Kelly OS includes comprehensive messaging capabilities supporting multiple channels:

1. **SMS Messaging** - Send bulk and individual SMS notifications
2. **Email Messaging** - Send transactional and notification emails
3. **In-App Notifications** - Real-time in-application alerts
4. **Message Templates** - Pre-defined message templates for common scenarios

---

## SMS Configuration

### Supported SMS Providers

#### 1. **TextSMS.co.ke** (Currently Active)
A Kenyan SMS gateway service perfect for East African deployments.

**Status**: ✅ **CONFIGURED AND ACTIVE**

**Configuration Details**:
- **API Key**: `ac36ebf936c512e14331c670360c4da0` (stored securely in `.env`)
- **API Endpoint**: `https://api.textsms.co.ke/api/v1/send`
- **Sender ID**: `ELEGANT`
- **Enable Flag**: `TEXTSMS_PROVIDER_ENABLED=true`

**Features**:
- Individual SMS sending
- Bulk SMS campaigns
- Message tracking
- Delivery reports
- Support for Kenyan phone numbers (+254xxx format)

#### 2. **Africa's Talking** (Fallback)
Configured as secondary provider if TextSMS fails.

**Configuration**:
```env
SMS_PROVIDER=africastalking
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=atsk_7beebe5cf9e9222f6302e8f554460a239ae8951836db81b94631e5cec9c046f3c711c4a7
AFRICAS_TALKING_SENDER_ID=ELEGANT STEEL
```

#### 3. **Twilio** (Optional)
Can be configured if needed.

**To configure**:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

---

## SMS Usage Examples

### Send Individual SMS
```typescript
import { sendSms } from '@/lib/sms-service';

const result = await sendSms({
  to: '+254712345678',
  message: 'Your invoice INV-001 is due on 15th March',
  type: 'notification'
});
```

### Send Bulk SMS
```typescript
import { sendBulkSms } from '@/lib/sms-service';

const result = await sendBulkSms([
  {
    to: '+254712345678',
    message: 'Invoice payment reminder'
  },
  {
    to: '+254723456789',
    message: 'Invoice payment reminder'
  }
]);
```

### Send Invoice Reminder
```typescript
import { sendInvoiceReminderSms } from '@/lib/sms-service';

await sendInvoiceReminderSms(
  '+254712345678',        // Customer phone
  'Acme Corp',            // Customer name
  'INV-2024-001',         // Invoice number
  150000,                 // Total amount
  50000,                  // Balance due
  new Date('2024-03-15'), // Due date
  0                       // Days overdue (0 = not overdue)
);
```

---

## Email Configuration

**Status**: ⚠️ **NOT YET CONFIGURED**

### Setup Email Service

Choose your preferred email provider:

#### Option 1: SendGrid (Recommended)
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourcompany.com
```

#### Option 2: Gmail SMTP
```env
EMAIL_PROVIDER=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

#### Option 3: Mailgun
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_domain.mailgun.org
EMAIL_FROM=noreply@yourcompany.com
```

#### Option 4: AWS SES
```env
EMAIL_PROVIDER=aws-ses
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_REGION=us-east-1
EMAIL_FROM=noreply@yourcompany.com
```

---

## Message Templates

### Available Template Categories

1. **PAYMENT_REMINDER** - Invoice payment reminders
2. **PAYMENT_CONFIRMATION** - Payment confirmation
3. **INVOICE_SENT** - Invoice delivery notification
4. **ORDER_CONFIRMATION** - Order confirmation
5. **DELIVERY_UPDATE** - Delivery status update
6. **CUSTOMER_WELCOME** - Welcome message for new customers
7. **PROMOTIONAL** - Marketing/promotional messages
8. **ALERT** - System alerts and warnings
9. **ANNOUNCEMENT** - Important announcements

### Using Message Templates

```typescript
import { getMessageTemplate, interpolateTemplate } from '@/lib/message-service';

// Get template
const template = await getMessageTemplate('PAYMENT_REMINDER');

// Interpolate variables
const message = interpolateTemplate(template.content, {
  customerName: 'John Doe',
  invoiceNumber: 'INV-001',
  dueDate: '2024-03-15',
  amount: 'KES 50,000'
});

// Send via SMS
await sendSms({
  to: customerPhone,
  message,
  type: 'notification'
});
```

---

## In-App Notifications

### Create Notification

```typescript
import { createNotification } from '@/lib/notification-service';

await createNotification({
  userId: 'user-123',
  type: 'payment_received',
  title: 'Payment Received',
  message: 'Payment of KES 50,000 received from Acme Corp',
  severity: 'success',
  category: 'payment',
  actionUrl: '/dashboard/payment-123'
});
```

### Notification Types
- `info` - Information messages
- `success` - Success messages
- `warning` - Warning messages
- `error` - Error messages
- `payment_received` - Payment notifications
- `invoice_created` - Invoice notifications
- `payment_reminder` - Reminder notifications
- `system_alert` - System alerts

---

## Message Dashboard

Access the Messages page at: `/dashboard/messages`

### Features
- ✅ Single customer messaging
- ✅ Bulk customer SMS campaigns
- ✅ Send to customers with balance
- ✅ Send to all customers
- ✅ Message templates
- ✅ Delivery tracking
- ✅ Message history
- ✅ Cost calculation

### SMS Page
Access SMS management at: `/dashboard/sms`

### Features
- ✅ Send invoice reminders
- ✅ Bulk SMS sending
- ✅ Message character counting
- ✅ SMS cost calculation
- ✅ Provider status monitoring

---

## Testing SMS Configuration

### Test Endpoint

**POST** `/api/sms/test`

```bash
curl -X POST http://localhost:3000/api/sms/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phoneNumber": "+254712345678",
    "message": "This is a test message"
  }'
```

### Expected Response

```json
{
  "timestamp": "2024-03-04T10:30:00Z",
  "testSms": {
    "phoneNumber": "+254712345678",
    "provider": "textsms",
    "success": true,
    "messageId": "msg-123456",
    "cost": null
  },
  "status": "SUCCESS",
  "message": "Test SMS sent successfully"
}
```

---

## Message Sending Best Practices

### 1. Format Phone Numbers
- Always use international format: `+254712345678`
- System automatically converts formats like `0712345678` or `712345678`

### 2. Message Content
- Keep messages under 160 characters for single SMS
- Up to 1530 characters for concatenated SMS
- Messages longer than 1530 characters will be truncated

### 3. Sending Frequency
- Space out bulk messages to avoid rate limiting
- Use message templates for consistency
- Track delivery status

### 4. Error Handling
```typescript
const result = await sendSms({
  to: phoneNumber,
  message: 'Your message here'
});

if (!result.success) {
  console.error('SMS failed:', result.error);
  // Handle failure - retry, fallback provider, etc.
}
```

### 5. Logging & Audit
- All SMS sends are logged to the database
- Audit logs track message delivery
- Delivery reports available in SMS dashboard

---

## Managing Message Preferences

### User Notification Settings

Users can manage their notification preferences at:
`/dashboard/settings/notifications`

**Preferences**:
- Email notifications: On/Off
- SMS notifications: On/Off
- In-app notifications: On/Off
- Push notifications: On/Off
- Notification categories by type

---

## Troubleshooting

### SMS Not Sending

1. **Check Provider Status**
   ```bash
   curl -X GET http://localhost:3000/api/sms/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verify Phone Number Format**
   - Must be valid international format
   - Example: `+254712345678`

3. **Check API Credentials**
   - Verify `TEXTSMS_API_KEY` is correct
   - Verify `TEXTSMS_PROVIDER_ENABLED=true`

4. **Check Message Length**
   - Maximum 1530 characters
   - Multi-part SMS may cost extra

### High Failure Rate

1. **Rate Limiting**
   - Implement delays between bulk sends
   - Use queue system for large campaigns

2. **Network Issues**
   - Check internet connectivity
   - Verify API endpoint accessibility

3. **Provider Downtime**
   - Check TextSMS.co.ke status page
   - Fallback to Africa's Talking if needed

---

## Security Notes

### API Keys
- Keep API keys secure in `.env` file
- Never commit `.env` to git
- Rotate keys periodically (especially in production)

### Phone Numbers
- Phone numbers may contain PII
- Ensure GDPR/privacy compliance
- Log only necessary message metadata

### Message Content
- Don't send sensitive data via SMS
- Use message templates for consistency
- Avoid phishing-like messages

---

## API Reference

### SMS Service Functions

#### `sendSms(options: SendSmsOptions): Promise<SmsResult>`
Send a single SMS message.

#### `sendBulkSms(recipients: Array<{to, message}>): Promise<SmsResult>`
Send SMS to multiple recipients.

#### `sendInvoiceReminderSms(...): Promise<SmsResult>`
Send formatted invoice reminder SMS.

#### `sendNotificationSms(phone, title, message): Promise<SmsResult>`
Send generic notification SMS.

#### `verifySmsConfiguration(): {configured, provider, errors}`
Verify current SMS provider configuration.

---

## Support & Resources

- **TextSMS.co.ke Docs**: https://textsms.co.ke/docs
- **Africa's Talking Docs**: https://africastalking.com/sms
- **Twilio Docs**: https://www.twilio.com/docs

---

**Last Updated**: March 4, 2026  
**Configuration Status**: ✅ TextSMS.co.ke Active  
**Next Steps**: Configure email service if needed
