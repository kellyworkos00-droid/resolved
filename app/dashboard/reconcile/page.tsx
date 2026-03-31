'use client';

import { useCallback, useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Calendar,
  RefreshCw,
  FileText,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface PaymentPreview {
  customer?: { name?: string | null } | null;
}

interface BankTransaction {
  id: string;
  bankTransactionId: string;
  transactionDate: string;
  amount: number;
  reference: string;
  status: string;
  payments?: PaymentPreview[];
}

interface Customer {
  id: string;
  customerCode: string;
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  balanceAmount: number;
}

export default function ReconcilePage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [matching, setMatching] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    pending: 0,
    unmatched: 0,
    totalAmount: 0,
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);


  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/reconciliation/transactions?limit=100';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      const txns = data.data.transactions;
      setTransactions(txns);

      // Calculate stats
      const matched = txns.filter((t: BankTransaction) => t.status === 'MATCHED').length;
      const pending = txns.filter((t: BankTransaction) => t.status === 'PENDING').length;
      const unmatched = txns.filter((t: BankTransaction) => t.status === 'UNMATCHED').length;
      const totalAmount = txns.reduce((sum: number, t: BankTransaction) => sum + t.amount, 0);

      setStats({
        total: txns.length,
        matched,
        pending,
        unmatched,
        totalAmount,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate]);

  const fetchCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch customers');

      const data = await response.json();
      setCustomers(data.data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
  }, [fetchCustomers, fetchTransactions]);

  const fetchCustomerInvoices = async (customerId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices?customerId=${customerId}&status=SENT&all=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();
      setInvoices(data.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleAutoMatch = async () => {
    if (!confirm('Run automatic matching for all pending transactions?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reconciliation/auto-match', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Auto-match failed');

      const data = await response.json();
      showNotification('success', `Auto-match completed: ${data.data.matched} matched, ${data.data.unmatched} unmatched`);
      fetchTransactions();
    } catch (error) {
      showNotification('error', 'Auto-match failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (!selectedTransaction || !selectedCustomer) {
      showNotification('error', 'Please select a customer');
      return;
    }

    setMatching(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reconciliation/manual-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bankTransactionId: selectedTransaction.id,
          customerId: selectedCustomer,
          invoiceId: selectedInvoice || undefined,
          amount: selectedTransaction.amount,
        }),
      });

      if (!response.ok) throw new Error('Manual match failed');

      showNotification('success', 'Transaction matched successfully!');
      setSelectedTransaction(null);
      setSelectedCustomer('');
      setSelectedInvoice('');
      setInvoices([]);
      fetchTransactions();
    } catch (error) {
      showNotification('error', 'Match failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setMatching(false);
    }
  };

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
      MATCHED: 'badge-success',
      PENDING: 'badge-warning',
      UNMATCHED: 'badge-danger',
      PARTIALLY_MATCHED: 'badge-info',
      REJECTED: 'badge-gray',
    };
    return styles[status as keyof typeof styles] || 'badge-gray';
  };

  const filteredTransactions = transactions.filter((txn) =>
    txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.bankTransactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-gray-600 mt-1">Match bank transactions with customer payments</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/reconcile/upload"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Upload Statement
          </Link>
          <button
            onClick={() => fetchTransactions()}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-blue-100 text-sm mt-1">Total Transactions</div>
          <div className="text-xs text-blue-200 mt-2">
            {formatCurrency(stats.totalAmount)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.matched}</div>
          <div className="text-green-100 text-sm mt-1">Matched</div>
          <div className="text-xs text-green-200 mt-2">
            {stats.total > 0 ? Math.round((stats.matched / stats.total) * 100) : 0}% Complete
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.pending}</div>
          <div className="text-yellow-100 text-sm mt-1">Pending</div>
          <div className="text-xs text-yellow-200 mt-2">
            Awaiting matching
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.unmatched}</div>
          <div className="text-red-100 text-sm mt-1">Unmatched</div>
          <div className="text-xs text-red-200 mt-2">
            Needs attention
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-8 h-8 opacity-80" />
          </div>
          <div>
            <button 
              onClick={handleAutoMatch}
              disabled={loading || stats.pending === 0}
              className="w-full text-left"
            >
              <div className="text-2xl font-bold">Auto-Match</div>
              <div className="text-purple-100 text-sm mt-1">Quick Action</div>
              <div className="text-xs text-purple-200 mt-2">
                {stats.pending} items ready
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="MATCHED">Matched</option>
              <option value="UNMATCHED">Unmatched</option>
            </select>
          </div>

          <div>
            <label className="label">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <label className="label">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              setStatusFilter('');
              setSearchTerm('');
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
          <button
            onClick={() => {
              // Export functionality placeholder
              showNotification('success', 'Export feature coming soon!');
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Results
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredTransactions.length}</span> of <span className="font-semibold">{stats.total}</span> transactions
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStatusFilter('PENDING')}
                className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
              >
                Show Pending ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter('UNMATCHED')}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                Show Unmatched ({stats.unmatched})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Bank Transactions</h2>
            {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-gray-500 px-3 py-1.5 bg-gray-100 rounded-lg">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No transactions found</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || statusFilter ? 'Try changing your filters' : 'Upload a bank statement to get started'}
              </p>
              {!searchTerm && !statusFilter && (
                <Link
                  href="/dashboard/reconcile/upload"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Upload Statement
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Transaction ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Reference</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((txn, index) => (
                  <tr 
                    key={txn.id}
                    className={`hover:bg-primary-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {formatDate(txn.transactionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {txn.bankTransactionId}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="truncate text-gray-900" title={txn.reference}>
                        {txn.reference}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${getStatusBadge(txn.status)} inline-flex items-center gap-1 justify-center`}>
                        {txn.status === 'MATCHED' && <CheckCircle className="w-3 h-3" />}
                        {txn.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {txn.status === 'UNMATCHED' && <AlertCircle className="w-3 h-3" />}
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {txn.payments?.[0]?.customer?.name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-700 font-medium">
                              {txn.payments[0].customer.name.charAt(0)}
                            </span>
                          </div>
                          <span className="truncate max-w-[150px]">
                            {txn.payments[0].customer.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {txn.status === 'PENDING' || txn.status === 'UNMATCHED' ? (
                        <button
                          onClick={() => setSelectedTransaction(txn)}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium"
                        >
                          Match
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Match Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Manual Match Transaction</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Date:</p>
                    <p className="font-medium">{formatDate(selectedTransaction.transactionDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount:</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Reference:</p>
                    <p className="font-medium">{selectedTransaction.reference}</p>
                  </div>
                </div>
              </div>

              {/* Customer Selection */}
              <div>
                <label className="label">Select Customer *</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setSelectedInvoice('');
                    if (e.target.value) {
                      fetchCustomerInvoices(e.target.value);
                    } else {
                      setInvoices([]);
                    }
                  }}
                  className="input"
                >
                  <option value="">Choose customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerCode} - {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Selection */}
              {selectedCustomer && (
                <div>
                  <label className="label">Select Invoice (Optional)</label>
                  <select
                    value={selectedInvoice}
                    onChange={(e) => setSelectedInvoice(e.target.value)}
                    className="input"
                  >
                    <option value="">No specific invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {formatCurrency(invoice.balanceAmount)} outstanding
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedTransaction(null);
                  setSelectedCustomer('');
                  setSelectedInvoice('');
                  setInvoices([]);
                }}
                className="btn-secondary"
                disabled={matching}
              >
                Cancel
              </button>
              <button
                onClick={handleManualMatch}
                className="btn-primary"
                disabled={matching || !selectedCustomer}
              >
                {matching ? 'Matching...' : 'Confirm Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
