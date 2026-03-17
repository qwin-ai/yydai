// Database types - These will be generated from Supabase
// Run: npx supabase gen types typescript --project-id <project-id> > src/types/database.ts

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  credits_balance: number;
  plan: 'free' | 'pro' | 'enterprise';
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  daily_limit: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QuotaUsage {
  id: number;
  user_id: string;
  service_type: 'search' | 'storage' | 'voice';
  metric_type: string;
  used_value: number;
  limit_value: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'usage' | 'refund' | 'gift' | 'adjustment';
  amount: number;
  balance_after: number;
  service_type: string | null;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string | null;
  created_at: string;
}

export interface StorageFile {
  id: string;
  user_id: string;
  filename: string;
  oss_key: string;
  oss_bucket: string;
  size: number;
  mime_type: string | null;
  status: 'uploading' | 'active' | 'deleted';
  cdn_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface VoiceRecord {
  id: string;
  user_id: string;
  voice_id: string;
  voice_name: string | null;
  voice_type: 'clone' | 'design';
  clone_from_audio_url: string | null;
  output_audio_url: string | null;
  output_duration_seconds: number | null;
  text_content: string | null;
  status: 'processing' | 'completed' | 'failed';
  credits_used: number;
  created_at: string;
  completed_at: string | null;
}

export interface SearchRecord {
  id: string;
  user_id: string;
  api_key_id: string | null;
  query: string;
  search_type: 'web' | 'news' | 'image' | 'video';
  results_count: number;
  credits_used: number;
  created_at: string;
}