import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

function getStripe() {
  const Stripe = require('stripe').default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;

      if (userId) {
        await supabase
          .from('users')
          .update({
            plan: 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({ plan: 'free', stripe_subscription_id: null })
          .eq('id', user.id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      console.error(`Payment failed for customer ${event.data.object.customer}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
