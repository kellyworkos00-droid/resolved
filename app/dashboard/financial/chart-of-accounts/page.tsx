'use client';

import { useEffect, useState } from 'react';

type Account = {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  isActive: boolean;
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/financial/chart-of-accounts');
        const payload = res.ok ? await res.json() : null;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setAccounts(rows);
      } catch (error) {
        console.error('Failed to load accounts:', error);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Chart of Accounts</h1>
      {loading ? (
        <p className="text-gray-600">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <p className="text-gray-600">No accounts found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Number</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t">
                  <td className="px-4 py-2">{account.accountNumber}</td>
                  <td className="px-4 py-2">{account.accountName}</td>
                  <td className="px-4 py-2">{account.accountType}</td>
                  <td className="px-4 py-2">{account.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
