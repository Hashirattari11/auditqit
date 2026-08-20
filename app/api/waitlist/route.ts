import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Create table if not exists
    await supabase.rpc('exec_sql', {
      query: `CREATE TABLE IF NOT EXISTS public.waitlist (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );`,
    }).catch(() => {
      // Table might already exist, ignore
    });

    const { error } = await supabase
      .from('waitlist')
      .insert({ email })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation — already signed up
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
