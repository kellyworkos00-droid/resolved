import { prisma } from '@/lib/prisma';
import type { AlertInstance, AlertRule } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { createNotification, NotificationType, NotificationSeverity } from '@/lib/notification-service';
import { broadcastAlert } from '@/lib/websocket-manager';

export enum AlertEventType {
  UNMATCHED_TRANSACTION = 'UNMATCHED_TRANSACTION',
  FAILED_MATCH = 'FAILED_MATCH',
  HIGH_VALUE_PAYMENT = 'HIGH_VALUE_PAYMENT',
  OVERDUE_INVOICE = 'OVERDUE_INVOICE',
  FAILED_RECONCILIATION = 'FAILED_RECONCILIATION',
  BLOCKED_TRANSACTION = 'BLOCKED_TRANSACTION',
  DUPLICATE_DETECTED = 'DUPLICATE_DETECTED',
  ACCOUNT_BALANCE_LOW = 'ACCOUNT_BALANCE_LOW',
  LARGE_EXPENSE = 'LARGE_EXPENSE',
  UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY',
}

export interface AlertTriggerParams {
  eventType: AlertEventType | string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  values: Record<string, unknown>; // Dynamic values to check against conditions
  userId?: string; // Optional specific user to alert
}

type AlertInstanceWithRule = Prisma.AlertInstanceGetPayload<{
  include: { alertRule: true };
}>;

/**
 * Trigger alerts based on event type and conditions
 */
