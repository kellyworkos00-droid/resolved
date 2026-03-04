'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Calendar, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Activity,
  FileText,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OverviewData {
  period: { start: string; end: string };
  revenue: number;
  expenses: number;
  supplierPayments: number;
  netIncome: number;
  cashIn: number;
  cashOut: number;
  netCashflow: number;
  arOutstanding: number;
  apOutstanding: number;
}

interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
}

interface AgingData {
  asOf: string;
  ar: AgingBuckets;
  ap: AgingBuckets;
}

const todayIso = () => new Date().toISOString().split('T')[0];
const daysAgoIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export default function ReportsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [aging, setAging] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({
    start: daysAgoIso(29),
    end: todayIso(),
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [overviewRes, agingRes] = await Promise.all([
        fetch(`/api/reports/overview?start=${range.start}&end=${range.end}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/reports/aging?asOf=${range.end}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!overviewRes.ok || !agingRes.ok) {
        throw new Error('Failed to load reports');
      }

      const overviewData = await overviewRes.json();
      const agingData = await agingRes.json();

      setOverview(overviewData.data);
      setAging(agingData.data);
    } catch (error) {
      console.error('Reports error:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const agingRows = useMemo(() => {
    if (!aging) return [];
    return [
      { label: 'Current', ar: aging.ar.current, ap: aging.ap.current },
      { label: '1 - 30 Days', ar: aging.ar.days1to30, ap: aging.ap.days1to30 },
      { label: '31 - 60 Days', ar: aging.ar.days31to60, ap: aging.ap.days31to60 },
      { label: '61 - 90 Days', ar: aging.ar.days61to90, ap: aging.ap.days61to90 },
      { label: '90+ Days', ar: aging.ar.days90plus, ap: aging.ap.days90plus },
    ];
  }, [aging]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!overview || !aging) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load reports
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive overview of your business performance and financial health
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={range.start}
              onChange={(e) => setRange((prev) => ({ ...prev, start: e.target.value }))}
              className="text-sm text-gray-700 outline-none w-32"
            />
            <span className="text-sm text-gray-400 font-medium">to</span>
            <input
              type="date"
              value={range.end}
              onChange={(e) => setRange((prev) => ({ ...prev, end: e.target.value }))}
              className="text-sm text-gray-700 outline-none w-32"
            />
          </div>
          <button
            onClick={fetchReports}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              if (!overview || !aging) return;
              
              // Create CSV content
              let csv = 'Financial Reports Summary\n\n';
              csv += `Period: ${new Date(range.start).toLocaleDateString()} to ${new Date(range.end).toLocaleDateString()}\n\n`;
              
              csv += 'Performance Metrics\n';
              csv += 'Metric,Amount\n';
              csv += `Total Revenue,${formatCurrency(overview.revenue)}\n`;
              csv += `Operating Expenses,${formatCurrency(overview.expenses)}\n`;
              csv += `Supplier Payments,${formatCurrency(overview.supplierPayments)}\n`;
              csv += `Net Income,${formatCurrency(overview.netIncome)}\n\n`;
              
              csv += 'Cashflow Analysis\n';
              csv += `Cash In,${formatCurrency(overview.cashIn)}\n`;
              csv += `Cash Out,${formatCurrency(overview.cashOut)}\n`;
              csv += `Net Cashflow,${formatCurrency(overview.netCashflow)}\n\n`;
              
              csv += 'AR / AP\n';
              csv += `Accounts Receivable,${formatCurrency(overview.arOutstanding)}\n`;
              csv += `Accounts Payable,${formatCurrency(overview.apOutstanding)}\n\n`;
              
              csv += 'Aging Analysis\n';
              csv += 'Aging Bucket,Accounts Receivable,Accounts Payable,Net Position\n';
              agingRows.forEach(row => {
                csv += `${row.label},${formatCurrency(row.ar)},${formatCurrency(row.ap)},${formatCurrency(row.ar - row.ap)}\n`;
              });
              
              // Download CSV
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `financial-reports-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              
              toast.success('Report exported successfully!');
            }}
            className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Performance Metrics - Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90">+12.5%</div>
            </div>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(overview.revenue)}</div>
          <div className="text-green-100 text-sm mt-1">Total Revenue</div>
          <div className="text-xs opacity-75 mt-2">Payments received</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90">-3.2%</div>
            </div>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(overview.expenses)}</div>
          <div className="text-orange-100 text-sm mt-1">Operating Expenses</div>
          <div className="text-xs opacity-75 mt-2">Business costs</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90">On time</div>
            </div>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(overview.supplierPayments)}</div>
          <div className="text-purple-100 text-sm mt-1">Supplier Payments</div>
          <div className="text-xs opacity-75 mt-2">Vendor obligations</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90">
                {overview.netIncome >= 0 ? '+ Profit' : '- Loss'}
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(overview.netIncome)}</div>
          <div className="text-blue-100 text-sm mt-1">Net Income</div>
          <div className="text-xs opacity-75 mt-2">After all expenses</div>
        </div>
      </div>

      {/* Cashflow & AR/AP Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Cashflow Analysis</h2>
                <p className="text-sm text-gray-500">Money movement overview</p>
              </div>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">Cash In</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(overview.cashIn)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-red-700">Cash Out</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(overview.cashOut)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">Net Cashflow</p>
              </div>
              <p className={`text-2xl font-bold ${overview.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(overview.netCashflow)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AR / AP</h2>
                <p className="text-sm text-gray-500">Receivables & Payables</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Accounts Receivable</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(overview.arOutstanding)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Accounts Payable</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(overview.apOutstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AR / AP Aging Analysis */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <LineChart className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AR / AP Aging Analysis</h2>
                <p className="text-sm text-gray-500">Outstanding balances by aging bucket</p>
              </div>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
              As of {new Date(range.end).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aging Bucket
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Accounts Receivable
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Accounts Payable
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Net Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agingRows.map((row, index) => (
                <tr 
                  key={row.label}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        row.label === 'Current' ? 'bg-green-500' :
                        row.label === '1 - 30 Days' ? 'bg-blue-500' :
                        row.label === '31 - 60 Days' ? 'bg-yellow-500' :
                        row.label === '61 - 90 Days' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">{row.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-blue-600">
                      {formatCurrency(row.ar)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-orange-600">
                      {formatCurrency(row.ap)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-semibold ${
                      (row.ar - row.ap) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(row.ar - row.ap)}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                <td className="px-6 py-4 text-right text-sm text-blue-700">
                  {formatCurrency(agingRows.reduce((sum, row) => sum + row.ar, 0))}
                </td>
                <td className="px-6 py-4 text-right text-sm text-orange-700">
                  {formatCurrency(agingRows.reduce((sum, row) => sum + row.ap, 0))}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">
                  {formatCurrency(agingRows.reduce((sum, row) => sum + (row.ar - row.ap), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
