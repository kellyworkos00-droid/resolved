'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  balanceAmount: number;
}

interface CreditNoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  productId?: string;
  sku?: string;
  notes?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  invoiceId?: string;
  creditNoteType: string;
  reason: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  appliedAmount: number;
  remainingAmount: number;
  issueDate: string;
  approvedDate?: string;
  appliedDate?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  customer: Customer;
  invoice?: Invoice;
  createdByUser: User;
  approvedByUser?: User;
  items: CreditNoteItem[];
}

interface Summary {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  applied: number;
  cancelled: number;
  totalAmount: number;
  totalApplied: number;
  totalRemaining: number;
}

interface FormItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  productId?: string;
  sku?: string;
  notes?: string;
}

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [creditNoteType, setCreditNoteType] = useState<string>('REFUND');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([{
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 16,
    productId: '',
    sku: '',
    notes: '',
  }]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('creditNoteType', typeFilter);
      if (customerFilter) params.append('customerId', customerFilter);

      const [creditNotesRes, customersRes] = await Promise.all([
        fetch(`/api/credit-notes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/customers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!creditNotesRes.ok || !customersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const creditNotesData = await creditNotesRes.json();
      const customersData = await customersRes.json();

      setCreditNotes(creditNotesData.data.creditNotes || []);
      setSummary(creditNotesData.data.summary);
      setCustomers(customersData.data?.customers || []);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, customerFilter]);

  const fetchInvoices = useCallback(async (custId: string) => {
    if (!custId) {
      setInvoices([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices?customerId=${custId}&all=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data?.invoices || []);
      }
    } catch (error) {
      console.error('Fetch invoices error:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (customerId) {
      fetchInvoices(customerId);
    }
  }, [customerId, fetchInvoices]);

  const handleFilter = () => {
    fetchData();
  };

  const addItem = () => {
    setItems((prev) => [...prev, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 16,
      productId: '',
      sku: '',
      notes: '',
    }]);
  };

  const updateItem = (index: number, updates: Partial<FormItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreate = async () => {
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    const preparedItems = items.filter((item) => item.description && item.quantity > 0);
    if (preparedItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId,
          invoiceId: invoiceId || undefined,
          creditNoteType,
          reason,
          notes: notes || undefined,
          internalNotes: internalNotes || undefined,
          items: preparedItems,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to create credit note');
      }

      setShowCreate(false);
      setCustomerId('');
      setInvoiceId('');
      setCreditNoteType('REFUND');
      setReason('');
      setNotes('');
      setInternalNotes('');
      setItems([{
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 16,
        productId: '',
        sku: '',
        notes: '',
      }]);
      toast.success('Credit note created successfully');
      fetchData();
    } catch (error) {
      console.error('Create credit note error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create credit note');
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (creditNoteId: string, action: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/credit-notes/${creditNoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `Failed to ${action.toLowerCase()} credit note`);
      }

      toast.success(`Credit note ${action.toLowerCase()}d successfully`);
      fetchData();
    } catch (error) {
      console.error('Credit note action error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update credit note');
    }
  };

  const statusStyles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    APPLIED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const typeLabels: Record<string, string> = {
    REFUND: 'Refund',
    RETURN: 'Return',
    ADJUSTMENT: 'Adjustment',
    DISCOUNT: 'Discount',
    DAMAGED: 'Damaged',
    ERROR_CORRECTION: 'Error Correction',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Credit Notes</h1>
          <p className="text-sm text-gray-600">Manage customer credit notes and refunds</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Credit Note
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credit Notes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{summary?.pending || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applied</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{summary?.applied || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining Credit</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                KES {(summary?.totalRemaining || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="APPLIED">Applied</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="REFUND">Refund</option>
              <option value="RETURN">Return</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="DISCOUNT">Discount</option>
              <option value="DAMAGED">Damaged</option>
              <option value="ERROR_CORRECTION">Error Correction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Credit Notes Table */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Notes List</h2>
        {creditNotes.length === 0 ? (
          <p className="text-gray-600 text-center py-12">No credit notes found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-4">Credit Note #</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Applied</th>
                  <th className="py-2 pr-4">Remaining</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.map((creditNote) => (
                  <tr key={creditNote.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{creditNote.creditNoteNumber}</td>
                    <td className="py-3 pr-4 text-gray-700">{creditNote.customer.name}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {typeLabels[creditNote.creditNoteType]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 max-w-xs truncate">{creditNote.reason}</td>
                    <td className="py-3 pr-4 text-gray-900 font-medium">
                      KES {creditNote.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      KES {creditNote.appliedAmount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-green-700 font-medium">
                      KES {creditNote.remainingAmount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[creditNote.status]}`}>
                        {creditNote.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {new Date(creditNote.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {(creditNote.status === 'DRAFT' || creditNote.status === 'PENDING') && (
                          <button
                            onClick={() => handleAction(creditNote.id, 'APPROVE')}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Approve
                          </button>
                        )}
                        {(creditNote.status === 'DRAFT' || creditNote.status === 'PENDING') && (
                          <button
                            onClick={() => handleAction(creditNote.id, 'CANCEL')}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        )}
                        {['APPLIED', 'CANCELLED'].includes(creditNote.status) && (
                          <span className="text-xs text-gray-500">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Credit Note Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Credit Note</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Related Invoice</label>
                  <select
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    disabled={!customerId}
                  >
                    <option value="">No invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - KES {invoice.balanceAmount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Note Type *</label>
                  <select
                    value={creditNoteType}
                    onChange={(e) => setCreditNoteType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="REFUND">Refund</option>
                    <option value="RETURN">Return</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="ERROR_CORRECTION">Error Correction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Reason for credit note..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Notes visible to customer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Internal notes (not visible to customer)..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <button
                    onClick={addItem}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-6 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Description *</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, { description: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Item description"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Tax Rate (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.taxRate}
                            onChange={(e) => updateItem(index, { taxRate: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => removeItem(index)}
                            className="w-full px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            disabled={items.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Credit Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