export async function triggerAlerts(params: AlertTriggerParams): Promise<void> {
  try {
    // Find all active rules for this event type
    const rules = await prisma.alertRule.findMany({
      where: {
        eventType: params.eventType,
        enabled: true,
      },
    });

    for (const rule of rules) {
      // Check if conditions match
      const conditions = (rule.triggerCondition || {}) as Record<string, unknown>;
      if (evaluateConditions(conditions, params.values)) {
        // Create alert instance
        const alertInstance = await prisma.alertInstance.create({
          data: {
            alertRuleId: rule.id,
            relatedEntityId: params.relatedEntityId,
            relatedEntityType: params.relatedEntityType,
            status: 'ACTIVE',
            severity: rule.priority,
            title: rule.name,
            message: rule.description || '',
            metadata: (params.values as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          },
        });

        // Notify users
        if (rule.notifyUsers) {
          await notifyUsersForAlert(rule, alertInstance, params);
        }

        // Send webhook if configured
        if (rule.webhookUrl) {
          await sendWebhook(rule.webhookUrl, alertInstance, params);
        }
      }
    }
  } catch (error) {
    console.error('Error triggering alerts:', error);
  }
}

/**
 * Evaluate conditions against values
 */
function evaluateConditions(
  conditions: Record<string, unknown>,
  values: Record<string, unknown>
): boolean {
  for (const [key, condition] of Object.entries(conditions)) {
    const value = values[key];

    if (value === undefined) {
      return false;
    }

    // Support various comparison operators
    if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
      // Handle nested conditions like { "gt": 10000, "lt": 50000 }
      for (const [operator, operand] of Object.entries(condition as Record<string, unknown>)) {
        if (!evaluateOperator(value, operator, operand)) {
          return false;
        }
      }
    } else if (value !== condition) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a single comparison operator
 */
function evaluateOperator(value: unknown, operator: string, operand: unknown): boolean {
  switch (operator) {
    case 'eq':
      return value === operand;
    case 'ne':
      return value !== operand;
    case 'gt':
      return Number(value) > Number(operand);
    case 'gte':
      return Number(value) >= Number(operand);
    case 'lt':
      return Number(value) < Number(operand);
    case 'lte':
      return Number(value) <= Number(operand);
    case 'in':
      return Array.isArray(operand) && operand.includes(value as never);
    case 'nin':
      return !Array.isArray(operand) || !operand.includes(value as never);
    case 'contains':
      return String(value).includes(String(operand));
    case 'startsWith':
      return String(value).startsWith(String(operand));
    case 'endsWith':
      return String(value).endsWith(String(operand));
    default:
      return false;
  }
}

/**
 * Notify users for an alert
 */
async function notifyUsersForAlert(
  rule: AlertRule,
  alertInstance: AlertInstance,
  params: AlertTriggerParams
): Promise<void> {
  try {
    let targetUserIds: string[] = [];

    if (params.userId) {
      // Alert specific user
      targetUserIds = [params.userId];
    } else if (rule.emailRecipients) {
      // Alert specific email recipients
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: rule.emailRecipients.split(',').map((e: string) => e.trim()),
          },
        },
      });
      targetUserIds = users.map((u: any) => u.id);
    } else {
      // Alert all users with appropriate roles
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'FINANCE_MANAGER'] },
          isActive: true,
        },
      });
      targetUserIds = users.map((u: any) => u.id);
    }

    // Create notifications for each user
    for (const userId of targetUserIds) {
      await createNotification({
        userId,
        type: NotificationType.EXCEPTION_ALERT,
        title: alertInstance.title,
        message: alertInstance.message,
        severity: mapSeverity(alertInstance.severity),
        category: 'alert',
        relatedEntityId: params.relatedEntityId,
        relatedEntityType: params.relatedEntityType,
        metadata: params.values,
        sendEmail: rule.notifyEmail,
      });

      // Broadcast real-time alert
      await broadcastAlert(userId, {
        id: alertInstance.id,
        type: params.eventType,
        title: alertInstance.title,
        message: alertInstance.message,
        severity: mapSeverity(alertInstance.severity),
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('Error notifying users for alert:', error);
  }
}

/**
 * Map severity levels
 */
function mapSeverity(priority: string): NotificationSeverity {
  switch (priority) {
    case 'LOW':
      return NotificationSeverity.INFO;
    case 'MEDIUM':
      return NotificationSeverity.WARNING;
    case 'HIGH':
      return NotificationSeverity.ERROR;
    case 'CRITICAL':
      return NotificationSeverity.CRITICAL;
    default:
      return NotificationSeverity.WARNING;
  }
}

/**
 * Send webhook notification
 */
async function sendWebhook(
  webhookUrl: string,
  alertInstance: AlertInstance,
  params: AlertTriggerParams
): Promise<void> {
  try {
    const payload = {
      alertId: alertInstance.id,
      eventType: params.eventType,
      severity: alertInstance.severity,
      title: alertInstance.title,
      message: alertInstance.message,
      entityId: params.relatedEntityId,
      entityType: params.relatedEntityType,
      values: params.values,
      timestamp: new Date(),
    };

    // Send webhook in background (don't await)
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.error(`Webhook failed for ${webhookUrl}:`, error);
    });
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

/**
 * Create or get default alert rules
 */
export async function createDefaultAlertRules(): Promise<void> {
  const defaultRules = [
    {
      name: 'Unmatched Transactions',
      eventType: AlertEventType.UNMATCHED_TRANSACTION,
      description: 'Alert when transactions remain unmatched after reconciliation',
      priority: 'MEDIUM',
      triggerCondition: { status: 'UNMATCHED' },
    },
    {
      name: 'failed Matches',
      eventType: AlertEventType.FAILED_MATCH,
      description: 'Alert on transaction matching failures',
      priority: 'HIGH',
      triggerCondition: { matchStatus: 'FAILED' },
    },
    {
      name: 'High Value Payment',
      eventType: AlertEventType.HIGH_VALUE_PAYMENT,
      description: 'Alert for payments exceeding $10,000',
      priority: 'HIGH',
      triggerCondition: { amount: { gte: 10000 } },
    },
    {
      name: 'Overdue Invoices',
      eventType: AlertEventType.OVERDUE_INVOICE,
      description: 'Alert for invoices overdue by more than 30 days',
      priority: 'MEDIUM',
      triggerCondition: { daysOverdue: { gt: 30 } },
    },
    {
      name: 'Failed Reconciliation',
      eventType: AlertEventType.FAILED_RECONCILIATION,
      description: 'Alert when reconciliation process fails',
      priority: 'CRITICAL',
      triggerCondition: { status: 'FAILED' },
    },
    {
      name: 'Blocked Transactions',
      eventType: AlertEventType.BLOCKED_TRANSACTION,
      description: 'Alert on manually blocked transactions',
      priority: 'HIGH',
      triggerCondition: { blocked: true },
    },
    {
      name: 'Duplicate Detection',
      eventType: AlertEventType.DUPLICATE_DETECTED,
      description: 'Alert when duplicate transactions are detected',
      priority: 'HIGH',
      triggerCondition: { isDuplicate: true },
    },
    {
      name: 'Unusual Activity',
      eventType: AlertEventType.UNUSUAL_ACTIVITY,
      description: 'Alert on unusual transaction activity patterns',
      priority: 'WARNING',
      triggerCondition: { unusual: true },
    },
  ];

  for (const rule of defaultRules) {
    const exists = await prisma.alertRule.findFirst({
      where: {
        eventType: rule.eventType,
      },
    });

    if (!exists) {
      await prisma.alertRule.create({
        data: {
          name: rule.name,
          description: rule.description,
          eventType: rule.eventType,
          priority: rule.priority,
          triggerCondition: rule.triggerCondition,
          enabled: true,
          notifyUsers: true,
          notifyEmail: false,
          cooldownMinutes: 60,
          maxAlertsPerDay: 100,
        },
      });
    }
  }

  console.log('✅ Default alert rules created');
}

/**
 * Acknowledge/resolve alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<AlertInstance> {
  return prisma.alertInstance.update({
    where: { id: alertId },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string): Promise<AlertInstance> {
  return prisma.alertInstance.update({
    where: { id: alertId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get active alerts for display
 */
export async function getActiveAlerts(
  options: {
    skip?: number;
    take?: number;
    userId?: string;
    severity?: string;
    eventType?: string;
  } = {}
): Promise<AlertInstanceWithRule[]> {
  const { skip = 0, take = 50, userId, severity, eventType } = options;

  const where: Prisma.AlertInstanceWhereInput = {
    status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
  };

  if (userId) where.acknowledgedBy = userId;
  if (severity) where.severity = severity;
  if (eventType) where.alertRule = { eventType };

  return prisma.alertInstance.findMany({
    where,
    include: { alertRule: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
}
