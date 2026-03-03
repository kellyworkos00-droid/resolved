'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  balanceAmount: number;
  status: string;
  customerId: string;
}

interface SmsConfigResponse {
  smsConfiguration?: {
    provider?: string;
    configured?: boolean;
    errors?: string[] | null;
  };
}

export default function SmsManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'send-reminder' | 'bulk-sms'>('overview');
  const [smsConfig, setSmsConfig] = useState<SmsConfigResponse | null>(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch SMS configuration
  const fetchSmsConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/sms/test');
      const data = await response.json();
      setSmsConfig(data);
    } catch (error) {
      console.error('Failed to fetch SMS config:', error);
    }
  }, []);

  // Fetch invoices with unpaid balance for reminders
  const fetchUnpaidInvoices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invoices?limit=100&status=OVERDUE,SENT,PARTIALLY_PAID', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();
      const unpaidInvoices = data.data.invoices.filter(
        (inv: Invoice) => inv.balanceAmount > 0 && inv.status !== 'PAID'
      );
      setInvoices(unpaidInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  }, []);

  // Fetch customers for bulk SMS
  const fetchCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch customers');

      const data = await response.json();
      const customersWithPhone = data.data.customers.filter((c: Customer) => c.phone);
      setCustomers(customersWithPhone);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSmsConfig(), fetchUnpaidInvoices(), fetchCustomers()]).finally(() =>
      setLoading(false)
    );
  }, [fetchSmsConfig, fetchUnpaidInvoices, fetchCustomers]);

  const sendInvoiceReminder = async (invoiceId: string) => {
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoiceId}/send-sms-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to send SMS reminder');
      }

      toast.success('SMS reminder sent successfully!');
      fetchUnpaidInvoices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send SMS reminder');
    } finally {
      setSending(false);
    }
  };

  const sendBulkSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMessage.trim() || !bulkPhones.trim()) {
      toast.error('Please enter message and phone numbers');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const phones = bulkPhones
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p);

      const response = await fetch('/api/sms/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: bulkMessage,
          phoneNumbers: phones,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to send bulk SMS');
      }

      toast.success(`Sent ${data.data?.sent || phones.length} SMS successfully!`);
      setBulkMessage('');
      setBulkPhones('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send bulk SMS');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isConfigured = smsConfig?.smsConfiguration?.configured;
  const smsProvider = smsConfig?.smsConfiguration?.provider;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-body">
          <h1 className="text-3xl font-bold text-gray-900">SMS Management</h1>
          <p className="text-gray-600 mt-2">Send SMS reminders and notifications to your customers</p>
        </div>
      </div>

      {/* Configuration Status */}
      <div className={`card border-2 ${isConfigured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {isConfigured ? '✓ SMS Module Configured' : '⚠️ SMS Module Not Configured'}
              </h3>
              <p className={`text-sm ${isConfigured ? 'text-green-700' : 'text-red-700'} mt-1`}>
                {isConfigured
                  ? `Provider: ${smsProvider?.toUpperCase()}`
                  : 'SMS module needs configuration in .env file'}
              </p>
            </div>
            {!isConfigured && (
              <a href="/dashboard/documentation" className="btn btn-sm btn-primary">
                Setup Instructions
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-body border-b border-gray-200 pb-0">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setTab('overview')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                tab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab('send-reminder')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                tab === 'send-reminder' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Send Reminders
            </button>
            <button
              onClick={() => setTab('bulk-sms')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                tab === 'bulk-sms' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulk SMS
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="card-body space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600">{invoices.length}</div>
                  <div className="text-sm text-blue-700">Unpaid Invoices</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">{customers.length}</div>
                  <div className="text-sm text-green-700">Customers with Phone</div>
                </div>
                <div className={`${isConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
                  <div className={`text-sm font-semibold ${isConfigured ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {isConfigured ? '✓ Ready to Send SMS' : '✗ SMS Not Ready'}
                  </div>
                  <div className={`text-xs ${isConfigured ? 'text-emerald-600' : 'text-gray-600'}`}>
                    Provider: {smsProvider?.toUpperCase() || 'Not configured'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">How to Use SMS</h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="font-bold text-primary-600 min-w-fit">1.</span>
                  <span>
                    <strong>Send Invoice Reminders:</strong> Go to the &quot;Send Reminders&quot; tab to quickly send SMS reminders to customers with unpaid invoices.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary-600 min-w-fit">2.</span>
                  <span>
                    <strong>From Invoices Page:</strong> You can also send SMS reminders directly from the Invoices page by clicking the SMS button (📱) next to each unpaid invoice.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary-600 min-w-fit">3.</span>
                  <span>
                    <strong>Bulk SMS:</strong> Use the &quot;Bulk SMS&quot; tab to send custom messages to multiple customers at once.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary-600 min-w-fit">4.</span>
                  <span>
                    <strong>Requirements:</strong> Customers must have a phone number on file in their profile.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Send Reminders Tab */}
        {tab === 'send-reminder' && (
          <div className="card-body space-y-4">
            <h3 className="font-semibold text-lg">Send Invoice Payment Reminders</h3>
            {invoices.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
                <p>No unpaid invoices found. All invoices are paid!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-600">
                        Balance: KES {invoice.balanceAmount.toLocaleString()} • Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => sendInvoiceReminder(invoice.id)}
                      disabled={sending}
                      className="btn btn-sm btn-primary disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send SMS'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bulk SMS Tab */}
        {tab === 'bulk-sms' && (
          <div className="card-body space-y-4">
            <h3 className="font-semibold text-lg">Send Bulk SMS</h3>
            <form onSubmit={sendBulkSms} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter your message (max 1530 characters)"
                  maxLength={1530}
                  rows={4}
                  className="input w-full"
                  disabled={sending}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {bulkMessage.length}/1530 characters ({Math.ceil(bulkMessage.length / 160)} SMS)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Numbers <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={bulkPhones}
                  onChange={(e) => setBulkPhones(e.target.value)}
                  placeholder="Enter phone numbers (one per line)&#10;Example:&#10;+254712345678&#10;+254787654321"
                  rows={6}
                  className="input w-full font-mono text-sm"
                  disabled={sending}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {bulkPhones.split('\n').filter((p) => p.trim()).length} phone numbers
                </div>
              </div>

              <button
                type="submit"
                disabled={sending || !bulkMessage.trim() || !bulkPhones.trim()}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Bulk SMS'}
              </button>
            </form>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>💡 Tip:</strong> You can copy customer phone numbers from the Customers page and paste them here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SMS Configuration Details */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">SMS Configuration Details</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-gray-600 font-medium mb-2">Provider</div>
              <div className="font-mono bg-gray-50 p-2 rounded">{smsProvider?.toUpperCase() || 'Not configured'}</div>
            </div>
            <div>
              <div className="text-gray-600 font-medium mb-2">Status</div>
              <div className={`font-mono p-2 rounded ${isConfigured ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isConfigured ? '✓ Configured' : '✗ Not Configured'}
              </div>
            </div>
          </div>
          {!isConfigured && smsConfig?.smsConfiguration?.errors && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="font-semibold text-red-900 mb-2">Configuration Errors:</div>
              <ul className="text-sm text-red-700 space-y-1">
                {smsConfig.smsConfiguration.errors.map((error: string, idx: number) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
