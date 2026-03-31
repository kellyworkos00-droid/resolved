'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  customer?: { name?: string | null; phone?: string | null } | null;
}

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';
  const collectAction = searchParams.get('action') === 'collect';
  const collectInvoiceId = searchParams.get('invoiceId');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerIdFilter, setCustomerIdFilter] = useState(initialCustomerId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sendingSms, setSendingSms] = useState<string | null>(null); // Track invoice ID being sent SMS
  const [collectRouteHandled, setCollectRouteHandled] = useState(false);

  useEffect(() => {
    setCustomerIdFilter(initialCustomerId);
  }, [initialCustomerId]);

  const fetchInvoices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/invoices?all=true';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (customerIdFilter) url += `&customerId=${customerIdFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();
      setInvoices(data.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [customerIdFilter, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    if (!collectAction || !collectInvoiceId || collectRouteHandled || loading || invoices.length === 0) {
      return;
    }

    const targetInvoice = invoices.find((invoice) => invoice.id === collectInvoiceId);
    if (!targetInvoice) {
      toast.error('Invoice not found for collection');
      setCollectRouteHandled(true);
      return;
    }

    if (targetInvoice.status === 'PAID') {
      toast('This invoice is already paid');
      setCollectRouteHandled(true);
      return;
    }

    openPaymentModal(targetInvoice);
    setCollectRouteHandled(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('action');
    params.delete('invoiceId');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/dashboard/invoices?${nextQuery}` : '/dashboard/invoices');
  }, [collectAction, collectInvoiceId, collectRouteHandled, invoices, loading, router, searchParams]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PAID: 'badge-success',
      SENT: 'badge-info',
      PARTIALLY_PAID: 'badge-warning',
      OVERDUE: 'badge-danger',
      DRAFT: 'badge-gray',
      CANCELLED: 'badge-gray',
    };
    return styles[status as keyof typeof styles] || 'badge-gray';
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.balanceAmount.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentForm.amount) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error?.error?.message || error?.message || 'Payment recording failed';
        alert(`Error: ${errorMessage}`);
        return;
      }

      // Refresh invoices
      await fetchInvoices();
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
      });
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailsModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoice.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download invoice');
    }
  };

  const sendSmsReminder = async (invoice: Invoice) => {
    // Check if customer has phone number
    if (!invoice.customer?.phone) {
      toast.error('Customer does not have a phone number on file');
      return;
    }

    // Check if invoice needs a reminder (unpaid or overdue)
    if (invoice.status === 'PAID') {
      toast.error('Invoice is already paid');
      return;
    }

    try {
      setSendingSms(invoice.id);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoice.id}/send-sms-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to send SMS');
      }

      toast.success(`SMS reminder sent to ${invoice.customer.name}`);
    } catch (error) {
      console.error('SMS error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send SMS reminder');
    } finally {
      setSendingSms(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            {customerIdFilter && (
              <div className="flex items-center gap-2">
                <span className="badge badge-info">Customer filter active</span>
                <button
                  onClick={() => setCustomerIdFilter('')}
                  className="text-xs text-primary-700 hover:text-primary-600"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
        </div>
        <div className="w-full">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th className="hidden md:table-cell">Issue Date</th>
                <th className="hidden md:table-cell">Due Date</th>
                <th>Total</th>
                <th className="hidden lg:table-cell">Paid</th>
                <th>Balance</th>
                <th className="hidden sm:table-cell">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="text-xs sm:text-sm font-medium">{invoice.invoiceNumber}</td>
                    <td className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{invoice.customer?.name}</td>
                    <td className="hidden md:table-cell text-xs sm:text-sm">{formatDate(invoice.issueDate)}</td>
                    <td className="hidden md:table-cell text-xs sm:text-sm">{formatDate(invoice.dueDate)}</td>
                    <td className="text-xs sm:text-sm font-semibold">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="hidden lg:table-cell text-xs sm:text-sm">{formatCurrency(invoice.paidAmount)}</td>
                    <td className="text-xs sm:text-sm font-medium">{formatCurrency(invoice.balanceAmount)}</td>
                    <td className="hidden sm:table-cell">
                      <span className={`badge text-xs ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetailsModal(invoice)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
                          title="View Details"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 inline sm:mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => downloadInvoice(invoice)}
                          className="text-purple-600 hover:text-purple-700 font-medium text-xs sm:text-sm"
                          title="Download PDF"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 inline sm:mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="hidden md:inline">Download</span>
                        </button>
                        <Link
                          href={`/dashboard/collections?invoiceId=${invoice.id}`}
                          className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm"
                          title="Collect Payment for this Invoice"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 inline sm:mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                          <span className="hidden md:inline">Collect</span>
                        </Link>
                        {/* SMS Reminder Button - only show for unpaid/overdue invoices with phone */}
                        {invoice.status !== 'PAID' && invoice.customer?.phone && (
                          <button
                            onClick={() => sendSmsReminder(invoice)}
                            disabled={sendingSms === invoice.id}
                            className="text-orange-600 hover:text-orange-700 font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={sendingSms === invoice.id ? 'Sending SMS...' : 'Send SMS Reminder'}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 inline sm:mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                            </svg>
                            <span className="hidden lg:inline">{sendingSms === invoice.id ? 'Sending...' : 'SMS'}</span>
                          </button>
                        )}
                        <a
                          href={`/dashboard/invoices/print/${invoice.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm hidden lg:inline-flex items-center"
                          title="Print Invoice"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 inline sm:mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="hidden lg:inline">Print</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {/* Invoice Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="font-semibold text-blue-900">Invoice Details</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-gray-700">Invoice #:</span> {selectedInvoice.invoiceNumber}</p>
                  <p><span className="font-medium text-gray-700">Customer:</span> {selectedInvoice.customer?.name}</p>
                  <p><span className="font-medium text-gray-700">Due Date:</span> {formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Payment Summary
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Total Invoice Amount</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3 border border-green-200">
                    <p className="text-xs text-green-700 mb-1">Already Paid</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(selectedInvoice.paidAmount)}</p>
                  </div>
                  <div className="bg-orange-50 rounded p-3 border border-orange-200">
                    <p className="text-xs text-orange-700 mb-1">Balance Due</p>
                    <p className="text-lg font-bold text-orange-700">{formatCurrency(selectedInvoice.balanceAmount)}</p>
                  </div>
                  <div className="bg-blue-50 rounded p-3 border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">New Balance After Payment</p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatCurrency(
                        Math.max(0, selectedInvoice.balanceAmount - (parseFloat(paymentForm.amount) || 0))
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Input */}
              <div>
                <label className="label flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payment Amount *
                  {selectedInvoice.balanceAmount > 0 && (
                    <span className="text-xs text-gray-500">(Max: {formatCurrency(selectedInvoice.balanceAmount)})</span>
                  )}
                  {selectedInvoice.balanceAmount === 0 && (
                    <span className="text-xs text-amber-600">(Invoice fully paid - enter refund or adjustment amount)</span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice.balanceAmount > 0 ? selectedInvoice.balanceAmount : undefined}
                    value={paymentForm.amount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (selectedInvoice.balanceAmount > 0 && value > selectedInvoice.balanceAmount) {
                        alert(`Payment amount cannot exceed balance due of ${formatCurrency(selectedInvoice.balanceAmount)}`);
                        setPaymentForm({ ...paymentForm, amount: selectedInvoice.balanceAmount.toString() });
                      } else {
                        setPaymentForm({ ...paymentForm, amount: e.target.value });
                      }
                    }}
                    className="input pl-16 text-lg font-semibold"
                    placeholder="0.00"
                    required
                  />
                </div>
                {parseFloat(paymentForm.amount) > 0 && parseFloat(paymentForm.amount) < selectedInvoice.balanceAmount && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Partial payment - Invoice will remain open with balance of {formatCurrency(selectedInvoice.balanceAmount - parseFloat(paymentForm.amount))}
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="label flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="label flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Method *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: e.target.value,
                    })
                  }
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-outline flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={submitting || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Recording...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Invoice Number</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Status</p>
                  <span className={`inline-block badge ${getStatusBadge(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Customer</h4>
                <p className="text-sm text-gray-700">{selectedInvoice.customer?.name}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Issue Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedInvoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Days</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.floor((new Date(selectedInvoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Financial Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total Amount:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Paid Amount:</span>
                    <span className="font-semibold text-green-700">{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-700 font-semibold">Balance Due:</span>
                    <span className={`font-bold text-lg ${selectedInvoice.balanceAmount > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                      {formatCurrency(selectedInvoice.balanceAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => downloadInvoice(selectedInvoice)}
                  className="flex-1 btn btn-primary"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                {selectedInvoice.status !== 'PAID' && selectedInvoice.customer?.phone && (
                  <button
                    onClick={() => {
                      sendSmsReminder(selectedInvoice);
                      setShowDetailsModal(false);
                    }}
                    disabled={sendingSms === selectedInvoice.id}
                    className="flex-1 btn bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    {sendingSms === selectedInvoice.id ? 'Sending SMS...' : 'Send SMS Reminder'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    router.push(`/dashboard/collections?invoiceId=${selectedInvoice.id}`);
                  }}
                  className="flex-1 btn btn-success"
                >
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  Go to Collection
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
