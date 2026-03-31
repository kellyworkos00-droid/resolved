'use client';

import { useEffect, useState } from 'react';

type LedgerEntry = {
  id: string;
  entryDate: string;
  account?: { accountNumber?: string; accountName?: string };
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
};

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(value || 0);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to access ledger entries.');
        setEntries([]);
        return;
      }

      const res = await fetch('/api/financial/general-ledger?limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res.ok ? await res.json() : null;
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setEntries(rows);

      if (!res.ok) {
        setError(payload?.error || 'Failed to load ledger entries');
      }
    } catch (error) {
      console.error('Failed to load ledger entries:', error);
      setError('Failed to load ledger entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">General Ledger</h1>
        <button onClick={() => void loadEntries()} className="btn btn-outline">Refresh</button>
      </div>
      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-600">Loading ledger entries...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-600">No ledger entries found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Debit</th>
                <th className="px-4 py-2 text-left">Credit</th>
                <th className="px-4 py-2 text-left">Balance</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-2">{new Date(entry.entryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{entry.account?.accountNumber} - {entry.account?.accountName}</td>
                  <td className="px-4 py-2">{entry.description}</td>
                  <td className="px-4 py-2">{formatCurrency(entry.debitAmount)}</td>
                  <td className="px-4 py-2">{formatCurrency(entry.creditAmount)}</td>
                  <td className="px-4 py-2">{formatCurrency(entry.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
