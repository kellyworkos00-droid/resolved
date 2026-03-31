'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  Package,
  Users,
  ArrowRight,
  BarChart3,
  Building2,
  FileText,
  ShoppingCart,
  Wallet,
  TrendingDown,
  Activity,
} from 'lucide-react';

interface RecentTransaction {
  id: string;
  reference: string;
  transactionDate: string;
  amount: number;
  status: string;
}

interface TopCustomer {
  customer?: { id: string; name: string } | null;
  totalPaid: number;
  paymentsCount: number;
}

interface DueInvoice {
  id: string;
  invoiceNumber: string;
  customer: { id: string; name: string; email: string; phone: string };
  totalAmount: number;
  balanceAmount: number;
  paidAmount: number;
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  status: string;
  priority: 'urgent' | 'high' | 'medium' | 'normal';
}

interface DueInvoicesSummary {
  total: number;
  overdue: number;
  dueSoon: number;
  totalAmount: number;
  overdueAmount: number;
}

interface IntegrationSummary {
  financialHealth: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfit: number;
    profitMargin: number;
    cashOnHand: number;
    accountsReceivable: number;
    accountsPayable: number;
  };
  unpaidInvoices: {
    total: number;
    totalAmount: number;
    overdue: number;
    overdueAmount: number;
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
  };
  operations: {
    employeeCount: number;
    monthlyPayroll: number;
    activeProjects: number;
    fixedAssetsValue: number;
  };
  alerts: Array<{
    id: number;
    severity: 'high' | 'medium' | 'low';
    message: string;
    actionHref: string;
  }>;
}

interface DashboardData {
  summary: {
    totalCollectedThisMonth: number;
    outstandingBalance: number;
    pendingTransactions: number;
    unmatchedTransactions: number;
    matchedTransactions: number;
  };
  recentTransactions: RecentTransaction[];
  topCustomers: TopCustomer[];
}

const emptyDashboardData: DashboardData = {
  summary: {
    totalCollectedThisMonth: 0,
    outstandingBalance: 0,
    pendingTransactions: 0,
    unmatchedTransactions: 0,
    matchedTransactions: 0,
  },
  recentTransactions: [],
  topCustomers: [],
};

const emptyIntegrationSummary: IntegrationSummary = {
  financialHealth: {
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
    profitMargin: 0,
    cashOnHand: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
  },
  unpaidInvoices: {
    total: 0,
    totalAmount: 0,
    overdue: 0,
    overdueAmount: 0,
  },
  inventory: {
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
  },
  operations: {
    employeeCount: 0,
    monthlyPayroll: 0,
    activeProjects: 0,
    fixedAssetsValue: 0,
  },
  alerts: [],
};

