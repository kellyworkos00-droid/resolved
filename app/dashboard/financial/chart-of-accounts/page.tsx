'use client';

import { useEffect, useState } from 'react';

type Account = {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  subType?: string;
  description?: string;
  isActive: boolean;
  parentAccountId?: string | null;
  childAccounts?: { id: string; accountName: string }[];
};

const ACCOUNT_TYPES = [
  'Asset',
  'Liability',
  'Equity',
  'Revenue',
  'Expense',
];

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [groupByType, setGroupByType] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    accountType: 'Asset',
    subType: '',
    description: '',
    parentAccountId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/financial/chart-of-accounts');
      const payload = res.ok ? await res.json() : null;
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setAccounts(rows);
      setFilteredAccounts(rows);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setAccounts([]);
      setFilteredAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    let filtered = accounts;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.accountNumber.toLowerCase().includes(term) ||
          acc.accountName.toLowerCase().includes(term) ||
          (acc.description && acc.description.toLowerCase().includes(term))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((acc) => acc.accountType === filterType);
    }

    setFilteredAccounts(filtered);
  }, [searchTerm, filterType, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/financial/chart-of-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentAccountId: formData.parentAccountId || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Account created successfully!' });
        setFormData({
          accountNumber: '',
          accountName: '',
          accountType: 'Asset',
          subType: '',
          description: '',
          parentAccountId: '',
        });
        setShowForm(false);
        await loadAccounts();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create account' });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const groupedAccounts = groupByType
    ? ACCOUNT_TYPES.reduce((acc, type) => {
        acc[type] = filteredAccounts.filter((account) => account.accountType === type);
        return acc;
      }, {} as Record<string, Account[]>)
    : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your organization's account structure
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Account Form */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Cash"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <select
                  required
                  value={formData.accountType}
                  onChange={(e) =>
                    setFormData({ ...formData, accountType: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub Type
                </label>
                <input
                  type="text"
                  value={formData.subType}
                  onChange={(e) =>
                    setFormData({ ...formData, subType: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Current Asset"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Account
                </label>
                <select
                  value={formData.parentAccountId}
                  onChange={(e) =>
                    setFormData({ ...formData, parentAccountId: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">None (Top Level)</option>
                  {accounts
                    .filter((acc) => acc.accountType === formData.accountType)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} - {acc.accountName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accounts..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display</label>
            <button
              onClick={() => setGroupByType(!groupByType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              {groupByType ? '📊 Grouped by Type' : '📋 Flat List'}
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading accounts...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-600">No accounts found.</p>
        </div>
      ) : groupByType && groupedAccounts ? (
        <div className="space-y-4">
          {ACCOUNT_TYPES.map((type) => {
            const typeAccounts = groupedAccounts[type];
            if (!typeAccounts || typeAccounts.length === 0) return null;

            return (
              <div key={type} className="rounded-lg border bg-white shadow-sm">
                <div className="border-b bg-gray-50 px-6 py-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {type} ({typeAccounts.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-gray-700">Number</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-700">Sub Type</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-700">Sub-Accounts</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeAccounts.map((account) => (
                        <tr key={account.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium">{account.accountNumber}</td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{account.accountName}</div>
                              {account.description && (
                                <div className="text-xs text-gray-500 mt-1">{account.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{account.subType || '—'}</td>
                          <td className="px-6 py-4">
                            {account.childAccounts && account.childAccounts.length > 0 ? (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {account.childAccounts.length} sub-account{account.childAccounts.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                account.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {account.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Number</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Sub Type</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Sub-Accounts</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{account.accountNumber}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{account.accountName}</div>
                        {account.description && (
                          <div className="text-xs text-gray-500 mt-1">{account.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{account.accountType}</td>
                    <td className="px-6 py-4 text-gray-600">{account.subType || '—'}</td>
                    <td className="px-6 py-4">
                      {account.childAccounts && account.childAccounts.length > 0 ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {account.childAccounts.length} sub-account{account.childAccounts.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total Accounts: <span className="font-semibold text-gray-900">{accounts.length}</span>
          </span>
          <span className="text-gray-600">
            Displayed: <span className="font-semibold text-gray-900">{filteredAccounts.length}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
