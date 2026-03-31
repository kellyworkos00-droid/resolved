'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version: string;
  category: string;
  dependencies?: string[];
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModules = async () => {
      try {
        // Mock modules data
        const mockModules: Module[] = [
          {
            id: '1',
            name: 'Financial Management',
            description: 'Accounting, budgeting, and financial reporting',
            enabled: true,
            version: '1.0.0',
            category: 'Finance',
            dependencies: ['Database', 'Auth'],
          },
          {
            id: '2',
            name: 'Inventory Management',
            description: 'Stock, warehouses, and inventory control',
            enabled: true,
            version: '1.0.0',
            category: 'Operations',
            dependencies: ['Database'],
          },
          {
            id: '3',
            name: 'HR Management',
            description: 'Employee management and payroll',
            enabled: true,
            version: '1.0.0',
            category: 'HR',
            dependencies: ['Database', 'Payroll'],
          },
          {
            id: '4',
            name: 'POS System',
            description: 'Point of sale and order management',
            enabled: true,
            version: '1.0.0',
            category: 'Sales',
            dependencies: ['Inventory', 'Payments'],
          },
          {
            id: '5',
            name: 'Notifications',
            description: 'SMS and email notifications',
            enabled: true,
            version: '1.0.0',
            category: 'Integration',
            dependencies: [],
          },
          {
            id: '6',
            name: 'Compliance',
            description: 'Audit logging and regulatory compliance',
            enabled: true,
            version: '1.0.0',
            category: 'Security',
            dependencies: ['Database'],
          },
        ];
        setModules(mockModules);
      } catch (error) {
        console.error('Failed to load modules:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  const toggleModule = (id: string) => {
    setModules(
      modules.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      )
    );
  };

  const enabledCount = modules.filter((m) => m.enabled).length;

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Module Configuration</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Module
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading modules...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{module.name}</h3>
                      <span className="text-xs font-semibold inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        v{module.version}
                      </span>
                      <span className="text-xs font-semibold inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {module.category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{module.description}</p>
                    {module.dependencies && module.dependencies.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Dependencies:</span>
                        <div className="flex gap-1">
                          {module.dependencies.map((dep) => (
                            <span
                              key={dep}
                              className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300"
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        module.enabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          module.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Modules</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{modules.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Enabled</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{enabledCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Disabled</p>
            <p className="mt-1 text-2xl font-bold text-gray-600 dark:text-gray-400">
              {modules.length - enabledCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
