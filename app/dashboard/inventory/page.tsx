'use client';

import { useEffect, useState } from 'react';
import { Package, AlertCircle, TrendingUp, Warehouse, Search, RefreshCw, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  warehouses: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  unit: string;
  status: string;
}

export default function InventoryPage() {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [summaryRes, productsRes] = await Promise.all([
        fetch('/api/inventory/summary', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/products?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.data);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.data?.items || []);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'low') {
      return matchesSearch && product.quantity <= product.reorderLevel && product.quantity > 0;
    }
    if (filterStatus === 'out') {
      return matchesSearch && product.quantity === 0;
    }
    return matchesSearch;
  });

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (product.quantity <= product.reorderLevel) return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time inventory levels and stock management</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards - Gradient Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary?.totalItems || 0}</div>
          <div className="text-blue-100 text-sm mt-1">Total Items</div>
          <div className="text-xs opacity-75 mt-2">Active products</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary?.lowStockItems || 0}</div>
          <div className="text-yellow-100 text-sm mt-1">Low Stock Items</div>
          <div className="text-xs opacity-75 mt-2">Need reordering</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary?.outOfStockItems || 0}</div>
          <div className="text-red-100 text-sm mt-1">Out of Stock</div>
          <div className="text-xs opacity-75 mt-2">Urgent attention</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            KES {((summary?.totalValue || 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-green-100 text-sm mt-1">Inventory Value</div>
          <div className="text-xs opacity-75 mt-2">Total worth</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary?.warehouses || 0}</div>
          <div className="text-purple-100 text-sm mt-1">Warehouses</div>
          <div className="text-xs opacity-75 mt-2">Active locations</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/stock-adjustments" className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors text-center justify-center">
            <ArrowUpCircle className="w-4 h-4" />
            Stock Adjustment
          </Link>
          <Link href="/dashboard/stock-transfers" className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors text-center justify-center">
            <Warehouse className="w-4 h-4" />
            Transfer Stock
          </Link>
          <Link href="/dashboard/stock-movements" className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors text-center justify-center">
            <ArrowDownCircle className="w-4 h-4" />
            View Movements
          </Link>
          <Link href="/dashboard/product-returns" className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors text-center justify-center">
            <Package className="w-4 h-4" />
            Product Returns
          </Link>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'low' | 'out')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Items</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.category || 'Uncategorized'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`text-sm font-semibold ${product.quantity === 0 ? 'text-red-600' : product.quantity <= product.reorderLevel ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {product.quantity} {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-500">{product.reorderLevel} {product.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">KES {product.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No products match your search' : 'No inventory items found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

