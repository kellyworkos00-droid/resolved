'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Plus, Minus, X, ShoppingCart, Check, Eye } from 'lucide-react';
import Decimal from 'decimal.js';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface CartItem {
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
}

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  currentBalance: number;
  totalOutstanding: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
}

interface PosOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product?: { name?: string | null } | null;
}

interface PosOrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  amountPaid?: number | null;
  tax?: number | null;

  paymentMethod?: string | null;
  paymentStatus?: string | null;
  createdAt: string;
  orderItems?: PosOrderItem[];
  customer?: { name?: string | null } | null;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<PosOrderSummary | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerForm, setCustomerForm] = useState({
    customerCode: '',
    name: '',
    email: '',
    phone: '',
  });



  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!customerId) {
      setCustomerInvoices([]);
      return;
    }

    fetchCustomerInvoices(customerId);
  }, [customerId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setLoadingCustomers(true);
      const token = localStorage.getItem('token');
      const [productsRes, customersRes] = await Promise.all([
        fetch('/api/products?status=ACTIVE&limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/customers?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.data.items.filter((p: Product) => p.quantity > 0));
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.data.customers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setLoadingCustomers(false);
    }
  };

  const fetchCustomerInvoices = async (selectedCustomerId: string) => {
    try {
      setLoadingInvoices(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/invoices?customerId=${selectedCustomerId}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();
      setCustomerInvoices(data.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
        toast.success(`Added to cart`);
      } else {
        toast.error('Not enough stock');
      }
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity: 1,
          unitPrice: product.price,
        },
      ]);
      toast.success(`Added to cart`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      const product = products.find((p) => p.id === productId);
      if (product && quantity <= product.quantity) {
        setCart(
          cart.map((item) =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          )
        );
      } else {
        toast.error('Not enough stock');
      }
    }
  };

  const updateUnitPrice = (productId: string, unitPrice: number) => {
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      toast.error('Price must be 0 or higher');
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, unitPrice } : item
      )
    );
  };

  const calculateTotals = () => {
    let subtotal = new Decimal(0);

    for (const item of cart) {
      const itemTotal = new Decimal(item.unitPrice).mul(item.quantity);
      subtotal = subtotal.plus(itemTotal);
    }

    const tax = subtotal.mul(new Decimal(taxRate)).div(100);
    const total = subtotal.plus(tax);

    return {
      subtotal: subtotal.toNumber(),
      tax: tax.toNumber(),
      total: total.toNumber(),
    };
  };

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

  const getInvoiceBadge = (status: string) => {
    const styles = {
      PAID: 'badge-success',
      SENT: 'badge-info',
      PARTIALLY_PAID: 'badge-warning',
      OVERDUE: 'badge-danger',
      DRAFT: 'badge-gray',
      CANCELLED: 'badge-gray',
    };
    return styles[status as keyof typeof styles] || 'badge-gray';
  };

  const extractErrorMessage = async (response: Response) => {
    try {
      const data = await response.json();
      return data?.error?.message || data?.message || null;
    } catch {
      return null;
    }
  };



  const handleCreateCustomer = async () => {
    if (!customerForm.customerCode || !customerForm.name) {
      toast.error('Customer code and name are required');
      return;
    }

    try {
      setCreatingCustomer(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerCode: customerForm.customerCode,
          name: customerForm.name,
          email: customerForm.email,
          phone: customerForm.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to create customer');
      }

      setCustomers((prev) => [data.data, ...prev]);
      setCustomerId(data.data.id);
      setShowAddCustomer(false);
      setCustomerForm({ customerCode: '', name: '', email: '', phone: '' });
      toast.success('Customer added');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (isCheckingOut) {
      return;
    }

    try {
      setIsCheckingOut(true);
      const token = localStorage.getItem('token');
      const totals = calculateTotals();

      // Create order
      const orderResponse = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: customerId || null,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          tax: taxRate,
        }),
      });

      if (!orderResponse.ok) {
        const message = await extractErrorMessage(orderResponse);
        throw new Error(message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.data.id;

      // Checkout order
      const checkoutResponse = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          paymentMethod,
          amountPaid: totals.total,
        }),
      });

      if (!checkoutResponse.ok) {
        const message = await extractErrorMessage(checkoutResponse);
        const errorMsg = message || 'Failed to checkout order';
        console.error('Checkout error:', errorMsg);
        throw new Error(errorMsg);
      }

      const completedOrder = await checkoutResponse.json();
      if (!completedOrder.data) {
        throw new Error('Invalid checkout response - no order data returned');
      }
      setLastOrder(completedOrder.data);
      setShowReceipt(true);

      // Reset cart
      setCart([]);
      setCustomerId('');
      setTaxRate(0);
      setPaymentMethod('CASH');

      // Refresh data
      fetchInitialData();

      toast.success('Sale completed! 🎉');
    } catch (error) {
      console.error('Error during checkout:', error);
      const message = error instanceof Error ? error.message : 'Checkout failed';
      toast.error(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleTogglePaymentStatus = async () => {
    if (!lastOrder) return;
    
    try {
      setUpdatingPaymentStatus(true);
      const token = localStorage.getItem('token');
      const currentStatus = lastOrder.paymentStatus || 'PENDING';
      const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';

      const response = await fetch(`/api/pos/orders/${lastOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentStatus: newStatus,
        }),
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        throw new Error(message || 'Failed to update payment status');
      }

      const result = await response.json();
      setLastOrder(result.data);
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading POS...</div>
      </div>
    );
  }

  // Receipt Modal
  if (showReceipt && lastOrder) {
    return (
      <>
        <div className="pos-receipt-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="pos-receipt bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative w-12 h-12">
                <Image
                  src="/images/elegant-logo.jpg"
                  alt="Elegant Steel Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Elegant Steel</p>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">East Africa</p>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <Check size={40} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Sale Complete!</h2>
            <p className="text-gray-600">Order #{lastOrder.orderNumber}</p>
          </div>

          <div className="border-y py-4 mb-4 space-y-2">
            {lastOrder.orderItems && lastOrder.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product?.name}</span>
                <span>x{item.quantity} KES {(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>KES {(lastOrder.totalAmount - (lastOrder.tax || 0)).toFixed(2)}</span>
            </div>
            {lastOrder.tax && lastOrder.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span>KES {lastOrder.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg bg-blue-50 p-3 rounded">
              <span>Total:</span>
              <span className="text-blue-600">KES {lastOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            {lastOrder.customer?.name && (
              <p><strong>Customer:</strong> {lastOrder.customer.name}</p>
            )}
            <p><strong>Payment:</strong> {lastOrder.paymentMethod}</p>
            <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-semibold ${
              lastOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
              lastOrder.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>{lastOrder.paymentStatus || 'PENDING'}</span></p>
            <p><strong>Time:</strong> {new Date(lastOrder.createdAt).toLocaleTimeString()}</p>
          </div>

          <div className="pos-receipt-actions flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setLastOrder(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Print
              </button>
            </div>
            <button
              onClick={handleTogglePaymentStatus}
              disabled={updatingPaymentStatus}
              className={`w-full py-2 rounded-lg font-medium text-white ${
                lastOrder?.paymentStatus === 'PAID' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:bg-gray-400`}
            >
              {updatingPaymentStatus ? 'Updating...' : `Mark as ${lastOrder?.paymentStatus === 'PAID' ? 'Not Paid' : 'Paid'}`}
            </button>
          </div>
          </div>
        </div>
        <style jsx global>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }
            body * {
              visibility: hidden;
            }
            .pos-receipt-overlay {
              position: static;
              inset: auto;
              padding: 0;
              background: #fff;
            }
            .pos-receipt,
            .pos-receipt * {
              visibility: visible;
            }
            .pos-receipt {
              width: 80mm;
              max-width: 80mm;
              padding: 12mm 8mm;
              box-shadow: none;
              border-radius: 0;
              margin: 0 auto;
            }
            .pos-receipt-actions {
              display: none;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-gray-100 gap-4 p-3 sm:p-4">
      <div className="flex-1 flex flex-col order-2 lg:order-1">
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-3 sm:mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Point of Sale</h1>
          </div>
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-md p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-2xl overflow-hidden shadow hover:shadow-lg transition"
                >
                  <div className="relative w-full h-24 sm:h-28 lg:h-32 bg-gray-200">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingCart size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                    <p className="text-base sm:text-lg font-bold text-blue-600 mt-2">
                      KES {product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">Stock: {product.quantity}</p>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 flex items-center justify-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-2 rounded-lg text-xs font-medium transition"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => addToCart(product)}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-2 rounded-lg text-xs font-medium transition"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white shadow-xl rounded-2xl flex flex-col order-1 lg:order-2">
        <div className="bg-blue-600 text-white p-4 sm:p-5 flex items-center gap-2 rounded-t-2xl">
          <ShoppingCart size={24} />
          <h2 className="text-lg sm:text-xl font-bold">Cart ({cart.length})</h2>
        </div>

        <div className="border-b p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Customer</h3>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="text-xs font-medium text-primary-700 hover:text-primary-600"
            >
              + Add
            </button>
          </div>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
          >
            <option value="">Walk-in customer</option>
            {loadingCustomers ? (
              <option value="" disabled>
                Loading customers...
              </option>
            ) : (
              customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.customerCode})
                </option>
              ))
            )}
          </select>

          {customerId && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600">Open Invoices</p>
                <a
                  href={`/dashboard/invoices?customerId=${customerId}`}
                  className="text-xs text-primary-700 hover:text-primary-600"
                >
                  View all
                </a>
              </div>

              {loadingInvoices ? (
                <p className="text-xs text-gray-500">Loading invoices...</p>
              ) : customerInvoices.length === 0 ? (
                <p className="text-xs text-gray-500">No invoices found.</p>
              ) : (
                <div className="space-y-2">
                  {customerInvoices.slice(0, 4).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-700">{invoice.invoiceNumber}</p>
                        <p className="text-gray-500">Due {formatDate(invoice.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(invoice.balanceAmount)}</p>
                        <span className={`badge ${getInvoiceBadge(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3 max-h-[45vh] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart size={40} className="mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.product?.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-gray-500">Unit price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number.isFinite(item.unitPrice) ? item.unitPrice : 0}
                        onChange={(e) => updateUnitPrice(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="bg-gray-200 hover:bg-gray-300 p-1.5 rounded"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                    className="w-12 text-center px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="bg-gray-200 hover:bg-gray-300 p-1.5 rounded"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="flex-1 text-right font-semibold text-sm">KES {(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">KES {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-600 w-16">Tax (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded text-xs"
                />
                <span className="font-semibold flex-1 text-right">KES {totals.tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl border-2 border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Total Due</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">KES {totals.total.toFixed(2)}</p>
            </div>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MPESA">M-Pesa</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400"
            >
              {isCheckingOut ? 'Processing...' : 'Complete Sale'}
            </button>

            <button
              onClick={() => {
                setCart([]);
                setCustomerId('');
                setTaxRate(0);
              }}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-400 text-sm"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Customer</h3>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Customer Code</label>
                <input
                  type="text"
                  value={customerForm.customerCode}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({ ...prev, customerCode: e.target.value }))
                  }
                  className="input"
                  placeholder="CUST-0007"
                />
              </div>
              <div>
                <label className="label">Customer Name</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Safari Distributors"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="input"
                  placeholder="billing@safari.com"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="input"
                  placeholder="+254 700 000000"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddCustomer(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                disabled={creatingCustomer}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                disabled={creatingCustomer}
              >
                {creatingCustomer ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Product Details</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative w-full md:w-64 h-64 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {selectedProduct.imageUrl ? (
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingCart size={64} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">SKU: {selectedProduct.sku}</p>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                      <p className="text-gray-600">{selectedProduct.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Price</p>
                      <p className="text-2xl font-bold text-blue-600">
                        KES {selectedProduct.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Stock Available</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedProduct.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                      disabled={selectedProduct.quantity === 0}
                    >
                      <Plus size={20} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