function normalizeIntegrationSummary(raw: unknown): IntegrationSummary {
  if (!raw || typeof raw !== 'object') {
    return emptyIntegrationSummary;
  }

  const source = raw as Record<string, unknown>;
  const financialHealth = (source.financialHealth as Record<string, unknown>) || {};
  const unpaidInvoices = (source.unpaidInvoices as Record<string, unknown>) || {};
  const inventory = (source.inventory as Record<string, unknown>) || {};
  const operations = (source.operations as Record<string, unknown>) || {};
  const alerts = Array.isArray(source.alerts) ? source.alerts : [];

  const monthlyExpenses = Number(financialHealth.monthlyExpenses) || 0;
  const accountsReceivable = Number(financialHealth.accountsReceivable) || 0;

  return {
    financialHealth: {
      monthlyRevenue: Number(financialHealth.monthlyRevenue) || 0,
      monthlyExpenses,
      monthlyProfit: Number(financialHealth.monthlyProfit) || 0,
      profitMargin: Number(financialHealth.profitMargin) || 0,
      cashOnHand: Number(financialHealth.cashOnHand) || 0,
      accountsReceivable,
      accountsPayable: Number(financialHealth.accountsPayable) || 0,
    },
    unpaidInvoices: {
      total: Number(unpaidInvoices.total) || 0,
      totalAmount: Number(unpaidInvoices.totalAmount) || accountsReceivable,
      overdue: Number(unpaidInvoices.overdue) || 0,
      overdueAmount: Number(unpaidInvoices.overdueAmount) || 0,
    },
    inventory: {
      totalItems: Number(inventory.totalItems) || 0,
      totalValue: Number(inventory.totalValue) || 0,
      lowStockItems: Number(inventory.lowStockItems) || 0,
    },
    operations: {
      employeeCount: Number(operations.employeeCount) || 0,
      monthlyPayroll: Number(operations.monthlyPayroll) || monthlyExpenses,
      activeProjects: Number(operations.activeProjects) || 0,
      fixedAssetsValue: Number(operations.fixedAssetsValue) || 0,
    },
    alerts: alerts as IntegrationSummary['alerts'],
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(emptyDashboardData);
  const [integrationSummary, setIntegrationSummary] = useState<IntegrationSummary | null>(null);
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);
  const [dueInvoicesSummary, setDueInvoicesSummary] = useState<DueInvoicesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchDashboardData();
      fetchIntegrationSummary();
      fetchDueInvoices();
    }
  }, []);

  const fetchIntegrationSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIntegrationSummary(emptyIntegrationSummary);
        return;
      }

      const response = await fetch('/api/integration/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          setIntegrationSummary(normalizeIntegrationSummary(result.data));
        } else {
          console.error('Expected JSON but got:', contentType);
          setIntegrationSummary(emptyIntegrationSummary);
        }
      } else {
        setIntegrationSummary(emptyIntegrationSummary);
      }
    } catch (error) {
      console.error('Error fetching integration summary:', error);
      setIntegrationSummary(emptyIntegrationSummary);
    }
  };

  const fetchDueInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setDueInvoices([]);
        setDueInvoicesSummary(null);
        return;
      }

      const response = await fetch('/api/invoices/due-soon', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          if (result.data && result.data.invoices) {
            setDueInvoices(result.data.invoices);
            setDueInvoicesSummary(result.data.summary);
          }
        } else {
          console.error('Expected JSON but got:', contentType);
          setDueInvoices([]);
          setDueInvoicesSummary(null);
        }
      } else {
        setDueInvoices([]);
        setDueInvoicesSummary(null);
      }
    } catch (error) {
      console.error('Error fetching due invoices:', error);
      setDueInvoices([]);
      setDueInvoicesSummary(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setData(emptyDashboardData);
        return;
      }

      const response = await fetch('/api/reconciliation/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setData(emptyDashboardData);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        setData(result.data || emptyDashboardData);
      } else {
        console.error('Expected JSON but got:', contentType);
        setData(emptyDashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setData(emptyDashboardData);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      MATCHED: 'badge-success',
      PENDING: 'badge-warning',
      UNMATCHED: 'badge-danger',
      PARTIALLY_MATCHED: 'badge-info',
      PAID: 'badge-success',
      PARTIALLY_PAID: 'badge-warning',
      SENT: 'badge-info',
      OPEN: 'badge-warning',
      CANCELLED: 'badge-gray',
      CONFIRMED: 'badge-success',
      RECORDED: 'badge-info',
    };
    return styles[status as keyof typeof styles] || 'badge-gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/reports/overview"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </Link>
        </div>
      </div>

      {/* Financial Health Overview */}
      {integrationSummary && (
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Financial Health</h2>
              <p className="text-primary-100 text-sm mt-1">Real-time business performance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {integrationSummary.financialHealth.profitMargin.toFixed(1)}%
              </div>
              <div className="text-primary-100 text-sm">Profit Margin</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs text-primary-100">Revenue</span>
              </div>
              <div className="text-2xl font-bold">
                {(integrationSummary.financialHealth.monthlyRevenue / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-primary-100 mt-1">This month</div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs text-primary-100">Expenses</span>
              </div>
              <div className="text-2xl font-bold">
                {(integrationSummary.financialHealth.monthlyExpenses / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-primary-100 mt-1">This month</div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs text-primary-100">Profit</span>
              </div>
              <div className="text-2xl font-bold">
                {(integrationSummary.financialHealth.monthlyProfit / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-primary-100 mt-1">Net this month</div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-xs text-primary-100">Cash</span>
              </div>
              <div className="text-2xl font-bold">
                {(integrationSummary.financialHealth.cashOnHand / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-primary-100 mt-1">Available</div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Due Within 1 Week */}
      {dueInvoicesSummary && dueInvoicesSummary.total > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">📋 Invoices Due Soon</h2>
              <p className="text-gray-600 text-sm mt-1">
                {dueInvoicesSummary.overdue > 0 
                  ? `${dueInvoicesSummary.overdue} overdue, ${dueInvoicesSummary.dueSoon} due within 3 days`
                  : `${dueInvoicesSummary.dueSoon} due within 3 days`
                }
              </p>
            </div>
            <Link 
              href="/dashboard/invoices/unpaid"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-xs text-red-600 font-medium">Overdue</div>
              <div className="text-2xl font-bold text-red-700">{dueInvoicesSummary.overdue}</div>
              <div className="text-xs text-red-600 mt-1">
                {formatCurrency(dueInvoicesSummary.overdueAmount)}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-xs text-orange-600 font-medium">This Week</div>
              <div className="text-2xl font-bold text-orange-700">{dueInvoicesSummary.dueSoon}</div>
              <div className="text-xs text-orange-600 mt-1">High priority</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-xs text-blue-600 font-medium">Total Due</div>
              <div className="text-2xl font-bold text-blue-700">{dueInvoicesSummary.total}</div>
              <div className="text-xs text-blue-600 mt-1">In next 7 days</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-xs text-purple-600 font-medium">Outstanding</div>
              <div className="text-2xl font-bold text-purple-700">
                {(dueInvoicesSummary.totalAmount / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-purple-600 mt-1">Total amount</div>
            </div>
          </div>

          {/* Invoice list */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600">Due Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dueInvoices.slice(0, 8).map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link 
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm text-gray-900">{invoice.customer.name}</div>
                        <div className="text-xs text-gray-500">{invoice.customer.phone}</div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.balanceAmount)}
                        </div>
                        <div className="text-xs text-gray-500">of {formatCurrency(invoice.totalAmount)}</div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(invoice.dueDate)}
                        </div>
                        <div className={`text-xs font-semibold ${
                          invoice.isOverdue ? 'text-red-600' : 
                          invoice.daysUntilDue <= 1 ? 'text-red-600' :
                          invoice.daysUntilDue <= 3 ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          {invoice.isOverdue 
                            ? `${Math.abs(invoice.daysUntilDue)} days overdue`
                            : `${invoice.daysUntilDue} day${invoice.daysUntilDue !== 1 ? 's' : ''} left`
                          }
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          invoice.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          invoice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {invoice.priority.charAt(0).toUpperCase() + invoice.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/dashboard/collections?invoiceId=${invoice.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          Collect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {dueInvoices.length > 8 && (
            <div className="text-center">
              <Link
                href="/dashboard/invoices/unpaid"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View {dueInvoices.length - 8} more invoices
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Critical Alerts Section */}
      {integrationSummary?.alerts && integrationSummary.alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">⚠️ Action Required</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrationSummary.alerts.slice(0, 4).map((alert) => (
              <Link
                key={alert.id}
                href={alert.actionHref}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  alert.severity === 'high'
                    ? 'border-red-200 bg-red-50'
                    : alert.severity === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <AlertCircle
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        alert.severity === 'high'
                          ? 'text-red-600'
                          : alert.severity === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                      }`}
                    />
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Module Integration Overview */}
      {integrationSummary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Business Modules</h2>
            <Link href="/dashboard/reports/overview" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All Reports →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sales Module */}
            <Link
              href="/dashboard/invoices/unpaid"
              className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6 hover:shadow-lg transition-all hover:scale-105 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Unpaid</div>
                  <div className="text-sm font-bold text-gray-900">
                    {integrationSummary.unpaidInvoices.total}
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sales & Invoicing</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Outstanding</span>
                  <span className="font-bold text-red-600">
                    {(integrationSummary.unpaidInvoices.totalAmount / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overdue</span>
                  <span className="font-bold text-orange-600">
                    {integrationSummary.unpaidInvoices.overdue} items
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex items-center text-blue-600 text-xs font-medium">
                  Manage Invoices <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Projects Module */}
            <Link
              href="/dashboard/projects"
              className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6 hover:shadow-lg transition-all hover:scale-105 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Active</div>
                  <div className="text-sm font-bold text-gray-900">
                    {integrationSummary.operations.activeProjects}
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Projects</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Projects</span>
                  <span className="font-bold text-gray-900">{integrationSummary.operations.activeProjects}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Assets</span>
                  <span className="font-bold text-orange-600">
                    {(integrationSummary.operations.fixedAssetsValue / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex items-center text-orange-600 text-xs font-medium">
                  View Projects <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link
            href="/dashboard/invoices"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Invoices</span>
          </Link>

          <Link
            href="/dashboard/customers"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors mb-2">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Customers</span>
          </Link>

          <Link
            href="/dashboard/products"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors mb-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Products</span>
          </Link>

          <Link
            href="/dashboard/expenses"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Expenses</span>
          </Link>

          <Link
            href="/dashboard/reports/overview"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors mb-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Reports</span>
          </Link>

          <Link
            href="/dashboard/audit-compliance"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors mb-2">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Audit</span>
          </Link>
        </div>
      </div>

      {/* Reconciliation Dashboard */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Reconciliation Summary</h2>
      </div>
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-rise">
        <div className="card hover:shadow-lg transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Collected This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(data.summary.totalCollectedThisMonth)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+12.5% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(data.summary.outstandingBalance)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-600 font-medium">Needs attention</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {data.summary.pendingTransactions}
                </p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((data.summary.pendingTransactions / (data.summary.pendingTransactions + data.summary.matchedTransactions)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Unmatched Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {data.summary.unmatchedTransactions}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {data.summary.unmatchedTransactions > 0 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">Action required</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">All matched!</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Link href="/dashboard/reconcile" className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          <div className="card-body">
            {data.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent transactions</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-rise">
                {data.recentTransactions.slice(0, 5).map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{txn.reference}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(txn.transactionDate)}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(txn.amount)}</p>
                      <span className={`badge ${getStatusBadge(txn.status)} mt-1 text-xs`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top Customers This Month</h3>
            <Link href="/dashboard/customers" className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          <div className="card-body">
            {data.topCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No customer data</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-rise">
                {data.topCustomers.map((item, index) => (
                  <div key={item.customer?.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-primary-100'
                    }`}>
                      <span className={`font-bold text-sm ${index < 3 ? 'text-white' : 'text-primary-700'}`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.customer?.name}</p>
                      <p className="text-xs text-gray-500">{item.paymentsCount} payment(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.totalPaid)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Recent Transactions */}
      <div className="card stagger-rise hover:shadow-lg transition-shadow">
        <div className="card-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Recent Transactions</h3>
            <p className="text-xs text-gray-500 mt-1">Last 10 imported transactions</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        <div className="card-body">
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No recent transactions</p>
              <p className="text-sm text-gray-500 mb-4">No recent transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((txn, index) => (
                    <tr 
                      key={txn.id} 
                      className={`border-b border-gray-100 hover:bg-primary-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">{txn.reference}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${getStatusBadge(txn.status)}`}>{txn.status}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(txn.transactionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
