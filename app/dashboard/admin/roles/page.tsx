'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import Link from 'next/link';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        // Mock roles data
        const mockRoles: Role[] = [
          {
            id: '1',
            name: 'OWNER',
            description: 'Full system access and owner-level controls',
            permissions: [
              'manage_users',
              'manage_roles',
              'system_settings',
              'database_backup',
              'security_config',
              'view_audit_logs',
              'all_features',
            ],
            usersCount: 1,
          },
          {
            id: '2',
            name: 'ADMIN',
            description: 'Administrative access to most features',
            permissions: [
              'manage_users',
              'manage_roles',
              'all_operations',
              'view_audit_logs',
              'financial_management',
              'inventory_management',
            ],
            usersCount: 2,
          },
          {
            id: '3',
            name: 'FINANCE_MANAGER',
            description: 'Financial operations and reporting',
            permissions: [
              'view_financial',
              'create_journal_entries',
              'generate_reports',
              'view_dashboards',
            ],
            usersCount: 3,
          },
          {
            id: '4',
            name: 'FINANCE_STAFF',
            description: 'Limited financial data entry and viewing',
            permissions: ['view_financial', 'data_entry', 'view_dashboards'],
            usersCount: 5,
          },
          {
            id: '5',
            name: 'VIEWER',
            description: 'Read-only access to dashboards and reports',
            permissions: ['view_dashboards', 'view_reports'],
            usersCount: 8,
          },
        ];
        setRoles(mockRoles);
      } catch (error) {
        console.error('Failed to load roles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/control"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Control
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Role
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading roles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{role.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    PERMISSIONS ({role.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {perm.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{role.usersCount}</span> user{role.usersCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Role Assignment Guide</h3>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">OWNER:</strong> Complete system control including database
              management, backups, and security configuration. Typically assigned to the account owner.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">ADMIN:</strong> Full access to business operations, user
              management, and system configuration (except system-level features).
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">FINANCE_MANAGER:</strong> Access to financial dashboards,
              reporting, and transaction management.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">FINANCE_STAFF:</strong> Limited financial data entry and
              viewing capabilities.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">VIEWER:</strong> Read-only access to dashboards and reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
