'use client';

import { ArrowLeft, Lock, Key, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function SecuritySettingsPage() {
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
            </div>
            <span className="text-xs font-bold inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              ⚠️ OWNER ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Security Status */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg dark:border-green-800/50 dark:bg-green-900/20">
              <p className="font-semibold text-green-900 dark:text-green-300">SSL/TLS Encryption</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-600 text-white">✓ Enabled</span>
            </div>

            <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg dark:border-green-800/50 dark:bg-green-900/20">
              <p className="font-semibold text-green-900 dark:text-green-300">Two-Factor Authentication</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-600 text-white">✓ Enabled</span>
            </div>

            <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg dark:border-green-800/50 dark:bg-green-900/20">
              <p className="font-semibold text-green-900 dark:text-green-300">API Key Rotation</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-600 text-white">✓ Enabled</span>
            </div>

            <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg dark:border-yellow-800/50 dark:bg-yellow-900/20">
              <p className="font-semibold text-yellow-900 dark:text-yellow-300">Data Encryption at Rest</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-600 text-white">⚠ Partial</span>
            </div>
          </div>
        </div>

        {/* Encryption Keys */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Encryption Keys Management
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Master Key</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last rotated: 30 days ago</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                Rotate Key
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">API Keys</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">5 active keys</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                Manage Keys
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Database Keys</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automatically managed</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                ✓ Secure
              </span>
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Control Policies
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">IP Whitelist</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">12 IP addresses allowed</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                Configure
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Session Timeout</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">30 minutes of inactivity</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Password Policy</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Min 12 chars, 91-day expiry</p>
              </div>
              <button className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                Edit Policy
              </button>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">Security Critical</p>
              <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                Improper security configuration may compromise the entire system. All changes require owner
                authorization and are logged in the audit trail. Test security changes in a staging environment
                first.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
