import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getServiceClient() as any;

    // Get credits balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        balance: profile?.credits_balance || 0,
        transactions: transactions || [],
      },
    });
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}