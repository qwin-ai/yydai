import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { validateApiKey } from '@/lib/api-key';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from headers
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

    const supabase = getServiceClient() as any;

    // Get user's API keys
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, permissions, rate_limit, daily_limit, is_active, last_used_at, created_at, expires_at')
      .eq('user_id', authenticatedUserId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        keys: apiKeys || [],
      },
    });
  } catch (error) {
    console.error('List API keys error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions = ['search', 'storage', 'voice'], rateLimit = 100, dailyLimit = 1000 } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate API key
    const { generateApiKey } = await import('@/lib/api-key');
    const { key, keyHash, keyPrefix } = generateApiKey();

    const supabase = getServiceClient() as any;

    // Save to database
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        rate_limit: rateLimit,
        daily_limit: dailyLimit,
      })
      .select('id, name, key_prefix, permissions, rate_limit, daily_limit, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: 'Failed to create API key' },
        { status: 500 }
      );
    }

    // Return the key (only time it will be shown in full)
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        key, // Full key - only shown once!
      },
      message: 'Save this key securely. It will not be shown again.',
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}