# SMS Module - User Guide

## Overview

The SMS module is now fully integrated into your ERP system. It allows you to send automated SMS reminders to customers for overdue/unpaid invoices and custom bulk SMS messages to multiple customers.

## ✅ What Was Fixed

1. **SMS Module is Now Discoverable** 
   - Added "SMS Management" menu item in the main navigation sidebar
   - Easy access from any dashboard page

2. **API Endpoints Working**
   - `/api/invoices/[id]/send-sms-reminder` - Send SMS reminder for specific invoice
   - `/api/sms/send-bulk` - Send bulk SMS to multiple recipients
   - `/api/sms/test` - Test SMS configuration status

3. **SMS Management Page Created**
   - Dedicated interface for all SMS operations
   - Real-time configuration status
   - Quick stats on unpaid invoices and customers with phones

## How to Access SMS Management

### Method 1: Dashboard Navigation
1. Log in to your dashboard
2. Click **"SMS Management"** in the left sidebar (📱 icon)
3. You're now in the SMS Management page

### Method 2: Invoices Page
1. Go to **Invoices** → **All Invoices**
2. For each unpaid invoice with a customer phone number:
   - Look for the **SMS button** (📱) in the Actions column
   - Click to send a payment reminder SMS

## Features

### 1. Send Invoice Reminders
**Location:** SMS Management → "Send Reminders" tab

- View all unpaid invoices
- Send payment reminder SMS with one click
- SMS includes:
  - Customer name
  - Invoice number
  - Outstanding balance
  - Due date
  - Payment urgency (different for overdue vs. upcoming due)

**Requirements:**
- Invoice must be unpaid (not PAID status)
- Customer must have a phone number on file

### 2. Bulk SMS
**Location:** SMS Management → "Bulk SMS" tab

- Send custom messages to multiple customers at once
- Enter message (up to 1530 characters)
- Enter phone numbers (one per line)
- System shows:
  - Character count
  - Number of SMS segments needed
  - Phone number count

**Phone Number Format:** 
- +254712345678 (international format recommended)
- 0712345678 (Kenya format - auto-converts)
- +1-555-123-4567 (other formats accepted)

### 3. Configuration Status
**Location:** SMS Management → Overview tab

Check if SMS is properly configured:
- ✓ Green: SMS ready to send
- ✗ Red: SMS not configured

**Provider Information:**
- Current provider (Africa's Talking or Twilio)
- Configuration status
- Any configuration errors

## SMS Templates

### Invoice Reminder - Overdue
```
Hi [Customer Name],

Your invoice [Invoice Number] is OVERDUE by [X] day(s).

Amount due: KES [Amount]
Due date: [Date]

Please settle this invoice urgently to avoid service interruption.

Thank you,
Kelly OS
```

### Invoice Reminder - Due Today
```
Hi [Customer Name],

Invoice [Invoice Number] is DUE TODAY.

Amount due: KES [Amount]

Please process payment today to avoid late charges.

Thank you,
Kelly OS
```

### Invoice Reminder - Upcoming
```
Hi [Customer Name],

Payment reminder for invoice [Invoice Number].

Amount due: KES [Amount]
Due date: [Date] ([X] days)

Thank you for your business!

Kelly OS
```

## Requirements

### For Customers
- **Phone number on file** - Add phone numbers in:
  - Customers → [Customer Name] → Phone field
  - Must be in valid international format

### For Your Account
- **SMS Provider Configured** - Check in SMS Management window
  - Provider must be set (Africa's Talking or Twilio)
  - API credentials configured in `.env` file

### System Requirements
- User must have "invoice.manage" permission
- Internet connection (to connect to SMS provider)

## SMS Sending Status

When you send an SMS:
1. Button shows "Sending..." during transmission
2. Receipt shows:
   - ✓ Success: "SMS reminder sent successfully"
   - ✗ Failed: Error message with reason

**Common Issues:**
- "Customer does not have a phone number" → Add phone to customer profile
- "SMS provider not configured" → Contact administrator
- "Invalid phone number" → Use international format (+254...)
- "Invoice is already paid" → Only unpaid invoices can receive reminders

## Audit & Logging

All SMS sends are logged:
- **View in:** Audit & Compliance → Activity Logs
- **Logged information:**
  - Timestamp of send
  - User who sent
  - Customer name and phone
  - Invoice number
  - Amount
  - Success/failure status
  - Message ID from provider

## Cost Tracking

Each SMS shows cost information:
- **Cost is logged** when SMS is sent
- **Provider charges based on:**
  - Number of SMS (160 chars = 1 SMS)
  - Destination country
  - Messages over 160 chars sent as multiple segments

## Best Practices

1. **Update Customer Phone Numbers**
   - Import from bank statements when possible
   - Validate during customer onboarding

2. **Send Reminders Regularly**
   - Send when invoice becomes overdue
   - Follow up every 3-5 days for long-overdue invoices

3. **Use Bulk SMS for Campaigns**
   - Monthly payment reminders
   - Special offers
   - Updated contact information requests

4. **Check Configuration**
   - Visit SMS Management → Overview regularly
   - Ensure credentials are still valid
   - Monitor for any configuration warnings

## Troubleshooting

### SMS Button Not Visible on Invoice
**Possible Causes:**
- Invoice is already PAID (reminders only for unpaid)
- Customer has no phone number on file
- Invoice status is DRAFT or CANCELLED

**Solution:** Add phone number to customer profile or check invoice status

### SMS Sending Fails
**Possible Causes:**
- Provider not configured
- Invalid phone number format
- Authentication expired
- Network connectivity issue

**Solution:** Check SMS Management status, verify phone format, contact admin if provider issue

### SMS Takes Too Long
- System sends immediately
- If delayed, it's provider processing (usually < 30 seconds)
- Check internet connection

### Can't Find SMS Module
- Look in left sidebar for "SMS Management" (📱 icon)
- If not visible, contact your administrator

## SMS Provider Information

### Africa's Talking (Recommended)
- **Region:** Best for East Africa (Kenya, Uganda, etc.)
- **Features:** Reliable, good rates
- **Setup:** Contact administrator with business details

### Twilio
- **Region:** Global coverage
- **Features:** Premium service, excellent support
- **Setup:** Contact administrator with business details

## Support

For SMS issues:
1. Check SMS Management → Overview for configuration status
2. Verify customer phone numbers are in correct format
3. Review audit logs for error messages
4. Contact system administrator if:
   - SMS provider shows as not configured
   - Consistent send failures
   - Cannot access SMS Management page

## Summary

✅ SMS module is now:
- **Visible** in sidebar navigation
- **Functional** with multiple sending methods
- **Tracked** in audit logs
- **Ready to use** for customer communication

Start by visiting **SMS Management** to send your first reminder!
