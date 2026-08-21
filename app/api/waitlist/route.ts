import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, source } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email, plan: plan || 'pro', source: source || 'pricing' });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already on the waitlist!', alreadySignedUp: true });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Added to waitlist!' });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }
}
