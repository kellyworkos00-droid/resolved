'use client';

import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Loader, 
  Send, 
  Settings,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SmsConfig {
  provider: string;
  configured: boolean;
  errors: string[] | null;
}

interface TestResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'QUEUED';
  provider: string;
  messageId?: string;
  cost?: number;
  statusGroup?: string;
  statusName?: string;
  statusDescription?: string;
  error?: string;
}

export default function SmsTestPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SmsConfig | null>(null);
  const [testPhone, setTestPhone] = useState('+254712345678');
  const [testMessage, setTestMessage] = useState('This is a test message from Kelly OS SMS system.');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/test', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to check SMS configuration');
      }

      const data = await response.json();
      setConfig({
        provider: data.smsConfiguration.provider,
        configured: data.smsConfiguration.configured,
        errors: data.smsConfiguration.errors,
      });

      if (data.smsConfiguration.configured) {
        toast.success(`SMS configured with ${data.smsConfiguration.provider}`);
      } else {
        toast.error('SMS not properly configured');
      }
    } catch (error) {
      console.error('Error checking SMS config:', error);
      toast.error('Failed to check SMS configuration');
    } finally {
      setLoading(false);
    }
  };

  const sendTestSms = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Please enter phone number and message');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage,
        }),
      });

      const data = await response.json();

      // Handle both SUCCESS and QUEUED as successful outcomes
      if (response.ok && data.testSms?.success !== false) {
        const queued = data.status === 'QUEUED';
        setTestResult({
          success: true,  // Both queued and delivered are successful
          status: data.status,
          provider: data.testSms.provider,
          messageId: data.testSms.messageId,
          cost: data.testSms.cost,
          statusGroup: data.testSms.statusGroup,
          statusName: data.testSms.statusName,
          statusDescription: data.testSms.statusDescription,
        });
        toast.success(queued ? 'SMS queued by provider (awaiting delivery)' : 'Test SMS sent successfully!');
      } else {
        setTestResult({
          success: false,
          status: 'FAILED',
          provider: data.testSms?.provider || 'unknown',
          statusGroup: data.testSms?.statusGroup,
          statusName: data.testSms?.statusName,
          statusDescription: data.testSms?.statusDescription,
          error: data.testSms?.error || data.message || 'Unknown error',
        });
        toast.error(`Failed to send SMS: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setTestResult({
        success: false,
        status: 'FAILED',
        provider: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to send test SMS');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SMS Testing & Configuration</h1>
        <p className="text-gray-600 mt-1">
          Test your SMS provider configuration and send test messages
        </p>
      </div>

      {/* Configuration Check */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            SMS Configuration Status
          </h2>
          <button
            onClick={checkConfiguration}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Configuration'
            )}
          </button>
        </div>

        {config && (
          <div className="space-y-3">
            <div className="flex items-center">
              {config.configured ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`font-medium ${config.configured ? 'text-green-700' : 'text-red-700'}`}>
                {config.configured ? 'SMS is configured and ready' : 'SMS is not properly configured'}
              </span>
            </div>

            {config.provider && (
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">Active Provider</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{config.provider}</p>
              </div>
            )}

            {config.errors && config.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm font-medium text-red-800 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Configuration Errors:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {config.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test SMS Send */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Send Test SMS
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="testPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="testPhone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+254712345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter phone number in international format (e.g., +254712345678)</p>
          </div>

          <div>
            <label htmlFor="testMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="testMessage"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={4}
              maxLength={1530}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {testMessage.length} / 1530 characters
            </p>
          </div>

          <button
            onClick={sendTestSms}
            disabled={testing || !config?.configured}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
          >
            {testing ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Sending Test SMS...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Test SMS
              </>
            )}
          </button>

          {!config?.configured && (
            <p className="text-sm text-amber-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Please check SMS configuration before sending test messages
            </p>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-6 p-4 rounded-lg border ${
            testResult.status === 'SUCCESS'
              ? 'bg-green-50 border-green-200'
              : testResult.status === 'QUEUED'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {testResult.status === 'SUCCESS' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              ) : testResult.status === 'QUEUED' ? (
                <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  testResult.status === 'SUCCESS'
                    ? 'text-green-800'
                    : testResult.status === 'QUEUED'
                      ? 'text-amber-800'
                      : 'text-red-800'
                }`}>
                  {testResult.status === 'SUCCESS'
                    ? 'Test SMS Sent Successfully!'
                    : testResult.status === 'QUEUED'
                      ? 'SMS Accepted and Queued for Delivery ✓'
                      : 'Test SMS Failed'}
                </p>
                
                <div className="mt-2 space-y-1 text-sm">
                  <div className={
                    testResult.status === 'SUCCESS'
                      ? 'text-green-700'
                      : testResult.status === 'QUEUED'
                        ? 'text-amber-700'
                        : 'text-red-700'
                  }>
                    <span className="font-medium">Provider:</span> {testResult.provider}
                  </div>

                  {testResult.statusGroup && (
                    <div className={testResult.status === 'FAILED' ? 'text-red-700' : 'text-amber-700'}>
                      <span className="font-medium">Status:</span> {testResult.statusGroup}
                      {testResult.statusName ? ` (${testResult.statusName})` : ''}
                    </div>
                  )}

                  {testResult.statusDescription && (
                    <div className={testResult.status === 'FAILED' ? 'text-red-700' : 'text-amber-700'}>
                      <span className="font-medium">Details:</span> {testResult.statusDescription}
                    </div>
                  )}

                  {testResult.status === 'QUEUED' && (
                    <div className="mt-2 pt-2 border-t border-amber-200 text-amber-700 text-xs">
                      ℹ️ <strong>Note:</strong> The SMS was successfully accepted by {testResult.provider} and queued for delivery. 
                      Delivery typically occurs within seconds to a few minutes depending on network conditions.
                    </div>
                  )}
                  
                  {testResult.messageId && (
                    <div className="text-green-700">
                      <span className="font-medium">Message ID:</span> {testResult.messageId}
                    </div>
                  )}
                  
                  {testResult.cost !== undefined && testResult.cost !== null && (
                    <div className="text-green-700">
                      <span className="font-medium">Cost:</span> KES {testResult.cost.toFixed(2)}
                    </div>
                  )}
                  
                  {testResult.error && (
                    <div className="text-red-700">
                      <span className="font-medium">Error:</span> {testResult.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">SMS Provider Information</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>AppSMS:</strong> Primary SMS provider for Kenya market. Configured with API key: mMi9OqjFy0s3ttxgmQUnIH8A3QoLuwn6
          </p>
          <p>
            <strong>TextSMS.co.ke:</strong> Secondary fallback provider. API key: dd16c128-63c1-42b4-ae01-d6915b591821
          </p>
          <p>
            <strong>Africa&apos;s Talking:</strong> Tertiary fallback provider configured for testing.
          </p>
          <p className="mt-3">
            <strong>Note:</strong> The system automatically selects the first available and properly configured provider.
          </p>
        </div>
      </div>
    </div>
  );
}
