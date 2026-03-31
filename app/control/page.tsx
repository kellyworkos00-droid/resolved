'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Settings,
  Building2,
  ShieldCheck,
  Package,
  BarChart3,
  Wallet,
  Users,
  Lock,
  Database,
  AlertCircle,
  HardDrive,
  Activity,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type UserRole = 'ADMIN' | 'OWNER' | string;
type ModuleCategory = 'operations' | 'admin' | 'system';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface ControlModule {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: ModuleCategory;
  requiredRole: 'ADMIN' | 'OWNER';
  badge?: string;
}

const modules: ControlModule[] = [
  // Operations & Management
  {
    title: 'Dashboard',
    description: 'View business overview and live operational metrics.',
    href: '/dashboard',
    icon: BarChart3,
    category: 'operations',
    requiredRole: 'ADMIN',
  },
  {
    title: 'Sales & POS',
    description: 'Control quotes, orders, invoicing flow, and point-of-sale operations.',
    href: '/dashboard/pos',
    icon: Wallet,
    category: 'operations',
    requiredRole: 'ADMIN',
  },
  {
    title: 'Customers',
    description: 'Control customer records, communication, and payment follow-up.',
    href: '/dashboard/customers',
    icon: Building2,
    category: 'operations',
    requiredRole: 'ADMIN',
  },
  {
    title: 'Financial Management',
    description: 'Comprehensive accounting, budgeting, and financial reporting.',
    href: '/dashboard/financial',
    icon: Wallet,
    category: 'operations',
    requiredRole: 'ADMIN',
  },

  // Admin Controls
  {
    title: 'User Management',
    description: 'Manage system users, roles, permissions, and access controls.',
    href: '/dashboard/admin/users',
    icon: Users,
    category: 'admin',
    requiredRole: 'ADMIN',
    badge: 'CRITICAL',
  },
  {
    title: 'Role & Permissions',
    description: 'Configure user roles and granular permission settings.',
    href: '/dashboard/admin/roles',
    icon: Lock,
    category: 'admin',
    requiredRole: 'ADMIN',
    badge: 'CRITICAL',
  },
  {
    title: 'Audit Logs',
    description: 'View system activity, user actions, and compliance audit trail.',
    href: '/dashboard/admin/audit-logs',
    icon: Activity,
    category: 'admin',
    requiredRole: 'ADMIN',
    badge: 'SECURITY',
  },
  {
    title: 'Module Configuration',
    description: 'Enable/disable modules, configure integrations, and API settings.',
    href: '/dashboard/admin/modules',
    icon: Settings,
    category: 'admin',
    requiredRole: 'ADMIN',
    badge: 'CRITICAL',
  },

  // System Administration (Owner Only)
  {
    title: 'Database Management',
    description: 'Manage database backups, restore points, and data integrity.',
    href: '/dashboard/admin/database',
    icon: Database,
    category: 'system',
    requiredRole: 'OWNER',
    badge: 'OWNER ONLY',
  },
  {
    title: 'System Health',
    description: 'Monitor system performance, resource usage, and server health.',
    href: '/dashboard/admin/system-health',
    icon: Activity,
    category: 'system',
    requiredRole: 'OWNER',
    badge: 'OWNER ONLY',
  },
  {
    title: 'Storage & Backups',
    description: 'Manage storage quotas, automated backups, and disaster recovery.',
    href: '/dashboard/admin/storage',
    icon: HardDrive,
    category: 'system',
    requiredRole: 'OWNER',
    badge: 'OWNER ONLY',
  },
  {
    title: 'Security Settings',
    description: 'Configure encryption, SSL, API keys, and security policies.',
    href: '/dashboard/admin/security',
    icon: ShieldCheck,
    category: 'system',
    requiredRole: 'OWNER',
    badge: 'OWNER ONLY',
  },
  {
    title: 'System Alerts',
    description: 'Configure system monitoring alerts and notifications.',
    href: '/dashboard/admin/alerts',
    icon: AlertCircle,
    category: 'system',
    requiredRole: 'OWNER',
    badge: 'OWNER ONLY',
  },
];

