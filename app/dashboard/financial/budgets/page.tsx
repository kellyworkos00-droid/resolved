'use client';

import { useEffect, useState } from 'react';

type Budget = {
  id: string;
  budgetName: string;
  fiscalYear: number;
  budgetType: string;
  status: string;
  totalBudgetedAmount: number;
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(value || 0);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to access budgets.');
        setBudgets([]);
        return;
      }

      const res = await fetch('/api/financial/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res.ok ? await res.json() : null;
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setBudgets(rows);

      if (!res.ok) {
        setError(payload?.error || 'Failed to load budgets');
      }
    } catch (error) {
      console.error('Failed to load budgets:', error);
      setError('Failed to load budgets');
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBudgets();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button onClick={() => void loadBudgets()} className="btn btn-outline">Refresh</button>
      </div>
      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-600">Loading budgets...</p>
      ) : budgets.length === 0 ? (
        <p className="text-gray-600">No budgets found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Fiscal Year</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => (
                <tr key={budget.id} className="border-t">
                  <td className="px-4 py-2">{budget.budgetName}</td>
                  <td className="px-4 py-2">{budget.fiscalYear}</td>
                  <td className="px-4 py-2">{budget.budgetType}</td>
                  <td className="px-4 py-2">{budget.status}</td>
                  <td className="px-4 py-2">{formatCurrency(budget.totalBudgetedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
