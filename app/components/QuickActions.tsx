'use client';

import Link from 'next/link';
import { Plus, Upload, UserPlus, ShoppingCart } from 'lucide-react';

export interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    label: 'New Invoice',
    href: '/dashboard/invoices/new',
    icon: <Plus className="w-5 h-5" />,
    color: 'blue',
  },
  {
    label: 'Upload Statement',
    href: '/dashboard/upload',
    icon: <Upload className="w-5 h-5" />,
    color: 'green',
  },
  {
    label: 'Add Customer',
    href: '/dashboard/customers/new',
    icon: <UserPlus className="w-5 h-5" />,
    color: 'purple',
  },
  {
    label: 'Create Order',
    href: '/dashboard/sales-orders/new',
    icon: <ShoppingCart className="w-5 h-5" />,
    color: 'amber',
  },
];

const colorClasses = {
  blue: 'from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600',
  green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
  purple: 'from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600',
  amber: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
};

export function QuickActions({ actions = DEFAULT_ACTIONS }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg bg-gradient-to-br ${colorClasses[action.color]} text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 group`}
        >
          <div className="p-2 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors mb-2">
            {action.icon}
          </div>
          <span className="text-xs sm:text-sm font-medium text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
