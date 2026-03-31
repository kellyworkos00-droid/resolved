'use client';

import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StorageBackupsPage() {
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Storage & Backups</h1>
            </div>
            <span className="text-xs font-bold inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              ⚠️ OWNER ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Storage Overview */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Storage Usage</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Database</p>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">2.4 GB / 5 GB</p>
              </div>
              <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                <div className="h-full w-1/2 bg-blue-600"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Files & Media</p>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">1.8 GB / 3 GB</p>
              </div>
              <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                <div className="h-full w-3/5 bg-green-600"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Backups</p>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">3.2 GB / 10 GB</p>
              </div>
              <div className="h-3 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                <div className="h-full w-1/3 bg-yellow-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Strategy */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Backup Configuration</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Automatic Daily Backups</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled at 2:00 AM daily</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium dark:bg-green-900/30 dark:text-green-300">
                ● Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Redundant Backups</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stored in 2 geographic locations</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium dark:bg-green-900/30 dark:text-green-300">
                ● Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Disaster Recovery Plan</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recovery target: 4 hours</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                Review Plan
              </button>
            </div>
          </div>
        </div>

        {/* Storage Recommendations */}
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Storage Recommendations</p>
              <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                <li>• Disk usage is at 68% - consider upgrading within 2 weeks</li>
                <li>• Maintain backup retention policy for compliance</li>
                <li>• Test disaster recovery procedures quarterly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
