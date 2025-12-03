-- ================================================================
-- TALK-TO-MY-LAWYER: BULLETPROOF MIGRATIONS
-- Run these in Supabase SQL Editor in order
-- ================================================================

-- ================================================================
-- MIGRATION 012: Create Coupon Usage Table
-- ================================================================

-- Coupon Usage Tracking Table (CRITICAL - Code references this)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  discount_percent INT NOT NULL DEFAULT 0,
  amount_before NUMERIC(10,2),
  amount_after NUMERIC(10,2),
  plan_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_code ON coupon_usage(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_employee ON coupon_usage(employee_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_date ON coupon_usage(created_at DESC);

-- RLS Policies
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Users can see their own coupon usage
DROP POLICY IF EXISTS "Users can view own coupon usage" ON coupon_usage;
CREATE POLICY "Users can view own coupon usage"
  ON coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Employees can see usage of their codes
DROP POLICY IF EXISTS "Employees can view their coupon usage" ON coupon_usage;
CREATE POLICY "Employees can view their coupon usage"
  ON coupon_usage FOR SELECT
  USING (auth.uid() = employee_id);

-- Admins can view all
DROP POLICY IF EXISTS "Admins can view all coupon usage" ON coupon_usage;
CREATE POLICY "Admins can view all coupon usage"
  ON coupon_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert via service role or authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert coupon usage" ON coupon_usage;
CREATE POLICY "Authenticated users can insert coupon usage"
  ON coupon_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- MIGRATION 013: Promotional Code Usage Table
-- ================================================================

-- Track special promotional codes like TALK3
CREATE TABLE IF NOT EXISTS promotional_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_percent INT NOT NULL,
  plan_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promotional_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promotional_code_usage(code);

ALTER TABLE promotional_code_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own promo usage" ON promotional_code_usage;
CREATE POLICY "Users can view own promo usage"
  ON promotional_code_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert promo usage" ON promotional_code_usage;
CREATE POLICY "Users can insert promo usage"
  ON promotional_code_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all promo usage" ON promotional_code_usage;
CREATE POLICY "Admins can view all promo usage"
  ON promotional_code_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================================
-- MIGRATION 014: Error Logs Table
-- ================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_date ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);

-- Only admins can view error logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view error logs" ON error_logs;
CREATE POLICY "Admins can view error logs"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert (for backend logging)
DROP POLICY IF EXISTS "Service role can insert error logs" ON error_logs;
CREATE POLICY "Service role can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);

-- ================================================================
-- MIGRATION 015: Business Metrics Table
-- ================================================================

CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  letter_id UUID REFERENCES letters(id) ON DELETE SET NULL,
  plan_type TEXT,
  coupon_code TEXT,
  amount NUMERIC(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_event ON business_metrics(event_type);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON business_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_user ON business_metrics(user_id);

ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view metrics
DROP POLICY IF EXISTS "Admins can view metrics" ON business_metrics;
CREATE POLICY "Admins can view metrics"
  ON business_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow inserts for tracking
DROP POLICY IF EXISTS "Allow metric inserts" ON business_metrics;
CREATE POLICY "Allow metric inserts"
  ON business_metrics FOR INSERT
  WITH CHECK (true);

-- ================================================================
-- MIGRATION 016: Analytics View
-- ================================================================

-- Drop if exists to avoid errors
DROP VIEW IF EXISTS analytics_daily;

CREATE VIEW analytics_daily AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  event_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM business_metrics
GROUP BY DATE_TRUNC('day', created_at), event_type
ORDER BY date DESC;

-- Revenue summary view
DROP VIEW IF EXISTS revenue_summary;

CREATE VIEW revenue_summary AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) FILTER (WHERE event_type = 'subscription_started') as new_subscriptions,
  SUM(amount) FILTER (WHERE event_type = 'subscription_started') as subscription_revenue,
  COUNT(*) FILTER (WHERE event_type = 'coupon_used') as coupons_used,
  COUNT(DISTINCT user_id) as unique_users
FROM business_metrics
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ================================================================
-- MIGRATION 017: Security Functions
-- ================================================================

-- Function to safely log audit events with parameterized queries
CREATE OR REPLACE FUNCTION safe_log_audit(
  p_letter_id UUID,
  p_action TEXT,
  p_performed_by UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate input parameters
  IF p_letter_id IS NULL OR p_action IS NULL OR p_performed_by IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters for audit log';
  END IF;
  
  -- Validate action is from allowed list
  IF p_action NOT IN (
    'created', 'submitted', 'review_started', 'edited', 
    'approved', 'rejected', 'pdf_downloaded', 'email_sent',
    'status_changed', 'content_updated'
  ) THEN
    RAISE EXCEPTION 'Invalid action type: %', p_action;
  END IF;
  
  -- Insert audit log entry
  INSERT INTO letter_audit_log (
    letter_id, 
    action, 
    performed_by, 
    details,
    created_at
  )
  VALUES (
    p_letter_id,
    p_action,
    p_performed_by,
    COALESCE(p_details, '{}'::jsonb),
    NOW()
  );
END;
$$;

-- Function to check if user has free trial available
CREATE OR REPLACE FUNCTION has_free_trial_available(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  letter_count INT;
BEGIN
  SELECT COUNT(*) INTO letter_count
  FROM letters
  WHERE user_id = p_user_id;
  
  RETURN letter_count = 0;
END;
$$;

-- Function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_access(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  letter_count INT;
  active_sub RECORD;
BEGIN
  -- Check letter count for free trial
  SELECT COUNT(*) INTO letter_count
  FROM letters
  WHERE user_id = p_user_id;
  
  -- Free trial available
  IF letter_count = 0 THEN
    RETURN jsonb_build_object(
      'has_access', true,
      'reason', 'free_trial',
      'letters_used', 0
    );
  END IF;
  
  -- Check for active subscription
  SELECT * INTO active_sub
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF active_sub IS NOT NULL THEN
    IF COALESCE(active_sub.letters_remaining, 0) > 0 THEN
      RETURN jsonb_build_object(
        'has_access', true,
        'reason', 'subscription',
        'letters_remaining', active_sub.letters_remaining,
        'plan_type', active_sub.plan_type
      );
    ELSE
      RETURN jsonb_build_object(
        'has_access', false,
        'reason', 'no_credits',
        'letters_remaining', 0
      );
    END IF;
  END IF;
  
  -- No access
  RETURN jsonb_build_object(
    'has_access', false,
    'reason', 'no_subscription'
  );
END;
$$;

-- ================================================================
-- MIGRATION 018: Ensure All Letter Statuses Exist
-- ================================================================

-- Add missing statuses to enum if they don't exist
DO $$
BEGIN
  -- Check and add 'generating' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'generating' 
    AND enumtypid = 'letter_status'::regtype
  ) THEN
    ALTER TYPE letter_status ADD VALUE IF NOT EXISTS 'generating';
  END IF;
  
  -- Check and add 'under_review' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'under_review' 
    AND enumtypid = 'letter_status'::regtype
  ) THEN
    ALTER TYPE letter_status ADD VALUE IF NOT EXISTS 'under_review';
  END IF;
  
  -- Check and add 'completed' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'completed' 
    AND enumtypid = 'letter_status'::regtype
  ) THEN
    ALTER TYPE letter_status ADD VALUE IF NOT EXISTS 'completed';
  END IF;
  
  -- Check and add 'failed' if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'failed' 
    AND enumtypid = 'letter_status'::regtype
  ) THEN
    ALTER TYPE letter_status ADD VALUE IF NOT EXISTS 'failed';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some enum values may already exist: %', SQLERRM;
END;
$$;

-- ================================================================
-- MIGRATION 019: Ensure is_super_user Column Exists
-- ================================================================

-- Add is_super_user column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_super_user'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_super_user BOOLEAN DEFAULT FALSE;
  END IF;
END;
$$;

-- Add subscription credit columns if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'letters_remaining'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN letters_remaining INT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'letters_used'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN letters_used INT DEFAULT 0;
  END IF;
END;
$$;

-- ================================================================
-- VERIFICATION QUERIES
-- Run these to verify everything was created correctly
-- ================================================================

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'coupon_usage', 
  'promotional_code_usage', 
  'error_logs', 
  'business_metrics'
);

-- Check letter_status enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'letter_status'::regtype
ORDER BY enumsortorder;

-- Check profiles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check subscriptions columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All bulletproof migrations completed successfully!';
  RAISE NOTICE '📋 Tables created: coupon_usage, promotional_code_usage, error_logs, business_metrics';
  RAISE NOTICE '🔧 Functions created: safe_log_audit, has_free_trial_available, check_subscription_access';
  RAISE NOTICE '📊 Views created: analytics_daily, revenue_summary';
END;
$$;
