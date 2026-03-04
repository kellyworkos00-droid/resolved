'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Download,
  Edit2,
  Eye,
  FileText,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  quantity: number;
  reorderLevel: number;
  unit: string;
  category: string | null;
  imageUrl: string | null;
  status: string;
  createdAt?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StockMovement {
  id: string;
  quantity: number;
  movementType: string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  createdByUser?: { name?: string | null };
  location?: { name?: string | null };
}

interface ProductPerformance {
  totalSold: number;
  totalRevenue: number;
  totalOrders: number;
  avgQuantityPerOrder: number;
  topBuyers: Array<{
    customerName: string;
    totalQuantity: number;
    totalSpent: number;
  }>;
  salesTrend: Array<{
    date: string;
    quantity: number;
    revenue: number;
  }>;
  rank: number;
  totalProducts: number;
}

const statusOptions = ['ALL', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'INACTIVE'];
const stockManagedFromAdjustments = true;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvImporting, setCsvImporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'info' | 'movements' | 'performance'>('info');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const selectAllRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category: '',
    sku: '',
    quantity: '0',
    reorderLevel: '10',
    unit: 'UNIT',
    status: 'ACTIVE',
  });

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let list = [...products];

    if (normalizedSearch) {
      list = list.filter((product) => {
        return (
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.sku.toLowerCase().includes(normalizedSearch)
        );
      });
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'qty-asc':
          return a.quantity - b.quantity;
        case 'qty-desc':
          return b.quantity - a.quantity;
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'value-desc':
          return getInventoryValue(b) - getInventoryValue(a);
        default:
          return 0;
      }
    });

    return list;
  }, [products, searchTerm, sortBy]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      if (categoryFilter !== 'ALL') {
        params.set('category', categoryFilter);
      }

      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.data.items);
      setPagination((prev) => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setSelectedIds([]);
  }, [products]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < filteredProducts.length;
    }
  }, [selectedIds, filteredProducts.length]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 2,
    }).format(amount);

  const getStockStatus = (product: Product) => {
    if (product.quantity <= 0) {
      return { label: 'Out of stock', badge: 'badge-danger' };
    }
    if (product.quantity <= product.reorderLevel) {
      return { label: 'Low stock', badge: 'badge-warning' };
    }
    return { label: 'In stock', badge: 'badge-success' };
  };

  const getInventoryValue = (product: Product) =>
    (product.cost ?? product.price) * product.quantity;

  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) unique.add(product.category);
    });
    return Array.from(unique);
  }, [products]);

  const inventorySummary = useMemo(() => {
    const totalUnits = filteredProducts.reduce((sum, product) => sum + product.quantity, 0);
    const lowStock = filteredProducts.filter(
      (product) => product.quantity > 0 && product.quantity <= product.reorderLevel
    ).length;
    const outOfStock = filteredProducts.filter((product) => product.quantity <= 0).length;
    const totalValue = filteredProducts.reduce((sum, product) => sum + getInventoryValue(product), 0);

    return {
      totalUnits,
      lowStock,
      outOfStock,
      totalValue,
    };
  }, [filteredProducts]);

  const allSelected =
    filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredProducts.map((product) => product.id));
  };

  const handleToggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast.error('Only JPEG, PNG, WebP, and GIF formats are supported');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Please fill in required fields (Name, Price)');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      if (editingProduct) {
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            cost: formData.cost,
            quantity: formData.quantity,
            category: formData.category,
            sku: formData.sku,
            reorderLevel: formData.reorderLevel,
            unit: formData.unit,
            status: formData.status,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to update product');
        }

        toast.success('Product updated successfully');
      } else {
        const useUpload = Boolean(selectedFile);
        const response = await (useUpload
          ? fetch('/api/products/upload', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: (() => {
                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.name);
                formDataToSend.append('description', formData.description);
                formDataToSend.append('price', formData.price);
                formDataToSend.append('cost', formData.cost);
                formDataToSend.append('quantity', formData.quantity);
                formDataToSend.append('category', formData.category);
                formDataToSend.append('sku', formData.sku);
                formDataToSend.append('reorderLevel', formData.reorderLevel);
                formDataToSend.append('unit', formData.unit);
                formDataToSend.append('status', formData.status);
                if (selectedFile) {
                  formDataToSend.append('image', selectedFile);
                }
                return formDataToSend;
              })(),
            })
          : fetch('/api/products', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: formData.name,
                description: formData.description,
                price: formData.price,
                cost: formData.cost,
                quantity: formData.quantity,
                category: formData.category,
                sku: formData.sku,
                reorderLevel: formData.reorderLevel,
                unit: formData.unit,
                status: formData.status,
              }),
            }));

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to create product');
        }

        toast.success('Product created successfully');
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      category: product.category || '',
      sku: product.sku || '',
      quantity: product.quantity.toString(),
      reorderLevel: product.reorderLevel.toString(),
      unit: product.unit || 'UNIT',
      status: product.status || 'ACTIVE',
    });
    setPreview(product.imageUrl);
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const responses = await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/products/${id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          })
        )
      );

      const failed = responses.find((response) => !response.ok);
      if (failed) {
        throw new Error('Failed to update one or more products');
      }

      toast.success('Selected products updated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update selected products');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected products?`)) return;

    try {
      const token = localStorage.getItem('token');
      const responses = await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      const failed = responses.find((response) => !response.ok);
      if (failed) {
        throw new Error('Failed to delete one or more products');
      }

      toast.success('Selected products deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete selected products');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      category: '',
      sku: '',
      quantity: '0',
      reorderLevel: '10',
      unit: 'UNIT',
      status: 'ACTIVE',
    });
    setSelectedFile(null);
    setPreview(null);
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleViewProduct = async (product: Product) => {
    setViewingProduct(product);
    setDetailsTab('info');
    setLoadingDetails(true);

    try {
      const token = localStorage.getItem('token');

      // Fetch movements and performance in parallel
      const [movementsRes, performanceRes] = await Promise.all([
        fetch(`/api/stock/movements?productId=${product.id}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/products/${product.id}/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (movementsRes.ok) {
        const movementsData = await movementsRes.json();
        setProductMovements(movementsData.data.movements || []);
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json();
        setProductPerformance(performanceData.data);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrintMovement = () => {
    if (!viewingProduct || productMovements.length === 0) {
      toast.error('No movement data to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const movementRows = productMovements
      .map(
        (m) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(m.createdAt).toLocaleDateString()}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${m.movementType}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${m.quantity > 0 ? '+' : ''}${m.quantity}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${m.location?.name || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${m.notes || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${m.createdByUser?.name || '-'}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product Movement Report - ${viewingProduct.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            .header { margin-bottom: 20px; }
            .product-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Product Movement Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="product-info">
            <h2>${viewingProduct.name}</h2>
            <p><strong>SKU:</strong> ${viewingProduct.sku}</p>
            <p><strong>Current Stock:</strong> ${viewingProduct.quantity} ${viewingProduct.unit}</p>
            <p><strong>Category:</strong> ${viewingProduct.category || 'N/A'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Notes</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              ${movementRows}
            </tbody>
          </table>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Print</button>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    const headers = [
      'SKU',
      'Name',
      'Category',
      'Quantity',
      'Reorder Level',
      'Unit',
      'Cost',
      'Price',
      'Status',
    ];
    const rows = filteredProducts.map((product) => [
      product.sku,
      product.name,
      product.category || '',
      product.quantity,
      product.reorderLevel,
      product.unit,
      product.cost ?? '',
      product.price,
      product.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'name',
      'price',
      'description',
      'cost',
      'quantity',
      'reorderLevel',
      'unit',
      'category',
      'sku',
      'status',
    ];
    const sample = [
      'Steel Rod 6mm',
      '450.00',
      'Standard construction steel rod',
      '320.00',
      '50',
      '10',
      'PCS',
      'Construction',
      '',
      'ACTIVE',
    ];

    const csv = [headers, sample]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      event.target.value = '';
      return;
    }

    try {
      setCsvImporting(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error?.message || 'CSV import failed');
      }

      const imported = responseData.data?.imported ?? 0;
      const skipped = responseData.data?.skipped ?? 0;
      const importErrors: Array<{ row: number; reason: string }> = responseData.data?.errors ?? [];

      toast.success(`Import complete: ${imported} created, ${skipped} skipped`);
      if (importErrors.length > 0) {
        toast.error(`Some rows were skipped. First issue: Row ${importErrors[0].row} - ${importErrors[0].reason}`);
      }

      fetchProducts();
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import CSV');
    } finally {
      setCsvImporting(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Track stock levels, pricing, and product health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvImport}
            className="hidden"
          />
          <button
            onClick={handleDownloadTemplate}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            CSV Template
          </button>
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={csvImporting}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <Upload size={16} />
            {csvImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={fetchProducts}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link href="/dashboard/stock-adjustments" className="btn-secondary flex items-center gap-2">
            <Plus size={18} />
            Stock Adjustments
          </Link>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total SKUs</p>
            <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
            <p className="text-xs text-gray-500 mt-1">Based on current filters</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Units In View</p>
            <p className="text-2xl font-semibold text-gray-900">{inventorySummary.totalUnits}</p>
            <p className="text-xs text-gray-500 mt-1">Across loaded products</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Low Stock</p>
            <p className="text-2xl font-semibold text-amber-600">{inventorySummary.lowStock}</p>
            <p className="text-xs text-gray-500 mt-1">Needs reorder</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Stock Value</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(inventorySummary.totalValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cost or price basis</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, or SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="input"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="input"
            >
              <option value="ALL">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              <option value="recent">Sort by latest</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="qty-desc">Quantity (High-Low)</option>
              <option value="qty-asc">Quantity (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="value-desc">Value (High-Low)</option>
            </select>
            <select
              value={pagination.limit}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  limit: Number(e.target.value),
                  page: 1,
                }))
              }
              className="input"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>
                Showing {filteredProducts.length} of {pagination.total} products
              </span>
            </div>
            {stockManagedFromAdjustments ? (
              <div className="text-sm text-gray-600">
                Stock changes are managed in{' '}
                <Link href="/dashboard/stock-adjustments" className="text-primary-700 hover:text-primary-900 font-medium">
                  Stock Adjustments
                </Link>
                .
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('ACTIVE')}
                  disabled={selectedIds.length === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('OUT_OF_STOCK')}
                  disabled={selectedIds.length === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Mark Out of Stock
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('DISCONTINUED')}
                  disabled={selectedIds.length === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Discontinue
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0}
                  className="btn-danger disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingProduct
                  ? 'Update pricing, stock, and status details.'
                  : 'Create a product with pricing, stock, and category details.'}
              </p>
            </div>
            <button onClick={resetForm}>
              <X size={22} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Steel Rod 6mm"
                />
              </div>
              <div>
                <label className="label">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  readOnly={!!editingProduct}
                  className="input"
                  placeholder={editingProduct ? "Managed in Stock Adjustments" : "Initial stock quantity"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingProduct 
                    ? 'Quantity updates managed via Stock Adjustments only.'
                    : 'Set initial stock quantity (can be adjusted later).'}
                </p>
              </div>
              <div>
                <label className="label">Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  {statusOptions
                    .filter((status) => status !== 'ALL')
                    .map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[90px]"
                rows={3}
              />
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative w-28 h-28 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  {preview ? (
                    <Image src={preview} alt="Preview" fill className="object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-gray-800">Product image</p>
                  <p className="text-xs text-gray-500">
                    Upload JPG, PNG, WebP, or GIF up to 5MB.
                  </p>
                  {editingProduct ? (
                    <p className="text-xs text-gray-400">
                      Image updates are available for new products only.
                    </p>
                  ) : (
                    <label className="inline-flex items-center gap-2 text-sm text-primary-700 cursor-pointer">
                      <Upload size={16} />
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  {!editingProduct && preview && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting
                  ? editingProduct
                    ? 'Updating...'
                    : 'Creating...'
                  : editingProduct
                  ? 'Update Product'
                  : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="w-full">
          <table className="table w-full">
            <thead>
              <tr>
                {!stockManagedFromAdjustments && (
                  <th className="w-10">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                )}
                <th>Product</th>
                <th className="hidden lg:table-cell">Category</th>
                <th>Stock</th>
                <th className="hidden md:table-cell">Reorder</th>
                <th>Price</th>
                <th className="hidden xl:table-cell">Cost</th>
                <th className="hidden xl:table-cell">Value</th>
                <th className="hidden sm:table-cell">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stock = getStockStatus(product);
                return (
                  <tr key={product.id}>
                    {!stockManagedFromAdjustments && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => handleToggleSelect(product.id)}
                        />
                      </td>
                    )}
                    <td>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell text-sm text-gray-600">{product.category || '-'}</td>
                    <td>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {product.quantity} <span className="text-gray-500">{product.unit}</span>
                      </p>
                      <span className={`badge text-xs ${stock.badge}`}>{stock.label}</span>
                    </td>
                    <td className="hidden md:table-cell text-sm text-gray-600">{product.reorderLevel}</td>
                    <td className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="hidden xl:table-cell text-sm text-gray-600">
                      {product.cost !== null ? formatCurrency(product.cost) : '-'}
                    </td>
                    <td className="hidden xl:table-cell text-sm font-semibold text-gray-900">
                      {formatCurrency(getInventoryValue(product))}
                    </td>
                    <td className="hidden sm:table-cell">
                      <span
                        className={`badge ${
                          product.status === 'ACTIVE'
                            ? 'badge-success'
                            : product.status === 'OUT_OF_STOCK'
                            ? 'badge-warning'
                            : product.status === 'DISCONTINUED'
                            ? 'badge-danger'
                            : 'badge-gray'
                        }`}
                      >
                        {product.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-right">
                      {stockManagedFromAdjustments ? (
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="btn-secondary flex items-center gap-1 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <Link href="/dashboard/stock-adjustments" className="btn-secondary inline-flex items-center gap-1 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2">
                            <Plus size={14} />
                            <span className="hidden sm:inline">Adjust Stock</span>
                            <span className="sm:hidden">Adjust</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="btn-secondary flex items-center gap-1 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="btn-secondary flex items-center gap-1 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                          >
                            <Edit2 size={14} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="btn-danger flex items-center gap-1 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-sm text-gray-500 py-10">
                    No products found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
            >
              Previous
            </button>
            <button
              className="btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-gray-900">Product Details</h3>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b bg-gray-50">
              <div className="flex gap-1 p-2">
                <button
                  onClick={() => setDetailsTab('info')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    detailsTab === 'info'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText size={16} />
                  <span>Details</span>
                </button>
                <button
                  onClick={() => setDetailsTab('movements')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    detailsTab === 'movements'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Package size={16} />
                  <span>Movements</span>
                </button>
                <button
                  onClick={() => setDetailsTab('performance')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    detailsTab === 'performance'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp size={16} />
                  <span>Performance</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Info Tab */}
              {detailsTab === 'info' && (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="relative w-full lg:w-80 h-80 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {viewingProduct.imageUrl ? (
                      <Image
                        src={viewingProduct.imageUrl}
                        alt={viewingProduct.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package size={64} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{viewingProduct.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">SKU: {viewingProduct.sku}</p>
                      <span
                        className={`badge mt-2 ${
                          viewingProduct.status === 'ACTIVE'
                            ? 'badge-success'
                            : viewingProduct.status === 'OUT_OF_STOCK'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}
                      >
                        {viewingProduct.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {viewingProduct.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600">{viewingProduct.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Selling Price</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(viewingProduct.price)}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Cost Price</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {viewingProduct.cost !== null
                            ? formatCurrency(viewingProduct.cost)
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                        <p className="text-2xl font-bold text-green-600">
                          {viewingProduct.quantity} {viewingProduct.unit}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Reorder Level</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {viewingProduct.reorderLevel}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-semibold text-gray-900">
                          {viewingProduct.category || 'Uncategorized'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Inventory Value</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(getInventoryValue(viewingProduct))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Unit</p>
                        <p className="font-semibold text-gray-900">{viewingProduct.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-semibold text-gray-900">
                          {viewingProduct.createdAt
                            ? new Date(viewingProduct.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          handleEdit(viewingProduct);
                          setViewingProduct(null);
                        }}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Edit2 size={18} />
                        Edit Product
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(viewingProduct);
                          setViewingProduct(null);
                        }}
                        className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        Delete Product
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Movements Tab */}
              {detailsTab === 'movements' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Stock Movement History</h3>
                    <button
                      onClick={handlePrintMovement}
                      className="btn-secondary flex items-center gap-2"
                      disabled={productMovements.length === 0}
                    >
                      <Printer size={16} />
                      Print Movement
                    </button>
                  </div>

                  {loadingDetails ? (
                    <div className="text-center py-12">
                      <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                      <p className="text-gray-500">Loading movements...</p>
                    </div>
                  ) : productMovements.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Package size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">No movement history available</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Location</th>
                            <th>Notes</th>
                            <th>Created By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productMovements.map((movement) => (
                            <tr key={movement.id}>
                              <td className="text-sm">
                                {new Date(movement.createdAt).toLocaleString()}
                              </td>
                              <td>
                                <span className="badge badge-info text-xs">
                                  {movement.movementType}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`font-semibold ${
                                    movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {movement.quantity > 0 ? '+' : ''}
                                  {movement.quantity}
                                </span>
                              </td>
                              <td className="text-sm text-gray-600">
                                {movement.location?.name || '-'}
                              </td>
                              <td className="text-sm text-gray-600">
                                {movement.notes || '-'}
                              </td>
                              <td className="text-sm text-gray-600">
                                {movement.createdByUser?.name || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Performance Tab */}
              {detailsTab === 'performance' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sales Performance & Analytics
                  </h3>

                  {loadingDetails ? (
                    <div className="text-center py-12">
                      <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                      <p className="text-gray-500">Loading performance data...</p>
                    </div>
                  ) : !productPerformance ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <TrendingUp size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">No performance data available</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Total Sold</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {productPerformance.totalSold}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(productPerformance.totalRevenue)}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {productPerformance.totalOrders}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Avg per Order</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {productPerformance.avgQuantityPerOrder.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      {/* Product Rank */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-orange-200">
                        <div className="flex items-center gap-4">
                          <div className="bg-yellow-400 rounded-full w-16 h-16 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              #{productPerformance.rank}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Product Ranking</p>
                            <p className="text-xl font-bold text-gray-900">
                              Top {productPerformance.rank} of {productPerformance.totalProducts}{' '}
                              Products
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Based on total sales performance
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Top Buyers */}
                      {productPerformance.topBuyers.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Top Buyers</h4>
                          <div className="overflow-x-auto">
                            <table className="table w-full">
                              <thead>
                                <tr>
                                  <th className="text-left">Rank</th>
                                  <th className="text-left">Customer</th>
                                  <th className="text-right">Quantity Purchased</th>
                                  <th className="text-right">Total Spent</th>
                                </tr>
                              </thead>
                              <tbody>
                                {productPerformance.topBuyers.map((buyer, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 font-bold text-sm">
                                        {index + 1}
                                      </div>
                                    </td>
                                    <td className="font-semibold text-gray-900">
                                      {buyer.customerName}
                                    </td>
                                    <td className="text-right font-semibold text-blue-600">
                                      {buyer.totalQuantity} units
                                    </td>
                                    <td className="text-right font-semibold text-green-600">
                                      {formatCurrency(buyer.totalSpent)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Sales Trend (if available) */}
                      {productPerformance.salesTrend.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Recent Sales Trend</h4>
                          <div className="overflow-x-auto">
                            <table className="table w-full">
                              <thead>
                                <tr>
                                  <th className="text-left">Date</th>
                                  <th className="text-right">Quantity Sold</th>
                                  <th className="text-right">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {productPerformance.salesTrend.map((trend, index) => (
                                  <tr key={index}>
                                    <td className="text-sm">
                                      {new Date(trend.date).toLocaleDateString()}
                                    </td>
                                    <td className="text-right font-semibold text-blue-600">
                                      {trend.quantity}
                                    </td>
                                    <td className="text-right font-semibold text-green-600">
                                      {formatCurrency(trend.revenue)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingProduct(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
