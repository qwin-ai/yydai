import { getServiceClient } from '@/lib/supabase/server';
import { QUOTA_LIMITS, type PlanType, type ServiceType, type QuotaCheckResult } from './plans';

/**
 * Get current quota usage for a user
 */
export async function getQuotaUsage(
  userId: string,
  serviceType: ServiceType
): Promise<{ used: number; limit: number; periodStart: Date; periodEnd: Date } | null> {
  const supabase = getServiceClient() as any;
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from('quota_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('service_type', serviceType)
    .eq('period_start', periodStart.toISOString().split('T')[0])
    .single();

  if (error || !data) {
    return null;
  }

  return {
    used: data.used_value,
    limit: data.limit_value,
    periodStart: new Date(data.period_start),
    periodEnd: new Date(data.period_end),
  };
}

/**
 * Check if user has quota remaining
 */
export async function checkQuota(
  userId: string,
  serviceType: ServiceType,
  metricType: string,
  requestedAmount: number = 1,
  plan: PlanType = 'free'
): Promise<QuotaCheckResult> {
  const limits = QUOTA_LIMITS[plan][serviceType];
  const limit = (limits as Record<string, number>)[metricType] ?? 0;

  // Unlimited quota for enterprise
  if (limit === -1) {
    return {
      allowed: true,
      used: 0,
      limit: -1,
      remaining: -1,
    };
  }

  const usage = await getQuotaUsage(userId, serviceType);

  if (!usage) {
    // No usage record yet, allow if within limits
    return {
      allowed: requestedAmount <= limit,
      used: 0,
      limit,
      remaining: limit,
      resetAt: getMonthlyResetDate(),
    };
  }

  const remaining = Math.max(0, limit - usage.used);

  return {
    allowed: usage.used + requestedAmount <= limit,
    used: usage.used,
    limit,
    remaining,
    resetAt: getMonthlyResetDate(),
  };
}

/**
 * Increment quota usage
 */
export async function incrementQuotaUsage(
  userId: string,
  serviceType: ServiceType,
  metricType: string,
  amount: number = 1,
  plan: PlanType = 'free'
): Promise<void> {
  const supabase = getServiceClient() as any;
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const limits = QUOTA_LIMITS[plan][serviceType];
  const limit = (limits as Record<string, number>)[metricType] ?? 0;

  // Check if record exists
  const { data: existing } = await supabase
    .from('quota_usage')
    .select('id, used_value')
    .eq('user_id', userId)
    .eq('service_type', serviceType)
    .eq('metric_type', metricType)
    .eq('period_start', periodStart.toISOString().split('T')[0])
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from('quota_usage')
      .update({
        used_value: existing.used_value + amount,
        last_request_at: now.toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new record
    await supabase.from('quota_usage').insert({
      user_id: userId,
      service_type: serviceType,
      metric_type: metricType,
      used_value: amount,
      limit_value: limit,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      last_request_at: now.toISOString(),
    });
  }
}

/**
 * Get monthly reset date
 */
function getMonthlyResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Get user's plan
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = getServiceClient() as any;

  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single();

  if (!data) {
    return 'free';
  }

  // Check if plan has expired
  if (data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) {
    return 'free';
  }

  return data.plan as PlanType;
}