'use client';

import { useEffect, useMemo, useState } from 'react';

type Account = {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  subType?: string;
  isActive: boolean;
};

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to access bank accounts.');
        setAccounts([]);
        return;
      }

      const res = await fetch('/api/financial/chart-of-accounts?type=Asset', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload?.error || 'Failed to load bank accounts');
        setAccounts([]);
        return;
      }

      const allAccounts = Array.isArray(payload?.data) ? payload.data : [];
      const bankLike = allAccounts.filter((acc: Account) => {
        const name = (acc.accountName || '').toLowerCase();
        const subType = (acc.subType || '').toLowerCase();
        return name.includes('bank') || subType.includes('bank') || name.includes('cash');
      });
      setAccounts(bankLike);
    } catch (loadError) {
      console.error('Failed to load bank accounts:', loadError);
      setError('Failed to load bank accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const activeCount = useMemo(() => accounts.filter((a) => a.isActive).length, [accounts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bank Accounts</h1>
        <button onClick={() => void loadAccounts()} className="btn btn-outline">Refresh</button>
      </div>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><div className="card-body"><p className="text-xs text-gray-600">Detected Bank/Cash Accounts</p><p className="text-2xl font-semibold text-gray-900">{accounts.length}</p></div></div>
        <div className="card"><div className="card-body"><p className="text-xs text-gray-600">Active</p><p className="text-2xl font-semibold text-green-700">{activeCount}</p></div></div>
        <div className="card"><div className="card-body"><p className="text-xs text-gray-600">Inactive</p><p className="text-2xl font-semibold text-gray-700">{accounts.length - activeCount}</p></div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-sm">
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Account Name</th>
              <th>Type</th>
              <th>Sub Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading accounts...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-500">No bank or cash accounts found in chart of accounts.</td></tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.accountNumber}</td>
                  <td>{account.accountName}</td>
                  <td>{account.accountType}</td>
                  <td>{account.subType || '—'}</td>
                  <td>
                    <span className={`badge ${account.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
