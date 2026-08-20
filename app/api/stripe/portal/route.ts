import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/db';

function getStripe() {
  const Stripe = require('stripe').default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL('/dashboard?error=stripe_not_configured', request.url));
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.redirect(new URL('/dashboard?error=no_subscription', request.url));
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=portal_failed', request.url));
  }
}
