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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/financial/budgets');
        const payload = res.ok ? await res.json() : null;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setBudgets(rows);
      } catch (error) {
        console.error('Failed to load budgets:', error);
        setBudgets([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Budgets</h1>
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
                  <td className="px-4 py-2">{budget.totalBudgetedAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
