'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  BarChart3,
  FileText,
  Users,
  ShoppingCart,
  Package,
  Building2,
  Wallet,
  CreditCard,
  Home,
  TrendingUp,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description: string;
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
  category: string;
}

const COMMANDS: Command[] = [
  // Navigation
  { id: 'dashboard', label: 'Dashboard', description: 'Go to main dashboard', href: '/dashboard', icon: <Home className="w-4 h-4" />, category: 'Navigation' },
  { id: 'reconcile', label: 'Reconciliation', description: 'Bank statement reconciliation', href: '/dashboard/reconcile', icon: <BarChart3 className="w-4 h-4" />, category: 'Navigation' },
  { id: 'invoices', label: 'Invoices', description: 'Manage invoices', href: '/dashboard/invoices', icon: <FileText className="w-4 h-4" />, category: 'Navigation' },
  { id: 'customers', label: 'Customers', description: 'Customer management', href: '/dashboard/customers', icon: <Users className="w-4 h-4" />, category: 'Navigation' },
  { id: 'suppliers', label: 'Suppliers', description: 'Supplier management', href: '/dashboard/suppliers', icon: <Building2 className="w-4 h-4" />, category: 'Navigation' },
  { id: 'products', label: 'Products', description: 'Product catalog', href: '/dashboard/products', icon: <Package className="w-4 h-4" />, category: 'Navigation' },
  { id: 'inventory', label: 'Inventory', description: 'Stock levels', href: '/dashboard/stock-levels', icon: <Package className="w-4 h-4" />, category: 'Navigation' },
  { id: 'pos', label: 'Point of Sale', description: 'POS system', href: '/dashboard/pos', icon: <ShoppingCart className="w-4 h-4" />, category: 'Navigation' },
  { id: 'reports', label: 'Reports', description: 'Financial reports', href: '/dashboard/reports', icon: <BarChart3 className="w-4 h-4" />, category: 'Navigation' },
  { id: 'expenses', label: 'Expenses', description: 'Expense tracking', href: '/dashboard/expenses', icon: <Wallet className="w-4 h-4" />, category: 'Navigation' },
  { id: 'purchase-orders', label: 'Purchase Orders', description: 'Manage POs', href: '/dashboard/purchase-orders', icon: <ShoppingCart className="w-4 h-4" />, category: 'Navigation' },
  { id: 'sales-orders', label: 'Sales Orders', description: 'Manage sales', href: '/dashboard/sales-orders', icon: <CreditCard className="w-4 h-4" />, category: 'Navigation' },
  { id: 'hr', label: 'HR Management', description: 'Human resources', href: '/dashboard/hr', icon: <Users className="w-4 h-4" />, category: 'Navigation' },
  { id: 'projects', label: 'Projects', description: 'Project management', href: '/dashboard/projects', icon: <TrendingUp className="w-4 h-4" />, category: 'Navigation' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const executeCommand = useCallback((command: Command) => {
    if (command.href) {
      router.push(command.href);
    } else if (command.action) {
      command.action();
    }
    setOpen(false);
    setSearch('');
  }, [router]);

  // Filter commands based on search
  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // cmd+k or ctrl+k to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setSearch('');
      }

      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }

      // Arrow keys to navigate
      if (open) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter' && filtered.length > 0) {
          e.preventDefault();
          executeCommand(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filtered, executeCommand]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full max-w-xs mx-auto hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-sm">Quick search...</span>
        <kbd className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-700">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl overflow-hidden rounded-lg shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 ml-4 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <kbd className="hidden sm:inline-flex text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ml-4">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => executeCommand(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="text-gray-400 dark:text-gray-500">{command.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{command.label}</div>
                    <div className={`text-xs ${index === selectedIndex ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      {command.description}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hidden sm:inline">
                    {command.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
          Use arrow keys to navigate, Enter to select
        </div>
      </div>
    </>
  );
}
