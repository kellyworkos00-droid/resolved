'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, AlertCircle, MessageCircle, Store, Settings } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface IntegrationForm {
  whatsappNumber: string;
  whatsappApiKey: string;
  whatsappWebhookUrl: string;
  storeType: 'woocommerce' | 'shopify' | 'custom';
  storeUrl: string;
  storeApiKey: string;
  storeApiSecret: string;
  autoSyncEnabled: boolean;
  syncInterval: number;
  autoNotificationsEnabled: boolean;
  catalogEnabled: boolean;
}

export default function WhatsAppCommerceSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formData, setFormData] = useState<IntegrationForm>({
    whatsappNumber: '',
    whatsappApiKey: '',
    whatsappWebhookUrl: '',
    storeType: 'custom',
    storeUrl: '',
    storeApiKey: '',
    storeApiSecret: '',
    autoSyncEnabled: true,
    syncInterval: 30,
    autoNotificationsEnabled: true,
    catalogEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/whatsapp-commerce/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setFormData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.whatsappNumber || !formData.storeUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/whatsapp-commerce/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Integration settings saved successfully!');
        router.push('/dashboard/whatsapp-commerce');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTestingConnection(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/whatsapp-commerce/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Connection test successful!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/whatsapp-commerce"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to WhatsApp Commerce
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Setup WhatsApp Commerce Integration</h1>
        <p className="text-gray-600 mt-1">Connect your WhatsApp Business and e-commerce store</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* WhatsApp Business Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">WhatsApp Business Configuration</h2>
              <p className="text-sm text-gray-600">Connect your WhatsApp Business API</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Business Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="254712345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: Country code + number (no spaces or +)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp API Key
              </label>
              <input
                type="password"
                value={formData.whatsappApiKey}
                onChange={(e) => setFormData({ ...formData, whatsappApiKey: e.target.value })}
                placeholder="Your WhatsApp Business API key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Get this from your WhatsApp Business API provider</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={formData.whatsappWebhookUrl}
                onChange={(e) => setFormData({ ...formData, whatsappWebhookUrl: e.target.value })}
                placeholder="https://yourdomain.com/api/whatsapp/webhook"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">URL to receive WhatsApp webhook events</p>
            </div>
          </div>
        </div>

        {/* E-Commerce Store Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">E-Commerce Store Configuration</h2>
              <p className="text-sm text-gray-600">Connect your online store</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Platform <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.storeType}
                onChange={(e) => setFormData({ ...formData, storeType: e.target.value as 'woocommerce' | 'shopify' | 'custom' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="woocommerce">WooCommerce</option>
                <option value="shopify">Shopify</option>
                <option value="custom">Custom / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.storeUrl}
                onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                placeholder="https://yourstore.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Your e-commerce website URL</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store API Key
              </label>
              <input
                type="password"
                value={formData.storeApiKey}
                onChange={(e) => setFormData({ ...formData, storeApiKey: e.target.value })}
                placeholder="Your store API key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.storeType === 'woocommerce' && 'Consumer Key from WooCommerce > Settings > Advanced > REST API'}
                {formData.storeType === 'shopify' && 'Admin API access token from Shopify Admin'}
                {formData.storeType === 'custom' && 'Your API authentication key'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store API Secret
              </label>
              <input
                type="password"
                value={formData.storeApiSecret}
                onChange={(e) => setFormData({ ...formData, storeApiSecret: e.target.value })}
                placeholder="Your store API secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.storeType === 'woocommerce' && 'Consumer Secret from WooCommerce REST API'}
                {formData.storeType === 'shopify' && 'API secret key (if required)'}
                {formData.storeType === 'custom' && 'Your API secret key'}
              </p>
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Automation Settings</h2>
              <p className="text-sm text-gray-600">Configure automatic sync and notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Auto-Sync Products</h4>
                <p className="text-sm text-gray-600">Automatically sync products from your store</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSyncEnabled}
                  onChange={(e) => setFormData({ ...formData, autoSyncEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {formData.autoSyncEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={formData.syncInterval}
                  onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">How often to sync products (5-1440 minutes)</p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Auto-Notifications</h4>
                <p className="text-sm text-gray-600">Send automated WhatsApp notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoNotificationsEnabled}
                  onChange={(e) => setFormData({ ...formData, autoNotificationsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">WhatsApp Catalog</h4>
                <p className="text-sm text-gray-600">Enable product catalog in WhatsApp</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.catalogEnabled}
                  onChange={(e) => setFormData({ ...formData, catalogEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={testConnection}
            disabled={testingConnection}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Integration Settings
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Setup Help
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <strong>WhatsApp Business API:</strong> You need a verified WhatsApp Business account with API access</li>
          <li>• <strong>API Keys:</strong> Store your API keys securely and never share them publicly</li>
          <li>• <strong>Webhook URL:</strong> Point to your Kelly OS domain for receiving WhatsApp events</li>
          <li>• <strong>WooCommerce:</strong> Get API keys from WooCommerce → Settings → Advanced → REST API</li>
          <li>• <strong>Shopify:</strong> Create a custom app in Shopify Admin to get API credentials</li>
          <li>• <strong>Testing:</strong> Use the &quot;Test Connection&quot; button to verify your integration settings</li>
        </ul>
      </div>
    </div>
  );
}
