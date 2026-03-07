'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, DollarSign, TrendingUp, LineChart, PieChart, AlertCircle, Plus } from 'lucide-react';

interface FinancialSummary {
  accountsCount: number;
  journalEntriesCount: number;
  budgetsCount: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export default function FinancialDashboard() {
  const [summary, setSummary] = useState<FinancialSummary>({
    accountsCount: 0,
    journalEntriesCount: 0,
    budgetsCount: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
  });
  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const [accountsRes, journalRes, budgetsRes] = await Promise.all([
        fetch('/api/financial/chart-of-accounts'),
        fetch('/api/financial/journal-entries'),
        fetch('/api/financial/budgets'),
      ]);

      const accounts = accountsRes.ok ? await accountsRes.json() : { count: 0, data: [] };
      const journals = journalRes.ok ? await journalRes.json() : { total: 0, data: [] };
      const budgets = budgetsRes.ok ? await budgetsRes.json() : { count: 0, data: [] };

      setSummary({
        accountsCount: toSafeNumber(accounts?.count),
        journalEntriesCount: toSafeNumber(journals?.total),
        budgetsCount: toSafeNumber(budgets?.count),
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const modules = [
    {
      title: 'Chart of Accounts',
      description: 'Manage account structure and hierarchy',
      icon: DollarSign,
      href: '/dashboard/financial/chart-of-accounts',
      color: 'from-blue-500 to-blue-600',
      count: summary.accountsCount,
    },
    {
      title: 'Journal Entries',
      description: 'Record and manage manual journal entries',
      icon: BarChart3,
      href: '/dashboard/financial/journal-entries',
      color: 'from-green-500 to-green-600',
      count: summary.journalEntriesCount,
    },
    {
      title: 'General Ledger',
      description: 'View complete ledger transactions',
      icon: LineChart,
      href: '/dashboard/financial/general-ledger',
      color: 'from-purple-500 to-purple-600',
      count: 0,
    },
    {
      title: 'Bank Accounts',
      description: 'Manage multiple bank accounts',
      icon: DollarSign,
      href: '/dashboard/financial/bank-accounts',
      color: 'from-orange-500 to-orange-600',
      count: 0,
    },
    {
      title: 'Budgets',
      description: 'Create and track budgets',
      icon: PieChart,
      href: '/dashboard/financial/budgets',
      color: 'from-pink-500 to-pink-600',
      count: summary.budgetsCount,
    },
    {
      title: 'Cash Flow',
      description: 'Forecast cash position',
      icon: TrendingUp,
      href: '/dashboard/financial/cash-flow',
      color: 'from-indigo-500 to-indigo-600',
      count: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Financial Management</h1>
          <p className="text-gray-600 mt-1">Manage all financial operations and reporting</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Chart of Accounts</p>
              <p className="text-4xl font-bold mt-2">{summary.accountsCount}</p>
              <p className="text-blue-100 text-xs mt-2">Active accounts</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm font-medium">Journal Entries</p>
              <p className="text-4xl font-bold mt-2">{summary.journalEntriesCount}</p>
              <p className="text-green-100 text-xs mt-2">Total entries</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Budgets</p>
              <p className="text-4xl font-bold mt-2">{summary.budgetsCount}</p>
              <p className="text-purple-100 text-xs mt-2">Being tracked</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className={`group bg-gradient-to-br ${module.color} rounded-2xl shadow-lg p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{module.title}</h3>
                  <p className="text-sm opacity-90 mt-1">{module.description}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                <span className="text-sm font-semibold">{module.count} items</span>
                <Plus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/financial/journal-entries"
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center"
          >
            <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">New Journal Entry</p>
          </Link>
          <Link
            href="/dashboard/financial/chart-of-accounts"
            className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center"
          >
            <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">Add Account</p>
          </Link>
          <Link
            href="/dashboard/financial/budgets"
            className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-center"
          >
            <PieChart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">Create Budget</p>
          </Link>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-blue-900">Getting Started</h3>
          <p className="text-sm text-blue-700 mt-1">
            Start by setting up your Chart of Accounts, then create your first budget. Use Journal Entries for manual accounting adjustments.
          </p>
        </div>
      </div>
    </div>
  );
}
