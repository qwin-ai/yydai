// Quota limits by plan
export const QUOTA_LIMITS = {
  free: {
    search: {
      requests: 100,          // per month
      dailyRequests: 20,      // per day
    },
    storage: {
      bytes: 100 * 1024 * 1024,  // 100MB
      files: 100,
    },
    voice: {
      seconds: 600,           // 10 minutes per month
      cloneCount: 2,          // 2 voice clones
    },
  },
  pro: {
    search: {
      requests: 2000,         // per month
      dailyRequests: 500,     // per day
    },
    storage: {
      bytes: 5 * 1024 * 1024 * 1024,  // 5GB
      files: 1000,
    },
    voice: {
      seconds: 7200,          // 120 minutes per month
      cloneCount: 20,         // 20 voice clones
    },
  },
  enterprise: {
    search: {
      requests: -1,           // unlimited
      dailyRequests: -1,
    },
    storage: {
      bytes: -1,              // unlimited
      files: -1,
    },
    voice: {
      seconds: -1,            // unlimited
      cloneCount: -1,
    },
  },
} as const;

export type PlanType = keyof typeof QUOTA_LIMITS;
export type ServiceType = 'search' | 'storage' | 'voice';
export type MetricType = 'requests' | 'dailyRequests' | 'bytes' | 'files' | 'seconds' | 'cloneCount';

export interface QuotaCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt?: Date;
}