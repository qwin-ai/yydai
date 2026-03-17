import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { getUserPlan, getQuotaUsage } from '@/lib/quota';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getServiceClient();
    const plan = await getUserPlan(userId);

    // Get quota usage for each service
    const [searchQuota, storageQuota, voiceQuota] = await Promise.all([
      getQuotaUsage(userId, 'search'),
      getQuotaUsage(userId, 'storage'),
      getQuotaUsage(userId, 'voice'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        plan,
        quota: {
          search: searchQuota ? {
            used: searchQuota.used,
            limit: searchQuota.limit,
            remaining: Math.max(0, searchQuota.limit - searchQuota.used),
            periodStart: searchQuota.periodStart,
            periodEnd: searchQuota.periodEnd,
          } : null,
          storage: storageQuota ? {
            used: storageQuota.used,
            limit: storageQuota.limit,
            remaining: Math.max(0, storageQuota.limit - storageQuota.used),
            periodStart: storageQuota.periodStart,
            periodEnd: storageQuota.periodEnd,
          } : null,
          voice: voiceQuota ? {
            used: voiceQuota.used,
            limit: voiceQuota.limit,
            remaining: Math.max(0, voiceQuota.limit - voiceQuota.used),
            periodStart: voiceQuota.periodStart,
            periodEnd: voiceQuota.periodEnd,
          } : null,
        },
      },
    });
  } catch (error) {
    console.error('Get quota error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}