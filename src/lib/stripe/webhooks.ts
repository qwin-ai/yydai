import { getServiceClient } from '@/lib/supabase/server';
import { stripe } from './client';

/**
 * Handle successful checkout
 */
export async function handleCheckoutComplete(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceClient() as any;

  try {
    // Get session details
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Get credits from metadata
    const credits = parseInt(session.metadata?.credits || '0');
    const plan = session.metadata?.plan;

    if (credits > 0) {
      // Get current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', userId)
        .single();

      const currentBalance = profile?.credits_balance || 0;
      const newBalance = currentBalance + credits;

      // Update credits balance
      await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('id', userId);

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'purchase',
        amount: credits,
        balance_after: newBalance,
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'completed',
        description: `Purchased ${credits} credits`,
      });
    }

    if (plan) {
      // Update plan
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase
        .from('profiles')
        .update({
          plan,
          plan_expires_at: periodEnd.toISOString(),
        })
        .eq('id', userId);

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'purchase',
        amount: 0, // Subscription doesn't add credits directly
        balance_after: 0,
        stripe_checkout_session_id: sessionId,
        status: 'completed',
        description: `Upgraded to ${plan} plan`,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Handle checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process checkout',
    };
  }
}

/**
 * Handle subscription created
 */
export async function handleSubscriptionCreated(
  subscriptionId: string,
  customerId: string
): Promise<void> {
  const supabase = getServiceClient() as any;

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Update plan
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = subscription.metadata?.plan || 'pro';

  await supabase
    .from('profiles')
    .update({
      plan,
      plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', profile.id);
}

/**
 * Handle subscription deleted
 */
export async function handleSubscriptionDeleted(
  subscriptionId: string,
  customerId: string
): Promise<void> {
  const supabase = getServiceClient() as any;

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Downgrade to free plan
  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      plan_expires_at: null,
    })
    .eq('id', profile.id);
}

/**
 * Handle subscription updated
 */
export async function handleSubscriptionUpdated(
  subscriptionId: string,
  customerId: string
): Promise<void> {
  const supabase = getServiceClient() as any;

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = subscription.metadata?.plan || 'pro';

  await supabase
    .from('profiles')
    .update({
      plan,
      plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', profile.id);
}

/**
 * Handle payment failed
 */
export async function handlePaymentFailed(
  customerId: string
): Promise<void> {
  const supabase = getServiceClient() as any;

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // TODO: Send email notification about failed payment
  console.log(`Payment failed for user ${profile.id} (${profile.email})`);
}