'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Filter, Clock } from 'lucide-react';
import Link from 'next/link';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        // Mock audit logs
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            userId: 'user1',
            userName: 'John Admin',
            action: 'user_created',
            resource: 'User',
            details: 'Created new user: jane.doe@company.com',
            ipAddress: '192.168.1.100',
            timestamp: new Date().toISOString(),
            status: 'success',
          },
          {
            id: '2',
            userId: 'user1',
            userName: 'John Admin',
            action: 'role_updated',
            resource: 'Role',
            details: 'Updated ADMIN role permissions',
            ipAddress: '192.168.1.100',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'success',
          },
          {
            id: '3',
            userId: 'user2',
            userName: 'Jane Manager',
            action: 'login',
            resource: 'Authentication',
            details: 'User logged in',
            ipAddress: '192.168.1.101',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: 'success',
          },
          {
            id: '4',
            userId: 'user3',
            userName: 'Bob Finance',
            action: 'login_failed',
            resource: 'Authentication',
            details: 'Failed login attempt',
            ipAddress: '192.168.1.102',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            status: 'failed',
          },
        ];
        setLogs(mockLogs);
      } catch (error) {
        console.error('Failed to load audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    return true;
  });

  const actions = [...new Set(logs.map((l) => l.action))];

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Logs */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No audit logs found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{log.userName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.resource}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.details}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Logs</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Success</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {logs.filter((l) => l.status === 'success').length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {logs.filter((l) => l.status === 'failed').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
