import { randomBytes, createHash } from 'crypto';

const API_KEY_PREFIX = 'yyd_';
const API_KEY_LENGTH = 32;

/**
 * Generate a new API key
 * Format: yyd_<32 random characters>
 */
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  // Generate random key
  const randomString = randomBytes(API_KEY_LENGTH)
    .toString('base64')
    .replace(/[+/=]/g, '') // Remove special chars
    .slice(0, API_KEY_LENGTH);
  
  const key = `${API_KEY_PREFIX}${randomString}`;
  const keyHash = hashApiKey(key);
  const keyPrefix = key.slice(0, 8); // yyd_xxxx for display
  
  return { key, keyHash, keyPrefix };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Check prefix
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false;
  }
  
  // Check length (prefix + 32 chars)
  const keyBody = key.slice(API_KEY_PREFIX.length);
  if (keyBody.length < 20 || keyBody.length > 64) {
    return false;
  }
  
  // Check characters (alphanumeric only)
  if (!/^[a-zA-Z0-9]+$/.test(keyBody)) {
    return false;
  }
  
  return true;
}

/**
 * Extract key prefix for display
 */
export function getKeyPrefix(key: string): string {
  return key.slice(0, 8);
}