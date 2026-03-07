'use client';

import { ArrowLeft, Bell, Slack, Mail, AlertCircle, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SystemAlertsPage() {
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      name: 'High CPU Usage',
      description: 'Alert when CPU usage exceeds 80%',
      enabled: true,
      threshold: '80%',
      channels: ['email', 'slack'],
    },
    {
      id: '2',
      name: 'Disk Space Critical',
      description: 'Alert when disk usage exceeds 85%',
      enabled: true,
      threshold: '85%',
      channels: ['email', 'slack'],
    },
    {
      id: '3',
      name: 'Database Connection Error',
      description: 'Alert on database connection failures',
      enabled: true,
      threshold: 'Any',
      channels: ['email', 'slack'],
    },
    {
      id: '4',
      name: 'Failed Login Attempts',
      description: 'Alert on 5+ failed login attempts',
      enabled: true,
      threshold: '5 attempts',
      channels: ['email'],
    },
    {
      id: '5',
      name: 'Backup Failure',
      description: 'Alert when backup fails',
      enabled: true,
      threshold: 'Any',
      channels: ['email', 'slack'],
    },
  ]);

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Alerts</h1>
            </div>
            <span className="text-xs font-bold inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              ⚠️ OWNER ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Notification Channels */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Channels</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">admin@example.com</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                ✓ Active
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Slack className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Slack</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">#alerts channel</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                ✓ Active
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Bell className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">In-App</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Push notifications</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                ✓ Active
              </span>
            </div>
          </div>
        </div>

        {/* Alert Rules */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alert Triggers</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{alert.name}</h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {alert.threshold}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{alert.description}</p>

                    <div className="flex gap-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Channels:</span>
                      {alert.channels.map((channel) => (
                        <span
                          key={channel}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`relative ml-4 inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      alert.enabled ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        alert.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert History */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Alerts Sent</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              { name: 'Disk Space Critical', time: '2 hours ago', status: 'resolved' },
              { name: 'High CPU Usage', time: '6 hours ago', status: 'resolved' },
              { name: 'Failed Login Attempts', time: '1 day ago', status: 'resolved' },
            ].map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-6">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{alert.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{alert.time}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  ✓ {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">Alert Configuration Tips</p>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Set thresholds based on your system capacity and performance requirements</li>
                <li>• Configure multiple notification channels for critical alerts</li>
                <li>• Review and adjust alert rules periodically</li>
                <li>• Test notification channels after configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
