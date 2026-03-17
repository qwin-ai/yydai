-- YYD.AI Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PROFILES TABLE
-- ========================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    credits_balance INTEGER DEFAULT 100 NOT NULL,  -- Free tier: 100 credits
    plan VARCHAR(20) DEFAULT 'free' NOT NULL,
    plan_expires_at TIMESTAMPTZ,
    stripe_customer_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_plan CHECK (plan IN ('free', 'pro', 'enterprise'))
);

-- Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX idx_profiles_plan ON public.profiles(plan);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================================
-- API KEYS TABLE
-- ========================================
CREATE TABLE public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(128) NOT NULL,
    key_prefix VARCHAR(12) NOT NULL,
    permissions JSONB DEFAULT '["search","storage","voice"]'::jsonb,
    rate_limit INTEGER DEFAULT 100,
    daily_limit INTEGER DEFAULT 1000,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE UNIQUE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active);

-- ========================================
-- API KEY LOGS TABLE
-- ========================================
CREATE TABLE public.api_key_logs (
    id BIGSERIAL PRIMARY KEY,
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    service_type VARCHAR(20) NOT NULL,
    credits_used INTEGER DEFAULT 0 NOT NULL,
    request_size INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    status_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_api_key_logs_key_id ON public.api_key_logs(api_key_id);
CREATE INDEX idx_api_key_logs_user_id ON public.api_key_logs(user_id);
CREATE INDEX idx_api_key_logs_created ON public.api_key_logs(created_at);
CREATE INDEX idx_api_key_logs_service ON public.api_key_logs(service_type);

-- ========================================
-- QUOTA USAGE TABLE
-- ========================================
CREATE TABLE public.quota_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_type VARCHAR(20) NOT NULL,
    metric_type VARCHAR(30) NOT NULL,
    used_value BIGINT DEFAULT 0 NOT NULL,
    limit_value BIGINT DEFAULT 0 NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    last_request_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT unique_user_period_metric UNIQUE (user_id, service_type, metric_type, period_start)
);

-- Indexes
CREATE INDEX idx_quota_usage_user ON public.quota_usage(user_id);
CREATE INDEX idx_quota_usage_period ON public.quota_usage(period_start, period_end);
CREATE INDEX idx_quota_usage_service ON public.quota_usage(service_type);

CREATE TRIGGER quota_usage_updated_at
    BEFORE UPDATE ON public.quota_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================================
-- TRANSACTIONS TABLE
-- ========================================
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    service_type VARCHAR(20),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(100),
    stripe_checkout_session_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed' NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_transaction_type CHECK (type IN ('purchase', 'usage', 'refund', 'gift', 'adjustment')),
    CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Indexes
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_stripe_payment ON public.transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_stripe_session ON public.transactions(stripe_checkout_session_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- ========================================
-- STORAGE FILES TABLE
-- ========================================
CREATE TABLE public.storage_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    oss_key VARCHAR(500) NOT NULL,
    oss_bucket VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    cdn_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_file_status CHECK (status IN ('uploading', 'active', 'deleted'))
);

-- Indexes
CREATE INDEX idx_storage_files_user ON public.storage_files(user_id);
CREATE INDEX idx_storage_files_oss_key ON public.storage_files(oss_key);
CREATE INDEX idx_storage_files_created ON public.storage_files(created_at);

-- ========================================
-- VOICE RECORDS TABLE
-- ========================================
CREATE TABLE public.voice_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    voice_id VARCHAR(100) NOT NULL,
    voice_name VARCHAR(100),
    voice_type VARCHAR(20) NOT NULL,
    clone_from_audio_url TEXT,
    clone_from_file_id UUID REFERENCES public.storage_files(id) ON DELETE SET NULL,
    output_audio_url TEXT,
    output_duration_seconds DECIMAL(10, 2),
    text_content TEXT,
    status VARCHAR(20) DEFAULT 'processing' NOT NULL,
    error_message TEXT,
    credits_used INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_voice_type CHECK (voice_type IN ('clone', 'design')),
    CONSTRAINT valid_voice_status CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Indexes
CREATE INDEX idx_voice_records_user ON public.voice_records(user_id);
CREATE INDEX idx_voice_records_voice_id ON public.voice_records(voice_id);
CREATE INDEX idx_voice_records_created ON public.voice_records(created_at);

-- ========================================
-- SEARCH RECORDS TABLE
-- ========================================
CREATE TABLE public.search_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    search_type VARCHAR(20) DEFAULT 'web',
    results_count INTEGER DEFAULT 0,
    results_json JSONB,
    credits_used INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_search_records_user ON public.search_records(user_id);
CREATE INDEX idx_search_records_created ON public.search_records(created_at);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- API Keys policies
CREATE POLICY "Users can view own api keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- API Key Logs policies
CREATE POLICY "Users can view own api key logs" ON public.api_key_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Quota Usage policies
CREATE POLICY "Users can view own quota" ON public.quota_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Storage Files policies
CREATE POLICY "Users can view own files" ON public.storage_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON public.storage_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON public.storage_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.storage_files
    FOR DELETE USING (auth.uid() = user_id);

-- Voice Records policies
CREATE POLICY "Users can view own voice records" ON public.voice_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice records" ON public.voice_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice records" ON public.voice_records
    FOR UPDATE USING (auth.uid() = user_id);

-- Search Records policies
CREATE POLICY "Users can view own search records" ON public.search_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search records" ON public.search_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to initialize quota for new users
CREATE OR REPLACE FUNCTION public.initialize_user_quota(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_period_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
BEGIN
    -- Initialize search quota
    INSERT INTO public.quota_usage (user_id, service_type, metric_type, used_value, limit_value, period_start, period_end)
    VALUES 
        (p_user_id, 'search', 'requests', 0, 100, v_period_start, v_period_end),
        (p_user_id, 'storage', 'bytes', 0, 104857600, v_period_start, v_period_end),  -- 100MB
        (p_user_id, 'voice', 'seconds', 0, 600, v_period_start, v_period_end);  -- 10 minutes
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize quota after profile creation
CREATE OR REPLACE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.initialize_user_quota(NEW.id);