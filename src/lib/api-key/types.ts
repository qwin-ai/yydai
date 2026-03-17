export interface APIKeyValidationResult {
  valid: boolean;
  userId?: string;
  keyId?: string;
  permissions?: string[];
  error?: string;
}

export interface APIKeyData {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  daily_limit: number;
  is_active: boolean;
  expires_at: string | null;
}