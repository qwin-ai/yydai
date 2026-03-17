import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe/client';
import {
  handleCheckoutComplete,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
  handlePaymentFailed,
} from '@/lib/stripe/webhooks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = constructWebhookEvent(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await handleCheckoutComplete(session.id, userId);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        await handleSubscriptionCreated(
          subscription.id,
          subscription.customer as string
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(
          subscription.id,
          subscription.customer as string
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(
          subscription.id,
          subscription.customer as string
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice.customer as string);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}