'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Database, Download, RotateCcw, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Backup {
  id: string;
  name: string;
  size: string;
  created: string;
  status: 'completed' | 'in-progress' | 'failed';
  type: 'automatic' | 'manual';
}

export default function DatabaseManagementPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [databaseSize, setDatabaseSize] = useState('2.4 GB');
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock backup data
        const mockBackups: Backup[] = [
          {
            id: '1',
            name: 'Daily Backup - 2026-03-07',
            size: '2.3 GB',
            created: '2026-03-07 02:00 AM',
            status: 'completed',
            type: 'automatic',
          },
          {
            id: '2',
            name: 'Daily Backup - 2026-03-06',
            size: '2.2 GB',
            created: '2026-03-06 02:00 AM',
            status: 'completed',
            type: 'automatic',
          },
          {
            id: '3',
            name: 'Manual Backup - 2026-03-05',
            size: '2.2 GB',
            created: '2026-03-05 10:30 AM',
            status: 'completed',
            type: 'manual',
          },
        ];
        setBackups(mockBackups);
      } catch (error) {
        console.error('Failed to load backups:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      // Add new backup to list
      const newBackup: Backup = {
        id: String(Date.now()),
        name: `Manual Backup - ${new Date().toLocaleDateString()}`,
        size: databaseSize,
        created: new Date().toLocaleString(),
        status: 'completed',
        type: 'manual',
      };
      setBackups([newBackup, ...backups]);
    }, 3000);
  };

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Database Management</h1>
            </div>
            <span className="text-xs font-bold inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              ⚠️ OWNER ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Database Status */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Database Status</p>
                <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">● Online</p>
              </div>
              <Database className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{databaseSize}</p>
              </div>
              <Database className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Backup</p>
                <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">2 hours ago</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Backup Actions */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Backup Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleBackup}
              disabled={backingUp}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              {backingUp ? 'Backing up...' : 'Create Backup Now'}
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 transition-colors">
              <RotateCcw className="h-4 w-4" />
              Restore from Backup
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-600 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors">
              <Trash2 className="h-4 w-4" />
              Maintenance
            </button>
          </div>
        </div>

        {/* Backup List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading backups...</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white">Backup History</h3>
            </div>
            {backups.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No backups found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {backup.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {backup.size}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {backup.created}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              backup.type === 'manual'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {backup.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            ✓ {backup.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                              Download
                            </button>
                            <button className="text-red-600 hover:text-red-700 dark:text-red-400">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="mt-8 rounded-lg border-l-4 border-red-400 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            ⚠️ Database Management is Owner-Only
          </p>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            All database operations including backups, restores, and maintenance are logged and require owner
            authorization. Improper use may result in data loss.
          </p>
        </div>
      </div>
    </div>
  );
}
