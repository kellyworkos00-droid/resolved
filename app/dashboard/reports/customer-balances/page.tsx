'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Download, 
  RefreshCw,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerBalance {
  id: string;
  customerCode: string;
  customerName: string;
  email: string;
  phone: string;
  totalInvoiced: number;
  totalPaid: number;
  totalBalance: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90Plus: number;
}

export default function CustomerBalancesPage() {
  const [balances, setBalances] = useState<CustomerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/reports/customer-balances', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBalances(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customer balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBalances = balances.filter((customer) =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalBalance = () => {
    return filteredBalances.reduce((sum, customer) => sum + customer.totalBalance, 0);
  };

  const getTotalOverdue = () => {
    return filteredBalances.reduce((sum, customer) => 
      sum + customer.days30 + customer.days60 + customer.days90 + customer.days90Plus, 0
    );
  };

  const getCustomersWithBalance = () => {
    return filteredBalances.filter(c => c.totalBalance > 0).length;
  };

  const getAverageBalance = () => {
    const customersWithBalance = getCustomersWithBalance();
    return customersWithBalance > 0 ? getTotalBalance() / customersWithBalance : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Balances</h1>
          <p className="text-gray-600 mt-1">Track outstanding customer payments and aging analysis</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchBalances}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              let csv = 'Customer Balances Report\n\n';
              csv += 'Customer Code,Customer Name,Email,Phone,Total Invoiced,Total Paid,Total Balance,Current,1-30 Days,31-60 Days,61-90 Days,90+ Days\n';
              
              filteredBalances.forEach(customer => {
                csv += `${customer.customerCode},"${customer.customerName}",${customer.email},${customer.phone},`;
                csv += `${customer.totalInvoiced},${customer.totalPaid},${customer.totalBalance},`;
                csv += `${customer.current},${customer.days30},${customer.days60},${customer.days90},${customer.days90Plus}\n`;
              });
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `customer-balances-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              
              toast.success('Customer balances exported successfully!');
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      </div>

      {/* Summary Cards - Gradient Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">
            KES {(getTotalBalance() / 1000000).toFixed(1)}M
          </div>
          <div className="text-blue-100 text-sm mt-1">Total Outstanding</div>
          <div className="text-xs opacity-75 mt-2">All receivables</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">
            KES {(getTotalOverdue() / 1000000).toFixed(1)}M
          </div>
          <div className="text-red-100 text-sm mt-1">Overdue Amount</div>
          <div className="text-xs opacity-75 mt-2">Past due invoices</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">
            {getCustomersWithBalance()}
          </div>
          <div className="text-purple-100 text-sm mt-1">Customers w/ Balance</div>
          <div className="text-xs opacity-75 mt-2">Active accounts</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">
            KES {(getAverageBalance() / 1000).toFixed(0)}K
          </div>
          <div className="text-green-100 text-sm mt-1">Average Balance</div>
          <div className="text-xs opacity-75 mt-2">Per customer</div>
        </div>
      </div>

      {/* Customer Balances Table */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  1-30 Days
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  31-60 Days
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  61-90 Days
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  90+ Days
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No customer balances found
                  </td>
                </tr>
              ) : (
                filteredBalances.map((customer, index) => (
                  <tr 
                    key={customer.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                          {customer.customerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{customer.customerName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {customer.customerCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[150px]">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {customer.totalBalance > 0 && (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          KES {customer.totalBalance.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                      KES {customer.current.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm ${customer.days30 > 0 ? 'font-semibold text-yellow-600' : 'text-gray-500'}`}>
                        KES {customer.days30.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm ${customer.days60 > 0 ? 'font-semibold text-orange-600' : 'text-gray-500'}`}>
                        KES {customer.days60.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm ${customer.days90 > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                        KES {customer.days90.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm ${customer.days90Plus > 0 ? 'font-bold text-red-700' : 'text-gray-500'}`}>
                        KES {customer.days90Plus.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
