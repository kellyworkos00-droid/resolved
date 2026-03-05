import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// UserRole enum values for type safety
export type UserRole = 'ADMIN' | 'FINANCE_MANAGER' | 'FINANCE_STAFF' | 'VIEWER';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set or too short. Use a secure secret in production!');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for authenticated user
 * @param payload - User data to encode in token
 * @returns JWT token string
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Verify request authentication from Authorization header
 * @param request - Incoming request object
 * @returns Decoded JWT payload or null if invalid/missing token
 */
export async function verifyAuth(request: Request): Promise<JWTPayload | null> {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * User type for database (matches Prisma schema)
 */
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string; // Stored as string in database, should be UserRole
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

/**
 * Public user data (safe to send to client)
 */
export type PublicUser = Omit<User, 'password'>;

/**
 * Remove sensitive fields from user object
 * @param user - User object from database
 * @returns User object without password
 */
export function toPublicUser(user: User): PublicUser {
  const publicUser = { ...user } as Partial<User>;
  delete publicUser.password;
  return publicUser as PublicUser;
}
