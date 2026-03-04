'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfitLossData {
  period: string;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  taxExpense: number;
  netIncome: number;
  netProfitMargin: number;
  breakdown: {
    sales: number;
    serviceIncome: number;
    costOfSales: number;
    salaries: number;
    utilities: number;
    depreciation: number;
    otherExpenses: number;
  };
}

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  const fetchProfitLoss = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/profit-loss?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching P&L data:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchProfitLoss();
  }, [fetchProfitLoss]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Statement</h1>
          <p className="text-gray-600 mt-1">Comprehensive income statement and profitability analysis</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="monthly">This Month</option>
            <option value="quarterly">This Quarter</option>
            <option value="yearly">This Year</option>
          </select>
          <button 
            onClick={() => {
              if (!data) return;
              
              let csv = `Profit & Loss Statement - ${data.period}\n\n`;
              csv += 'Account,Amount\n';
              csv += '\nREVENUES\n';
              csv += `Sales Revenue,${data.breakdown.sales}\n`;
              csv += `Service Income,${data.breakdown.serviceIncome}\n`;
              csv += `Total Revenue,${data.revenue}\n`;
              csv += '\nCOST OF GOODS SOLD\n';
              csv += `Cost of Sales,${data.breakdown.costOfSales}\n`;
              csv += `Total COGS,${data.costOfGoods}\n`;
              csv += `\nGross Profit,${data.grossProfit}\n`;
              csv += `Gross Profit Margin,${data.grossProfitMargin.toFixed(2)}%\n`;
              csv += '\nOPERATING EXPENSES\n';
              csv += `Salaries,${data.breakdown.salaries}\n`;
              csv += `Utilities,${data.breakdown.utilities}\n`;
              csv += `Depreciation,${data.breakdown.depreciation}\n`;
              csv += `Other Expenses,${data.breakdown.otherExpenses}\n`;
              csv += `Total Operating Expenses,${data.operatingExpenses}\n`;
              csv += `\nOperating Income,${data.operatingIncome}\n`;
              csv += `Interest Expense,${data.interestExpense}\n`;
              csv += `Tax Expense,${data.taxExpense}\n`;
              csv += `\nNet Income,${data.netIncome}\n`;
              csv += `Net Profit Margin,${data.netProfitMargin.toFixed(2)}%\n`;
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `profit-loss-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              
              toast.success('P&L statement exported successfully!');
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards - Gradient Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-xs opacity-90">+12.5%</div>
          </div>
          <div className="text-3xl font-bold">
            KES {((data?.revenue || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-green-100 text-sm mt-1">Total Revenue</div>
          <div className="text-xs opacity-75 mt-2">All income sources</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="text-xs opacity-90">-5.3%</div>
          </div>
          <div className="text-3xl font-bold">
            KES {((data?.operatingExpenses || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-red-100 text-sm mt-1">Operating Expenses</div>
          <div className="text-xs opacity-75 mt-2">Business costs</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-xs opacity-90">{(data?.grossProfitMargin || 0).toFixed(1)}%</div>
          </div>
          <div className="text-3xl font-bold">
            KES {((data?.grossProfit || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-blue-100 text-sm mt-1">Gross Profit</div>
          <div className="text-xs opacity-75 mt-2">After COGS</div>
        </div>

        <div className={`bg-gradient-to-br ${(data?.netIncome || 0) >= 0 ? 'from-purple-500 to-purple-700' : 'from-orange-500 to-orange-700'} rounded-lg shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-xs opacity-90">{(data?.netProfitMargin || 0).toFixed(1)}%</div>
          </div>
          <div className="text-3xl font-bold">
            KES {((data?.netIncome || 0) / 1000000).toFixed(1)}M
          </div>
          <div className={`${(data?.netIncome || 0) >= 0 ? 'text-purple-100' : 'text-orange-100'} text-sm mt-1`}>
            Net Income
          </div>
          <div className="text-xs opacity-75 mt-2">Final profit/loss</div>
        </div>
      </div>

      {/* P&L Statement Table */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Income Statement</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
            Period: {data?.period || 'Current'}
          </span>
        </div>
        <div className="space-y-2">
          {/* Revenue Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>REVENUES</span>
              <span>KES {(data?.revenue || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="ml-4 space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Sales Revenue</span>
              <span>KES {(data?.breakdown.sales || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Service Income</span>
              <span>KES {(data?.breakdown.serviceIncome || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Cost of Goods Section */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>COST OF GOODS SOLD</span>
              <span>KES {(data?.costOfGoods || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="ml-4 mb-4">
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Cost of Sales</span>
              <span>KES {(data?.breakdown.costOfSales || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-green-100 border-l-4 border-green-600 p-3 rounded">
            <div className="flex justify-between items-center font-bold text-gray-900">
              <span>GROSS PROFIT</span>
              <span>KES {(data?.grossProfit || 0).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">({(data?.grossProfitMargin || 0).toFixed(1)}%)</p>
          </div>

          {/* Operating Expenses Section */}
          <div className="mt-6 bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
            <div className="flex justify-between items-center font-semibold text-gray-900">
              <span>OPERATING EXPENSES</span>
              <span>KES {(data?.operatingExpenses || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="ml-4 space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Salaries & Wages</span>
              <span>KES {(data?.breakdown.salaries || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Utilities</span>
              <span>KES {(data?.breakdown.utilities || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Depreciation</span>
              <span>KES {(data?.breakdown.depreciation || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Other Expenses</span>
              <span>KES {(data?.breakdown.otherExpenses || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Operating Income */}
          <div className="bg-blue-100 border-l-4 border-blue-600 p-3 rounded">
            <div className="flex justify-between items-center font-bold text-gray-900">
              <span>OPERATING INCOME</span>
              <span>KES {(data?.operatingIncome || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Other Expenses */}
          <div className="mt-6 ml-4 space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Interest Expense</span>
              <span>- KES {(data?.interestExpense || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Tax Expense</span>
              <span>- KES {(data?.taxExpense || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Net Income */}
          <div className={`${(data?.netIncome || 0) >= 0 ? 'bg-green-100 border-green-600' : 'bg-red-100 border-red-600'} border-l-4 p-3 rounded`}>
            <div className="flex justify-between items-center font-bold text-gray-900 text-lg">
              <span>NET INCOME</span>
              <span>KES {(data?.netIncome || 0).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Net Profit Margin: {(data?.netProfitMargin || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Year over Year Comparison */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Period Comparison</h2>
        <p className="text-gray-600 text-center py-8">Comparative analysis with previous periods will display here</p>
      </div>
    </div>
  );
}
