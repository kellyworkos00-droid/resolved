'use client';

import { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Settings,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  assetsValue: number;
  liabilities: number;
  equity: number;
  debtToEquityRatio: number;
  returnOnAssets: number;
}

export default function FinancialAnalysisPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/reports/financial-metrics?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Error fetching financial metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [period]);

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
          <h1 className="text-3xl font-bold text-gray-900">Financial Analysis</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial metrics and performance indicators</p>
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
            <option value="all">All Time</option>
          </select>
          <button
            onClick={() => {
              if (!metrics) return;
              
              let csv = `Financial Analysis Report - ${period}\n\n`;
              csv += 'Income Statement\n';
              csv += 'Metric,Amount\n';
              csv += `Total Revenue,${metrics.totalRevenue}\n`;
              csv += `Total Expenses,${metrics.totalExpenses}\n`;
              csv += `Net Profit,${metrics.netProfit}\n`;
              csv += `Profit Margin,${metrics.profitMargin.toFixed(2)}%\n`;
              csv += '\nBalance Sheet\n';
              csv += `Total Assets,${metrics.assetsValue}\n`;
              csv += `Total Liabilities,${metrics.liabilities}\n`;
              csv += `Shareholders Equity,${metrics.equity}\n`;
              csv += '\nKey Ratios\n';
              csv += `Debt to Equity Ratio,${metrics.debtToEquityRatio.toFixed(2)}\n`;
              csv += `Return on Assets,${metrics.returnOnAssets.toFixed(2)}%\n`;
              csv += `Working Capital,${(metrics.assetsValue - metrics.liabilities)}\n`;
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `financial-analysis-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              
              toast.success('Financial analysis exported successfully!');
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Income Statement - Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-xs opacity-90">+15.3%</div>
          </div>
          <div className="text-3xl font-bold">
            KES {((metrics?.totalRevenue || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-green-100 text-sm mt-1">Total Revenue</div>
          <div className="text-xs opacity-75 mt-2">All income sources</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="text-xs opacity-90">-4.1%</div>
          </div>
          <div className="text-3xl font-bold">
            KES {((metrics?.totalExpenses || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-red-100 text-sm mt-1">Total Expenses</div>
          <div className="text-xs opacity-75 mt-2">All operating costs</div>
        </div>

        <div className={`bg-gradient-to-br ${(metrics?.netProfit || 0) >= 0 ? 'from-blue-500 to-blue-700' : 'from-orange-500 to-orange-700'} rounded-lg shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-xs opacity-90">{(metrics?.profitMargin || 0).toFixed(1)}%</div>
          </div>
          <div className="text-3xl font-bold">
            KES {((metrics?.netProfit || 0) / 1000000).toFixed(1)}M
          </div>
          <div className={`${(metrics?.netProfit || 0) >= 0 ? 'text-blue-100' : 'text-orange-100'} text-sm mt-1`}>
            Net Profit
          </div>
          <div className="text-xs opacity-75 mt-2">Bottom line</div>
        </div>
      </div>

      {/* Financial Ratios */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Financial Ratios & Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Profit Margin</p>
            <p className="text-3xl font-bold text-primary-600">{(metrics?.profitMargin || 0).toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Net profit / Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Debt to Equity</p>
            <p className="text-3xl font-bold text-blue-600">{(metrics?.debtToEquityRatio || 0).toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Liabilities / Equity</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Return on Assets</p>
            <p className="text-3xl font-bold text-green-600">{(metrics?.returnOnAssets || 0).toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Net income / Total assets</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Working Capital</p>
            <p className="text-3xl font-bold text-purple-600">
              KES {((metrics?.assetsValue || 0) - (metrics?.liabilities || 0)).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Assets - Liabilities</p>
          </div>
        </div>
      </div>

      {/* Balance Sheet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            KES {(metrics?.assetsValue || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total company assets</p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Liabilities</h3>
          <p className="text-3xl font-bold text-red-600 mb-2">
            KES {(metrics?.liabilities || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total company liabilities</p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equity</h3>
          <p className="text-3xl font-bold text-green-600 mb-2">
            KES {(metrics?.equity || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Shareholder equity</p>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Analysis</h2>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors text-sm">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600 text-center py-8">
            Detailed financial analysis, trend charts, and comparative reports will display here
          </p>
        </div>
      </div>
    </div>
  );
}
