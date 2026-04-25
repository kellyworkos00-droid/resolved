import { z } from 'zod';

/**
 * Validation Schemas for Kelly OS Bank Reconciliation Module
 * Production-ready validation with strict rules
 */

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum([
    'ADMIN',
    'OWNER',
    'FINANCE_MANAGER',
    'FINANCE_STAFF',
    'VIEWER',
    'POS_OPERATOR',
    'MARKETING_AGENT',
    'SALES_AGENT',
  ]),
});

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

export const createCustomerSchema = z.object({
  customerCode: z.string().min(1, 'Customer code is required').max(20),
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  billingAddress: z.string().max(500).optional().or(z.literal('')),
  creditLimit: z.number().nonnegative().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  clientName: z.string().min(1, 'Client name is required').max(200),
  tenderReference: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  quotedAmount: z.number().nonnegative('Quoted amount cannot be negative').default(0),
  estimatedExpenses: z.number().nonnegative('Estimated expenses cannot be negative').default(0),
  actualExpenses: z.number().nonnegative('Actual expenses cannot be negative').default(0),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  projectManager: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

// ============================================================================
// SUPPLIER SCHEMAS
// ============================================================================

export const createSupplierSchema = z.object({
  supplierCode: z.string().min(1, 'Supplier code is required').max(20),
  name: z.string().min(1, 'Supplier name is required').max(200),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ============================================================================
// SUPPLIER BILL SCHEMAS
// ============================================================================

export const createSupplierBillSchema = z.object({
  supplierId: z.string().cuid('Invalid supplier ID'),
  totalAmount: z.number().positive('Total amount must be positive'),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  purchaseOrderId: z.string().cuid('Invalid purchase order ID').optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const createSupplierPaymentSchema = z.object({
  billId: z.string().cuid('Invalid bill ID'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.string().max(50).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// INVOICE SCHEMAS
// ============================================================================

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerId: z.string().cuid('Invalid customer ID'),
  subtotal: z.number().positive('Subtotal must be positive'),
  taxAmount: z.number().nonnegative('Tax amount cannot be negative').default(0),
  totalAmount: z.number().positive('Total amount must be positive'),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  description: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

// ============================================================================
// SALES QUOTE & SALES ORDER SCHEMAS
// ============================================================================

const salesItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
});

export const createSalesQuoteSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  items: z.array(salesItemSchema).min(1, 'At least one item is required'),
  tax: z.number().nonnegative().optional().default(0),
  validUntil: z.string().or(z.date()).optional(),
  notes: z.string().max(1000).optional(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  items: z.array(salesItemSchema).min(1, 'At least one item is required'),
  tax: z.number().nonnegative().optional().default(0),
  quoteId: z.string().cuid('Invalid quote ID').optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// PURCHASE ORDER SCHEMAS
// ============================================================================

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().cuid('Invalid supplier ID'),
  items: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
        unitCost: z.number().positive('Unit cost must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  tax: z.number().nonnegative().optional().default(0),
  expectedDate: z.string().or(z.date()).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// WAREHOUSE & STOCK SCHEMAS
// ============================================================================

export const createWarehouseSchema = z.object({
  code: z.string().min(1, 'Warehouse code is required').max(20),
  name: z.string().min(1, 'Warehouse name is required').max(200),
  address: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const createWarehouseLocationSchema = z.object({
  warehouseId: z.string().cuid('Invalid warehouse ID'),
  code: z.string().min(1, 'Location code is required').max(20),
  name: z.string().min(1, 'Location name is required').max(200),
});

export const createStockAdjustmentSchema = z.object({
  locationId: z.string().cuid('Invalid location ID'),
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int('Quantity must be an integer'),
  reason: z.string().max(200).optional(),
  reference: z.string().max(100).optional(),
});

export const createStockTransferSchema = z.object({
  fromLocationId: z.string().cuid('Invalid from location ID'),
  toLocationId: z.string().cuid('Invalid to location ID'),
  items: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
});

export const createProductReturnSchema = z.object({
  returnType: z.enum(['CUSTOMER_RETURN', 'SUPPLIER_RETURN', 'DAMAGED', 'WARRANTY']),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  customerId: z.string().cuid('Invalid customer ID').optional(),
  supplierId: z.string().cuid('Invalid supplier ID').optional(),
  reason: z.string().min(1, 'Reason is required').max(500),
  restockFee: z.number().nonnegative('Restock fee cannot be negative').optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        locationId: z.string().cuid('Invalid location ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
        unitPrice: z.number().nonnegative('Unit price cannot be negative'),
        condition: z.string().optional(),
        restockable: z.boolean().optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1, 'At least one item is required'),
});

// ============================================================================
// EXPENSE SCHEMAS
// ============================================================================

export const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  categoryId: z.string().cuid('Invalid category ID').optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(1000).optional(),
  expenseDate: z.string().or(z.date()),
  paymentMethod: z.string().max(50).optional(),
  vendor: z.string().max(200).optional(),
  reference: z.string().max(100).optional(),
});

// ============================================================================
// EXPENSE CATEGORY SCHEMAS
// ============================================================================

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  monthlyBudget: z.number().nonnegative('Budget cannot be negative').optional().default(0),
  alertThresholdPercent: z
    .number()
    .min(1, 'Alert threshold must be at least 1%')
    .max(100, 'Alert threshold cannot exceed 100%')
    .optional()
    .default(80),
});

// ============================================================================
// BANK STATEMENT UPLOAD SCHEMAS
// ============================================================================

export const bankTransactionSchema = z.object({
  bankTransactionId: z.string().min(1, 'Transaction ID is required'),
  transactionDate: z.string().or(z.date()),
  amount: z.number().positive('Amount must be positive'),
  reference: z.string().min(1, 'Reference is required'),
  valueDate: z.string().or(z.date()).optional(),
  debitAccount: z.string().optional(),
  creditAccount: z.string().optional(),
  balance: z.number().optional(),
  currency: z.string().default('KES'),
});

export const uploadStatementSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive(),
  transactions: z.array(bankTransactionSchema).min(1, 'At least one transaction required'),
});

// ============================================================================
// RECONCILIATION SCHEMAS
// ============================================================================

export const manualMatchSchema = z.object({
  bankTransactionId: z.string().cuid('Invalid transaction ID'),
  customerId: z.string().cuid('Invalid customer ID'),
  invoiceId: z.string().cuid('Invalid invoice ID').optional(),
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().max(1000).optional(),
});

export const rejectTransactionSchema = z.object({
  bankTransactionId: z.string().cuid('Invalid transaction ID'),
  reason: z.string().min(1, 'Reason is required').max(500),
});

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const createPaymentSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  invoiceId: z.string().cuid('Invalid invoice ID').optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().or(z.date()),
  reference: z.string().min(1, 'Reference is required'),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
});

export const reconciliationFilterSchema = z.object({
  status: z.enum(['PENDING', 'MATCHED', 'UNMATCHED', 'PARTIALLY_MATCHED', 'REJECTED']).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  ...paginationSchema.shape,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateSupplierBillInput = z.infer<typeof createSupplierBillSchema>;
export type CreateSupplierPaymentInput = z.infer<typeof createSupplierPaymentSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreateSalesQuoteInput = z.infer<typeof createSalesQuoteSchema>;
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type CreateWarehouseLocationInput = z.infer<typeof createWarehouseLocationSchema>;
export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>;
export type CreateStockTransferInput = z.infer<typeof createStockTransferSchema>;
export type BankTransactionInput = z.infer<typeof bankTransactionSchema>;
export type UploadStatementInput = z.infer<typeof uploadStatementSchema>;
export type ManualMatchInput = z.infer<typeof manualMatchSchema>;
export type RejectTransactionInput = z.infer<typeof rejectTransactionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ReconciliationFilterInput = z.infer<typeof reconciliationFilterSchema>;

// ============================================================================
// CREDIT NOTE SCHEMAS
// ============================================================================

export const createCreditNoteSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceId: z.string().optional(),
  creditNoteType: z.enum(['REFUND', 'RETURN', 'ADJUSTMENT', 'DISCOUNT', 'DAMAGED', 'ERROR_CORRECTION']),
  reason: z.string().min(1, 'Reason is required').max(500),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().nonnegative('Unit price cannot be negative'),
    taxRate: z.number().min(0).max(100).default(0),
    productId: z.string().optional(),
    sku: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

export const updateCreditNoteSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'APPLIED', 'CANCELLED']).optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
});

export type CreateCreditNoteInput = z.infer<typeof createCreditNoteSchema>;
export type UpdateCreditNoteInput = z.infer<typeof updateCreditNoteSchema>;
