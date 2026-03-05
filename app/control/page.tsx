'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Building2, ShieldCheck, Package, BarChart3, Wallet } from 'lucide-react';

const controls = [
  {
    title: 'Dashboard',
    description: 'View business overview and live operational metrics.',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Reconciliation',
    description: 'Control payments matching, bank sync, and transaction verification.',
    href: '/dashboard/reconcile',
    icon: ShieldCheck,
  },
  {
    title: 'Inventory',
    description: 'Control stock levels, transfers, warehouses, and adjustments.',
    href: '/dashboard/inventory',
    icon: Package,
  },
  {
    title: 'Sales & POS',
    description: 'Control quotes, orders, invoicing flow, and point-of-sale operations.',
    href: '/dashboard/pos',
    icon: Wallet,
  },
  {
    title: 'Customers',
    description: 'Control customer records, communication, and payment follow-up.',
    href: '/dashboard/customers',
    icon: Building2,
  },
  {
    title: 'System Settings',
    description: 'Control platform-level setup, modules, and configuration decisions.',
    href: '/dashboard/reports',
    icon: Settings,
  },
];

export default function ControlPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
      <section className="card overflow-hidden">
        <div className="card-body">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-400">
            Elegant Main Control
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">App Control Center</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-3xl">
            This is your central place to control the app in Desktop folder <strong>elegante-main</strong>. Use these shortcuts to manage finance, operations, inventory, and reporting quickly.
          </p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-rise">
        {controls.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="card card-body hover-lift block">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
              <p className="mt-4 text-sm font-medium text-primary-700 dark:text-primary-400">Open module →</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
