'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Upload,
  GitCompare,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Package,
  Truck,
  ClipboardList,
  Receipt,
  BarChart3,
  LineChart,
  FileSignature,
  ClipboardCheck,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Briefcase,
  Building2,
  ShieldAlert,
  AlertCircle,
  RotateCcw,
  Activity,
  MessageSquare,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    role: string;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(['stock', 'reports']);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData) as { firstName?: string; lastName?: string; role: string });
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem('erp_sound_muted');
    setSoundMuted(stored === 'true');
  }, []);

  useEffect(() => {
    if (!user || soundMuted) return;

    const audio = new Audio('/sounds/open-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => undefined);
  }, [pathname, soundMuted, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleToggleSound = () => {
    setSoundMuted((prev) => {
      const next = !prev;
      localStorage.setItem('erp_sound_muted', String(next));
      return next;
    });
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Statement', href: '/dashboard/upload', icon: Upload },
    { name: 'Reconcile', href: '/dashboard/reconcile', icon: GitCompare },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'SMS Management', href: '/dashboard/sms', icon: MessageSquare },
    {
      name: 'Invoices',
      icon: FileText,
      dropdown: true,
      items: [
        { name: 'All Invoices', href: '/dashboard/invoices', icon: FileText },
        { name: 'Unpaid Invoices', href: '/dashboard/invoices/unpaid', icon: AlertCircle },
      ],
    },
    { name: 'Credit Notes', href: '/dashboard/credit-notes', icon: Receipt },
    { name: 'Sales Quotes', href: '/dashboard/sales-quotes', icon: FileSignature },
    { name: 'Sales Orders', href: '/dashboard/sales-orders', icon: ClipboardCheck },
    { name: 'POS', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    {
      name: 'Stock Management',
      icon: Package,
      dropdown: true,
      items: [
        { name: 'Warehouses', href: '/dashboard/warehouses', icon: Package },
        { name: 'Current Stock', href: '/dashboard/stock-levels', icon: BarChart3 },
        { name: 'Stock Variations', href: '/dashboard/stock-variations', icon: TrendingDown },
        { name: 'Stock Adjustments', href: '/dashboard/stock-adjustments', icon: TrendingUp },
        { name: 'Stock Transfers', href: '/dashboard/stock-transfers', icon: ClipboardList },
        { name: 'Stock Movements', href: '/dashboard/stock-movements', icon: Activity },
        { name: 'Product Returns', href: '/dashboard/product-returns', icon: RotateCcw },
      ],
    },
    { name: 'Suppliers', href: '/dashboard/suppliers', icon: Truck },
    { name: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: ClipboardList },
    { name: 'Supplier Bills', href: '/dashboard/supplier-bills', icon: Receipt },
    { name: 'Supplier Aging', href: '/dashboard/supplier-aging', icon: BarChart3 },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'HR & Payroll', href: '/dashboard/hr', icon: Users },
    { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
    { name: 'Fixed Assets', href: '/dashboard/fixed-assets', icon: Building2 },
    { name: 'Audit & Compliance', href: '/dashboard/audit-compliance', icon: ShieldAlert },
    {
      name: 'Reports',
      icon: LineChart,
      dropdown: true,
      items: [
        { name: 'Financial Overview', href: '/dashboard/reports', icon: LineChart },
        { name: 'Invoice Report', href: '/dashboard/reports/invoices', icon: FileText },
        { name: 'Customer Balances', href: '/dashboard/reports/customer-balances', icon: DollarSign },
        { name: 'Profit & Loss', href: '/dashboard/reports/profit-loss', icon: BarChart3 },
        { name: 'Financial Analysis', href: '/dashboard/reports/financial-analysis', icon: BarChart3 },
      ],
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Skip dashboard layout UI for print routes  
  if (pathname?.includes('/print/')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white/85 backdrop-blur border-r border-white/70 shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/70">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                <Image
                  src="/images/elegant-logo.jpg"
                  alt="Elegant Steel Logo"
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              </div>
              <div>
                <span className="text-sm font-display font-bold text-gray-900">Elegant Steel</span>
                <p className="text-xs text-gray-600">ERP Suite</p>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if ('dropdown' in item && item.dropdown) {
                const isOpen = openDropdowns.includes(item.name.toLowerCase().replace(/\s+/g, '-'));
                const hasActiveChild = item.items?.some((child) => pathname === child.href);
                
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleDropdown(item.name.toLowerCase().replace(/\s+/g, '-'))}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        hasActiveChild
                          ? 'bg-white/80 text-primary-700 shadow-sm'
                          : 'text-gray-700 hover:bg-white/70'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isOpen && item.items && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.items.map((subItem) => {
                          const isActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href || '#'}
                              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-white/80 text-primary-700 shadow-sm'
                                  : 'text-gray-600 hover:bg-white/70'
                              }`}
                            >
                              <subItem.icon className="w-4 h-4 mr-3" />
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular link item (not a dropdown)
              if (!item.href) return null;
              
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/80 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-white/70'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/70">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-white/80 border border-white/60 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-primary-700 font-semibold text-sm">
                  {user.firstName?.charAt(0)}
                  {user.lastName?.charAt(0)}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/70 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white/80 backdrop-blur border-b border-white/70 flex items-center px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <Menu className="w-6 h-6 text-gray-500" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-display font-semibold text-gray-900">
              {navigation.find((item) => {
                if (item.href === pathname) return true;
                if ('items' in item && item.items) {
                  return item.items.some((sub) => sub.href === pathname);
                }
                return false;
              })?.name || 
              navigation.find((item) => 'items' in item && item.items?.some((sub) => sub.href === pathname))?.items?.find((sub) => sub.href === pathname)?.name ||
              'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToggleSound}
              className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-white/70 px-3 py-1.5 rounded-full border border-white/70 hover:text-primary-700 hover:border-primary-200 transition-colors"
            >
              {soundMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {soundMuted ? 'Sound Off' : 'Sound On'}
            </button>
            <span className="text-sm text-gray-600">DTB • PayBill 516600</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
