import { NextRequest, NextResponse } from 'next/server';
import { getIQSService } from '@/lib/aliyun';
import { getServiceClient } from '@/lib/supabase/server';
import { checkQuota, incrementQuotaUsage, getUserPlan } from '@/lib/quota';
import { calculateSearchCredits } from '@/lib/quota';
import { validateApiKey } from '@/lib/api-key';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from headers (set by middleware) or validate API key
    const userId = request.headers.get('x-user-id');
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');

    let authenticatedUserId: string | null | undefined = userId;

    if (!authenticatedUserId && apiKey) {
      const keyResult = await validateApiKey(apiKey);
      if (!keyResult.valid) {
        return NextResponse.json(
          { error: 'Unauthorized', message: keyResult.error },
          { status: 401 }
        );
      }
      authenticatedUserId = keyResult.userId ?? null;
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { query, type = 'web', limit = 10, offset = 0, lang, region } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Query is required' },
        { status: 400 }
      );
    }

    // Get user plan
    const plan = await getUserPlan(authenticatedUserId);

    // Check quota
    const quotaResult = await checkQuota(
      authenticatedUserId,
      'search',
      'requests',
      1,
      plan
    );

    if (!quotaResult.allowed) {
      return NextResponse.json(
        {
          error: 'Quota Exceeded',
          message: 'You have reached your search quota limit',
          quota: quotaResult,
        },
        { status: 429 }
      );
    }

    // Calculate credits
    const credits = calculateSearchCredits(type as 'web' | 'news' | 'image' | 'video');

    // Get supabase client
    const supabase = getServiceClient() as any;

    // Check credits balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', authenticatedUserId)
      .single();

    if (!profile || profile.credits_balance < credits) {
      return NextResponse.json(
        {
          error: 'Insufficient Credits',
          message: `You need ${credits} credits for this search`,
          creditsRequired: credits,
          creditsBalance: profile?.credits_balance || 0,
        },
        { status: 402 }
      );
    }

    // Execute search
    const searchService = getIQSService();
    const searchResult = await searchService.search({
      query,
      type,
      limit,
      offset,
      lang,
      region,
    });

    if (!searchResult.success) {
      return NextResponse.json(
        { error: 'Search Failed', message: searchResult.error },
        { status: 500 }
      );
    }

    // Deduct credits
    const newBalance = profile.credits_balance - credits;
    await supabase
      .from('profiles')
      .update({ credits_balance: newBalance })
      .eq('id', authenticatedUserId);

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: authenticatedUserId,
      type: 'usage',
      amount: -credits,
      balance_after: newBalance,
      service_type: 'search',
      description: `Search: ${query.substring(0, 50)}...`,
    });

    // Record search
    await supabase.from('search_records').insert({
      user_id: authenticatedUserId,
      query,
      search_type: type,
      results_count: searchResult.results.length,
      credits_used: credits,
    });

    // Increment quota usage
    await incrementQuotaUsage(authenticatedUserId, 'search', 'requests', 1, plan);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        results: searchResult.results,
        total: searchResult.total,
        query: searchResult.query,
        creditsUsed: credits,
        creditsRemaining: newBalance,
        quotaRemaining: quotaResult.remaining - 1,
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}