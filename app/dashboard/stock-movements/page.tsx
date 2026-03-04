'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Package, Filter, Download } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
}

interface Location {
  id: string;
  code: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  movementType: string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  product: Product;
  warehouse: Warehouse;
  location: Location;
  createdByUser: User;
}

interface MovementSummary {
  totalMovements: number;
  inboundMovements: number;
  outboundMovements: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<MovementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [movementType, setMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (movementType) params.append('movementType', movementType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/stock/movements?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch movements');
      }

      const data = await response.json();
      setMovements(data.data.movements || []);
      setSummary(data.data.summary);
    } catch (err) {
      console.error('Fetch movements error:', err);
      setError('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  }, [movementType, startDate, endDate]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleFilter = () => {
    fetchMovements();
  };

  const handleClearFilters = () => {
    setMovementType('');
    setStartDate('');
    setEndDate('');
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PURCHASE: 'Purchase',
      SALE: 'Sale',
      ADJUSTMENT: 'Adjustment',
      TRANSFER_IN: 'Transfer In',
      TRANSFER_OUT: 'Transfer Out',
      RETURN: 'Return',
      DAMAGE: 'Damage',
      PRODUCTION: 'Production',
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PURCHASE: 'bg-green-100 text-green-800',
      SALE: 'bg-blue-100 text-blue-800',
      ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
      TRANSFER_IN: 'bg-purple-100 text-purple-800',
      TRANSFER_OUT: 'bg-orange-100 text-orange-800',
      RETURN: 'bg-indigo-100 text-indigo-800',
      DAMAGE: 'bg-red-100 text-red-800',
      PRODUCTION: 'bg-teal-100 text-teal-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Stock Movements</h1>
          <p className="text-sm text-gray-600">Track all inventory movements and transactions</p>
        </div>
        <button 
          onClick={() => {
            let csv = 'Stock Movements Report\\n\\n';
            csv += 'Movement Type,Product,SKU,Warehouse,Location,Quantity,Date,Created By,Reference,Notes\\n';
            
            movements.forEach(movement => {
              const userName = `${movement.createdByUser.firstName} ${movement.createdByUser.lastName}`.trim();
              csv += `${getMovementTypeLabel(movement.movementType)},`;
              csv += `"${movement.product.name}",${movement.product.sku},`;
              csv += `${movement.warehouse.code},${movement.location.code},`;
              csv += `${movement.quantity},${new Date(movement.createdAt).toLocaleDateString()},`;
              csv += `"${userName}",${movement.referenceType || 'N/A'},`;
              csv += `"${movement.notes || 'N/A'}"\\n`;
            });
            
            csv += `\\nSummary:\\n`;
            csv += `Total Movements,${summary?.totalMovements || 0}\\n`;
            csv += `Inbound Movements,${summary?.inboundMovements || 0}\\n`;
            csv += `Outbound Movements,${summary?.outboundMovements || 0}\\n`;
            csv += `Total Quantity In,${summary?.totalQuantityIn || 0}\\n`;
            csv += `Total Quantity Out,${summary?.totalQuantityOut || 0}\\n`;
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            toast.success('Stock movements exported successfully!');
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Movements</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.totalMovements || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inbound</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{summary?.inboundMovements || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outbound</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{summary?.outboundMovements || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total In</p>
              <p className="text-2xl font-bold text-green-700 mt-2">{summary?.totalQuantityIn || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Out</p>
              <p className="text-2xl font-bold text-red-700 mt-2">{summary?.totalQuantityOut || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="RETURN">Return</option>
              <option value="DAMAGE">Damage</option>
              <option value="PRODUCTION">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleFilter}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white/80 backdrop-blur rounded-lg shadow-sm border border-white/70 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Movement History</h2>
        {movements.length === 0 ? (
          <p className="text-gray-600 text-center py-12">No stock movements found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-4">Date & Time</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Created By</th>
                  <th className="py-2 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-gray-700">
                      {new Date(movement.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{movement.product.name}</p>
                      <p className="text-xs text-gray-500">{movement.product.sku}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.movementType)}`}>
                        {getMovementTypeLabel(movement.movementType)}
                      </span>
                    </td>
                    <td className={`py-3 pr-4 font-semibold ${movement.quantity > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.product.unit}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      <p>{movement.warehouse.code} - {movement.location.code}</p>
                      <p className="text-xs text-gray-500">{movement.location.name}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {movement.referenceType && movement.referenceId ? (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {movement.referenceType}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {movement.createdByUser.firstName} {movement.createdByUser.lastName}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs max-w-xs truncate">
                      {movement.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
