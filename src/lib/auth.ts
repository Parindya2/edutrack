
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Base64 URL encode (Edge Runtime compatible)
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode (Edge Runtime compatible)
 */
function base64UrlDecode(str: string): string {
  str += '='.repeat(4 - (str.length % 4));
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

/**
 * Create HMAC signature using Web Crypto API (Edge Runtime compatible)
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
  
  return signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Verify HMAC signature using Web Crypto API (Edge Runtime compatible)
 */
async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const expectedSignature = await createSignature(data, secret);
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generate a JWT token (Edge Runtime compatible)
 */
export async function generateToken(payload: any): Promise<string> {
  console.log('Generating token with payload:', payload);
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    userId: payload.userId || payload.id,
    id: payload.userId || payload.id,
    email: payload.email,
    fullName: payload.fullName,
    type: payload.type || 'teacher',
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  };
  
  console.log('Final token payload:', tokenPayload);
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await createSignature(data, JWT_SECRET);
  const token = `${data}.${signature}`;
  
  console.log('Token generated successfully, length:', token.length);
  return token;
}

/**
 * Verify a JWT token (Edge Runtime compatible)
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    console.log('Verifying token, length:', token?.length);
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format - must have 3 parts');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    // Verify signature
    const isValidSignature = await verifySignature(data, signature, JWT_SECRET);
    if (!isValidSignature) {
      throw new Error('Invalid token signature');
    }
    
    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }
    
    console.log('Token verified successfully:', {
      userId: payload.userId,
      id: payload.id,
      email: payload.email,
      type: payload.type,
      exp: payload.exp,
      iat: payload.iat
    });
    
    return payload;
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }

  return { valid: true };
}

/**
 * Extract user ID from JWT token
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const decoded = await verifyToken(token);
    return decoded.userId || decoded.id || null;
  } catch {
    return null;
  }
}