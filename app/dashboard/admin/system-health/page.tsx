'use client';

import { ArrowLeft, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SystemHealthPage() {
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Health</h1>
            </div>
            <span className="text-xs font-bold inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              ⚠️ OWNER ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Health Status */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">34%</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
              <div className="h-full w-1/3 bg-blue-600"></div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">42%</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
              <div className="h-full w-5/12 bg-green-600"></div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">68%</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
              <div className="h-full w-2/3 bg-yellow-600"></div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">45d</p>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">No restarts</p>
          </div>
        </div>

        {/* Services Status */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Services Status</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { name: 'Database', status: 'online', uptime: '45 days' },
              { name: 'API Server', status: 'online', uptime: '45 days' },
              { name: 'Cache Server', status: 'online', uptime: '3 days' },
              { name: 'Queue Worker', status: 'online', uptime: '2 days' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-6">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Uptime: {service.uptime}</p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium dark:bg-green-900/30 dark:text-green-300">
                  ● {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Performance Metrics</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">234ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Requests/sec</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">0.02%</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Alerts</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="flex items-start gap-4 p-6">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Database optimization completed</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Disk usage above 65%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">4 hours ago - Current: 68%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
