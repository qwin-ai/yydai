// Placeholder for database types
// Run: npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits_balance?: number;
          plan?: 'free' | 'pro' | 'enterprise';
          plan_expires_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          credits_balance?: number;
          plan?: 'free' | 'pro' | 'enterprise';
          plan_expires_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          permissions?: string[];
          rate_limit?: number;
          daily_limit?: number;
          last_used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          permissions?: string[];
          rate_limit?: number;
          daily_limit?: number;
          last_used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      quota_usage: {
        Row: {
          id: number;
          user_id: string;
          service_type: string;
          metric_type: string;
          used_value: number;
          limit_value: number;
          period_start: string;
          period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          service_type: string;
          metric_type: string;
          used_value?: number;
          limit_value?: number;
          period_start: string;
          period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          service_type?: string;
          metric_type?: string;
          used_value?: number;
          limit_value?: number;
          period_start?: string;
          period_end?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          balance_after: number;
          service_type: string | null;
          stripe_payment_intent_id: string | null;
          status: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          balance_after: number;
          service_type?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          balance_after?: number;
          service_type?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      storage_files: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          oss_key: string;
          oss_bucket: string;
          size: number;
          mime_type: string | null;
          status: string;
          cdn_url: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          oss_key: string;
          oss_bucket: string;
          size: number;
          mime_type?: string | null;
          status?: string;
          cdn_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          oss_key?: string;
          oss_bucket?: string;
          size?: number;
          mime_type?: string | null;
          status?: string;
          cdn_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      voice_records: {
        Row: {
          id: string;
          user_id: string;
          voice_id: string;
          voice_name: string | null;
          voice_type: string;
          clone_from_audio_url: string | null;
          output_audio_url: string | null;
          output_duration_seconds: number | null;
          text_content: string | null;
          status: string;
          credits_used: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          voice_id: string;
          voice_name?: string | null;
          voice_type: string;
          clone_from_audio_url?: string | null;
          output_audio_url?: string | null;
          output_duration_seconds?: number | null;
          text_content?: string | null;
          status?: string;
          credits_used?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          voice_id?: string;
          voice_name?: string | null;
          voice_type?: string;
          clone_from_audio_url?: string | null;
          output_audio_url?: string | null;
          output_duration_seconds?: number | null;
          text_content?: string | null;
          status?: string;
          credits_used?: number;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      search_records: {
        Row: {
          id: string;
          user_id: string;
          api_key_id: string | null;
          query: string;
          search_type: string;
          results_count: number;
          results_json: unknown | null;
          credits_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_key_id?: string | null;
          query: string;
          search_type?: string;
          results_count?: number;
          results_json?: unknown | null;
          credits_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          api_key_id?: string | null;
          query?: string;
          search_type?: string;
          results_count?: number;
          results_json?: unknown | null;
          credits_used?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}