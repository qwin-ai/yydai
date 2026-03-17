import Stripe from 'stripe';

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Product and price IDs from environment
export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
  credits: {
    100: process.env.STRIPE_CREDITS_100_PRICE_ID || '',
    500: process.env.STRIPE_CREDITS_500_PRICE_ID || '',
    1000: process.env.STRIPE_CREDITS_1000_PRICE_ID || '',
  },
};

// Credit packages
export const CREDIT_PACKAGES = [
  { credits: 100, price: 5, priceId: STRIPE_PRICES.credits[100] },
  { credits: 500, price: 20, priceId: STRIPE_PRICES.credits[500] },  // 20% bonus
  { credits: 1000, price: 35, priceId: STRIPE_PRICES.credits[1000] }, // 30% bonus
] as const;

export interface CheckoutSessionResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export interface CustomerResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

/**
 * Create or get Stripe customer
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  existingCustomerId?: string
): Promise<CustomerResult> {
  try {
    // If customer exists, return the ID
    if (existingCustomerId) {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (customer && !('deleted' in customer)) {
        return { success: true, customerId: existingCustomerId };
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error('Stripe customer creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    };
  }
}

/**
 * Create checkout session for credits purchase
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string> = {}
): Promise<CheckoutSessionResult> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url || undefined,
    };
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    };
  }
}

/**
 * Create subscription checkout session
 */
export async function createSubscriptionSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string> = {}
): Promise<CheckoutSessionResult> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url || undefined,
    };
  } catch (error) {
    console.error('Stripe subscription session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription session',
    };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return { success: true };
  } catch (error) {
    console.error('Stripe cancel subscription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Stripe get subscription error:', error);
    return null;
  }
}

/**
 * Construct webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}