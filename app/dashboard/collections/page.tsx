'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  customer?: { name?: string | null } | null;
}

interface PaymentFormState {
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
}

const today = () => new Date().toISOString().split('T')[0];

export default function CollectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [form, setForm] = useState<PaymentFormState>({
    amount: '',
    paymentDate: today(),
    paymentMethod: 'CASH',
    reference: '',
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Invoice not found');
        }

        const result = await response.json();
        const invoiceData: InvoiceDetails | undefined = result?.data?.invoice;

        if (!invoiceData) {
          throw new Error('Invoice details are unavailable');
        }

        setInvoice(invoiceData);
        setForm({
          amount: invoiceData.balanceAmount.toString(),
          paymentDate: today(),
          paymentMethod: 'CASH',
          reference: invoiceData.invoiceNumber,
        });
      } catch (error) {
        console.error('Failed to load invoice for collection:', error);
        toast.error('Unable to load invoice for collection');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice || !form.amount) return;

    const parsedAmount = parseFloat(form.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (parsedAmount > invoice.balanceAmount) {
      toast.error(`Amount cannot exceed balance of ${formatCurrency(invoice.balanceAmount)}`);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: parsedAmount,
          paymentDate: form.paymentDate,
          paymentMethod: form.paymentMethod,
          reference: form.reference || invoice.invoiceNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message = result?.error?.message || result?.message || 'Collection failed';
        toast.error(message);
        return;
      }

      const updatedInvoice: InvoiceDetails | undefined = result?.data?.invoice;
      if (updatedInvoice) {
        setInvoice(updatedInvoice);
        setForm((prev) => ({
          ...prev,
          amount: updatedInvoice.balanceAmount > 0 ? updatedInvoice.balanceAmount.toString() : '',
        }));
      }

      toast.success('Collection recorded. Invoice updated automatically.');
    } catch (error) {
      console.error('Collection submit error:', error);
      toast.error('Failed to record collection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoiceId || !invoice) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Collection</h1>
        <div className="card">
          <div className="card-body text-gray-600">Select an invoice first to collect payment.</div>
        </div>
        <Link href="/dashboard/invoices" className="btn btn-primary inline-flex">
          Back to Invoices
        </Link>
      </div>
    );
  }

  const projectedBalance = Math.max(0, invoice.balanceAmount - (parseFloat(form.amount) || 0));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection</h1>
          <p className="text-sm text-gray-600 mt-1">Record payment and auto-adjust invoice balances.</p>
        </div>
        <button onClick={() => router.push('/dashboard/invoices')} className="btn btn-outline">
          Back to Invoices
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-xs text-gray-600">Invoice</p>
            <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
            <p className="text-xs text-gray-500 mt-1">Customer: {invoice.customer?.name || 'N/A'}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-xs text-gray-600">Current Balance</p>
            <p className="text-lg font-semibold text-orange-700">{formatCurrency(invoice.balanceAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">Status: {invoice.status}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-xs text-gray-600">Projected Balance</p>
            <p className="text-lg font-semibold text-blue-700">{formatCurrency(projectedBalance)}</p>
            <p className="text-xs text-gray-500 mt-1">After this collection</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Record Collected Amount</h2>
        </div>
        <form onSubmit={handleSubmit} className="card-body space-y-4">
          <div>
            <label className="label">Amount Collected</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={invoice.balanceAmount}
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="input"
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Date</label>
              <input
                type="date"
                value={form.paymentDate}
                max={today()}
                onChange={(e) => setForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="input"
              >
                <option value="CASH">Cash</option>
                <option value="M-PESA">M-Pesa</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Reference</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
              className="input"
              placeholder="Receipt / transaction reference"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.push('/dashboard/invoices')} className="btn btn-outline flex-1" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
