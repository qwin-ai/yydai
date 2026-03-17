import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create rate limiters
const minuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'yyd:ratelimit:minute',
});

const hourLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 h'),
  analytics: true,
  prefix: 'yyd:ratelimit:hour',
});

const dayLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10000, '1 d'),
  analytics: true,
  prefix: 'yyd:ratelimit:day',
});

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Check rate limit for a user or API key
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  // Check all limits in parallel
  const [minuteResult, hourResult, dayResult] = await Promise.all([
    minuteLimiter.limit(identifier),
    hourLimiter.limit(identifier),
    dayLimiter.limit(identifier),
  ]);

  // Return the most restrictive result
  if (!dayResult.success) {
    return {
      success: false,
      limit: dayResult.limit,
      remaining: dayResult.remaining,
      reset: new Date(dayResult.reset),
    };
  }

  if (!hourResult.success) {
    return {
      success: false,
      limit: hourResult.limit,
      remaining: hourResult.remaining,
      reset: new Date(hourResult.reset),
    };
  }

  if (!minuteResult.success) {
    return {
      success: false,
      limit: minuteResult.limit,
      remaining: minuteResult.remaining,
      reset: new Date(minuteResult.reset),
    };
  }

  return {
    success: true,
    limit: minuteResult.limit,
    remaining: minuteResult.remaining,
    reset: new Date(minuteResult.reset),
  };
}

/**
 * Check rate limit for API key with custom limits
 */
export async function checkApiKeyRateLimit(
  identifier: string,
  minuteLimit: number = 60,
  dailyLimit: number = 1000
): Promise<RateLimitResult> {
  // Create custom limiters for this API key
  const customMinuteLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(minuteLimit, '1 m'),
    prefix: `yyd:apikey:${identifier}:minute`,
  });

  const customDayLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(dailyLimit, '1 d'),
    prefix: `yyd:apikey:${identifier}:day`,
  });

  const [minuteResult, dayResult] = await Promise.all([
    customMinuteLimiter.limit(identifier),
    customDayLimiter.limit(identifier),
  ]);

  if (!dayResult.success) {
    return {
      success: false,
      limit: dayResult.limit,
      remaining: dayResult.remaining,
      reset: new Date(dayResult.reset),
    };
  }

  if (!minuteResult.success) {
    return {
      success: false,
      limit: minuteResult.limit,
      remaining: minuteResult.remaining,
      reset: new Date(minuteResult.reset),
    };
  }

  return {
    success: true,
    limit: minuteResult.limit,
    remaining: minuteResult.remaining,
    reset: new Date(minuteResult.reset),
  };
}