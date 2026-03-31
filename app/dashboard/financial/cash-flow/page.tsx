'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Forecast = {
  date: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  cumulativeBalance: number;
};

const toDateInput = (date: Date) => date.toISOString().split('T')[0];

export default function CashFlowPage() {
  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(toDateInput(defaultStart));
  const [endDate, setEndDate] = useState(toDateInput(today));
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(value || 0);

  const loadCashFlow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to access cash flow forecasts.');
        setForecasts([]);
        return;
      }

      const res = await fetch(`/api/analytics/cash-flow?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload?.error || 'Failed to load cash flow forecast');
        setForecasts([]);
        return;
      }

      setForecasts(Array.isArray(payload?.data?.forecasts) ? payload.data.forecasts : []);
    } catch (loadError) {
      console.error('Failed to load cash flow forecast:', loadError);
      setError('Failed to load cash flow forecast');
      setForecasts([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void loadCashFlow();
  }, [loadCashFlow]);

  const totals = useMemo(() => {
    const totalInflows = forecasts.reduce((sum, row) => sum + row.inflows, 0);
    const totalOutflows = forecasts.reduce((sum, row) => sum + row.outflows, 0);
    const netFlow = totalInflows - totalOutflows;
    const closingBalance = forecasts.length > 0 ? forecasts[forecasts.length - 1].cumulativeBalance : 0;

    return {
      totalInflows,
      totalOutflows,
      netFlow,
      closingBalance,
    };
  }, [forecasts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Cash Flow Forecast</h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
          <button onClick={() => void loadCashFlow()} className="btn btn-primary">Run Forecast</button>
        </div>
      </div>

      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card"><div className="card-body"><p className="text-xs text-gray-600">Total Inflows</p><p className="text-lg font-semibold text-green-700">{formatCurrency(totals.totalInflows)}</p></div></div>
        <div className="card"><div className="card-body"><p className="text-xs text-gray-600">Total Outflows</p><p className="text-lg font-semibold text-red-700">{formatCurrency(totals.totalOutflows)}</p></div></div>
        <div className="card"><div className="card-body"><p className="text-xs text-gray-600">Net Flow</p><p className={`text-lg font-semibold ${totals.netFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(totals.netFlow)}</p></div></div>
        <div className="card"><div className="card-body"><p className="text-xs text-gray-600">Closing Balance</p><p className="text-lg font-semibold text-blue-700">{formatCurrency(totals.closingBalance)}</p></div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Inflows</th>
              <th>Outflows</th>
              <th>Net Flow</th>
              <th>Cumulative Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading forecast...</td></tr>
            ) : forecasts.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-500">No forecast data found for this period.</td></tr>
            ) : (
              forecasts.map((row) => (
                <tr key={row.date}>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td className="text-green-700">{formatCurrency(row.inflows)}</td>
                  <td className="text-red-700">{formatCurrency(row.outflows)}</td>
                  <td className={row.netFlow >= 0 ? 'text-green-700' : 'text-red-700'}>{formatCurrency(row.netFlow)}</td>
                  <td>{formatCurrency(row.cumulativeBalance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
