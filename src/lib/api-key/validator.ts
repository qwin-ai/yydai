import { createClient, getServiceClient } from '@/lib/supabase/server';
import { hashApiKey, isValidApiKeyFormat } from './generator';
import type { APIKeyValidationResult, APIKeyData } from './types';

/**
 * Validate an API key against the database
 */
export async function validateApiKey(apiKey: string): Promise<APIKeyValidationResult> {
  // Check format first
  if (!isValidApiKeyFormat(apiKey)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    const supabase = getServiceClient() as any;
    
    // Hash the key for lookup
    const keyHash = hashApiKey(apiKey);
    
    // Query database
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name, permissions, rate_limit, daily_limit, is_active, expires_at')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    return {
      valid: true,
      userId: data.user_id,
      keyId: data.id,
      permissions: data.permissions,
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false, error: 'Failed to validate API key' };
  }
}

/**
 * Get API key by ID
 */
export async function getApiKeyById(keyId: string, userId: string): Promise<APIKeyData | null> {
  try {
    const supabase = getServiceClient() as any;
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as APIKeyData;
  } catch {
    return null;
  }
}

/**
 * List all API keys for a user
 */
export async function listUserApiKeys(userId: string): Promise<APIKeyData[]> {
  try {
    const supabase = getServiceClient() as any;
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_prefix, permissions, rate_limit, daily_limit, is_active, expires_at, created_at, last_used_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as APIKeyData[];
  } catch {
    return [];
  }
}

/**
 * Update last used timestamp
 */
export async function updateKeyLastUsed(keyId: string): Promise<void> {
  try {
    const supabase = getServiceClient() as any;
    
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId);
  } catch (error) {
    console.error('Failed to update key last used:', error);
  }
}