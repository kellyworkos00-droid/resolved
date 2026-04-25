// UserRole enum values for type safety
type UserRole =
  | 'ADMIN'
  | 'OWNER'
  | 'FINANCE_MANAGER'
  | 'FINANCE_STAFF'
  | 'VIEWER'
  | 'POS_OPERATOR'
  | 'MARKETING_AGENT'
  | 'SALES_AGENT';
import { NextRequest } from 'next/server';
import { extractToken, verifyToken, JWTPayload } from './auth';
import prisma from './prisma';

/**
 * Permission levels for different roles
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'], // Full access
  OWNER: ['*'],
  POS_OPERATOR: [
    'pos.view',
    'pos.create',
    'pos.edit',
    'pos.checkout',
    'pos.payment',
    'invoice.view',
    'customer.view',
  ],
  MARKETING_AGENT: [
    'customer.view',
    'marketing_form.create',
    'marketing_form.view',
    'marketing_form.edit',
  ],
  SALES_AGENT: [
    'customer.view',
    'marketing_form.create',
    'marketing_form.view',
    'marketing_form.edit',
  ],
  FINANCE_MANAGER: [
    'reconciliation.upload',
    'reconciliation.match',
    'reconciliation.view',
    'customer.create',
    'customer.edit',
    'customer.view',
    'invoice.create',
    'invoice.edit',
    'invoice.view',
    'payment.create',
    'payment.view',
    'reports.view',
    'audit.view',
    'supplier.view',
    'supplier.create',
    'supplier_bill.view',
    'supplier_bill.create',
    'supplier_bill.pay',
    'purchase_order.view',
    'purchase_order.create',
    'purchase_order.approve',
    'purchase_order.send',
    'purchase_order.receive',
    'expense.view',
    'expense.create',
    'expense_category.view',
    'expense_category.create',
    'supplier_bill.approve',
    'supplier_bill.match',
    'sales_quote.create',
    'sales_quote.view',
    'sales_quote.send',
    'sales_quote.accept',
    'sales_quote.decline',
    'sales_order.create',
    'sales_order.view',
    'sales_order.submit',
    'sales_order.approve',
    'sales_order.deliver',
    'sales_order.invoice',
    'sales_order.cancel',
    'warehouse.view',
    'warehouse.create',
    'warehouse.edit',
    'warehouse.update',
    'stock.view',
    'stock.adjust',
    'stock.transfer',
    'hr.view',
    'hr.create',
    'hr.edit',
    'employee.view',
    'employee.create',
    'employee.edit',
    'employee.delete',
    'department.view',
    'department.create',
    'payroll.view',
    'payroll.create',
    'leave.view',
    'leave.create',
    'leave.approve',
  ],
  FINANCE_STAFF: [
    'reconciliation.upload',
    'reconciliation.match',
    'reconciliation.view',
    'customer.create',
    'customer.edit',
    'customer.view',
    'invoice.view',
    'invoice.collect',
    'payment.create',
    'payment.view',
    'reports.view',
    'supplier.view',
    'supplier_bill.view',
    'purchase_order.view',
    'expense.view',
    'expense_category.view',
    'sales_quote.view',
    'sales_order.view',
    'warehouse.view',
    'stock.view',
    'stock.adjust',
    'stock.transfer',
  ],
  VIEWER: [
    'reconciliation.view',
    'customer.view',
    'invoice.view',
    'payment.view',
    'reports.view',
    'supplier.view',
    'supplier_bill.view',
    'purchase_order.view',
    'expense.view',
    'expense_category.view',
    'sales_quote.view',
    'sales_order.view',
    'warehouse.view',
    'stock.view',
  ],
};

/**
 * Check if a role has a specific permission
 * @param role - User role
 * @param permission - Permission to check
 * @returns True if role has permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Check if user has any of the required roles
 * @param userRole - User's role
 * @param requiredRoles - Array of allowed roles
 * @returns True if user has one of the required roles
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Extract and verify user from request
 * @param request - Next.js request object
 * @returns User payload or null if unauthorized
 */
export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return payload;
}

/**
 * Require authentication middleware
 * @param request - Next.js request
 * @returns Authenticated user payload
 * @throws Error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await authenticateRequest(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require specific roles middleware
 * @param request - Next.js request
 * @param roles - Required roles
 * @returns Authenticated user payload
 * @throws Error if not authorized
 */
export async function requireRoles(request: NextRequest, roles: UserRole[]): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (!hasRole(user.role, roles)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return user;
}

/**
 * Require specific permission middleware
 * @param request - Next.js request
 * @param permission - Required permission
 * @returns Authenticated user payload
 * @throws Error if not authorized
 */
export async function requirePermission(request: NextRequest, permission: string): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (!hasPermission(user.role, permission)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return user;
}