export default function ControlPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ModuleCategory | 'all'>('all');

  const hasControlCenterAccess = (role?: UserRole): boolean => {
    return role === 'ADMIN' || role === 'OWNER';
  };

  const canAccessModule = (module: ControlModule, role?: UserRole): boolean => {
    if (!role) return false;
    if (module.requiredRole === 'OWNER') {
      return role === 'OWNER';
    }
    return role === 'ADMIN' || role === 'OWNER';
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        const userData = await res.json();
        const normalizedUser: User = userData.data || userData;
        setUser(normalizedUser);

        if (!hasControlCenterAccess(normalizedUser.role)) {
          setError('Access denied. Only Admin and Owner roles can access the Control Center.');
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError('Failed to verify access. Redirecting...');
        setTimeout(() => router.push('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const normalizedQuery = query.trim().toLowerCase();
  const accessibleModules = modules.filter((module) => canAccessModule(module, user?.role));
  const filteredModules = accessibleModules.filter((module) => {
    const matchesCategory = activeCategory === 'all' || module.category === activeCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      module.title.toLowerCase().includes(normalizedQuery) ||
      module.description.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  const operationsModules = accessibleModules.filter((m) => m.category === 'operations');
  const adminModules = accessibleModules.filter((m) => m.category === 'admin');
  const systemModules = accessibleModules.filter((m) => m.category === 'system');
  const visibleOperationsModules = filteredModules.filter((m) => m.category === 'operations');
  const visibleAdminModules = filteredModules.filter((m) => m.category === 'admin');
  const visibleSystemModules = filteredModules.filter((m) => m.category === 'system');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading control center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="mt-4 font-semibold text-gray-900 dark:text-white">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const categoryConfig: Record<
    ModuleCategory,
    {
      title: string;
      subtitle: string;
      icon: LucideIcon;
      headerClasses: string;
      borderClasses: string;
      iconClasses: string;
      badgeClasses: string;
      linkClasses: string;
    }
  > = {
    operations: {
      title: 'Operations and Management',
      subtitle: 'Control business operations, financial workflows, and customer activity.',
      icon: BarChart3,
      headerClasses:
        'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800',
      borderClasses: 'hover:border-blue-300 dark:hover:border-blue-600',
      iconClasses:
        'bg-blue-100 text-blue-700 group-hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:group-hover:bg-blue-900/60',
      badgeClasses: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      linkClasses: 'text-blue-700 dark:text-blue-300',
    },
    admin: {
      title: 'Administrative Controls',
      subtitle: 'Manage users, permissions, security controls, and compliance settings.',
      icon: Lock,
      headerClasses:
        'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800',
      borderClasses: 'hover:border-amber-300 dark:hover:border-amber-600',
      iconClasses:
        'bg-amber-100 text-amber-700 group-hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:group-hover:bg-amber-900/60',
      badgeClasses: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      linkClasses: 'text-amber-700 dark:text-amber-300',
    },
    system: {
      title: 'System Administration',
      subtitle: 'Owner-level controls for database, resilience, backups, and system security.',
      icon: Database,
      headerClasses:
        'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800',
      borderClasses: 'hover:border-red-300 dark:hover:border-red-600',
      iconClasses:
        'bg-red-100 text-red-700 group-hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:group-hover:bg-red-900/60',
      badgeClasses: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      linkClasses: 'text-red-700 dark:text-red-300',
    },
  };

  const renderModuleSection = (category: ModuleCategory, items: ControlModule[]) => {
    if (items.length === 0) return null;

    const config = categoryConfig[category];
    const HeaderIcon = config.icon;

    return (
      <section key={category} className="mb-10">
        <div className={`mb-4 rounded-xl border bg-gradient-to-r p-4 ${config.headerClasses}`}>
          <div className="flex items-center gap-2">
            <HeaderIcon className="h-5 w-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{config.title}</h2>
          </div>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{config.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${config.borderClasses}`}
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${config.iconClasses}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {item.badge && (
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-bold ${config.badgeClasses}`}
                  >
                    {item.badge}
                  </span>
                )}

                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>

                <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${config.linkClasses}`}>
                  Open module
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Control Center</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.firstName} {user.lastName} • {user.role}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 sm:inline-flex">
                Admin Access
              </span>

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
                aria-label="Toggle control center menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Quick Navigation
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {accessibleModules.slice(0, 8).map((module) => (
                  <Link
                    key={`mobile-${module.href}`}
                    href={module.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {module.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-slate-100 via-white to-blue-50 p-6 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome to Elegant Control Center</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                This workspace gives you role-protected access to operational, admin, and platform modules.
                <strong className="mt-1 block">Restricted to Admin and Owner roles only.</strong>
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">User Role</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{user.role}</p>
            </div>
            <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Accessible Modules</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{accessibleModules.length}</p>
            </div>
            <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">System Status</p>
              <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">Operational</p>
            </div>
            <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Current Session</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Active</p>
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-800/80">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search modules by name or description"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-blue-900/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'operations', label: `Operations (${operationsModules.length})` },
                { key: 'admin', label: `Admin (${adminModules.length})` },
                { key: 'system', label: `System (${systemModules.length})` },
              ].map((filter) => {
                const selected = activeCategory === filter.key;

                return (
                  <button
                    key={filter.key}
                    onClick={() => setActiveCategory(filter.key as ModuleCategory | 'all')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selected
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredModules.length} of {accessibleModules.length} modules
          </p>
        </section>

        {visibleOperationsModules.length > 0 && renderModuleSection('operations', visibleOperationsModules)}
        {visibleAdminModules.length > 0 && renderModuleSection('admin', visibleAdminModules)}
        {visibleSystemModules.length > 0 && renderModuleSection('system', visibleSystemModules)}

        {filteredModules.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
            <Search className="mx-auto h-8 w-8 text-gray-500" />
            <p className="mt-3 font-semibold text-gray-900 dark:text-white">No modules match this filter</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Try a broader search term or switch categories.
            </p>
          </div>
        )}

        {accessibleModules.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-12 text-center dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
            <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Access Denied</p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You do not have permission to access the control center. Contact your administrator if you believe this is an error.
            </p>
          </div>
        )}

        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Security Notice</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                All activities in the control center are logged for compliance and audit purposes.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Support</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                For technical support, contact the system administrator or support team.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Documentation</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Refer to the admin guide for detailed documentation on each feature.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
