import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name || email.split('@')[0],
        email,
        password_hash: passwordHash,
        plan: 'free',
        audits_this_month: 0,
      })
      .select('id, name, email, plan')
      .single();

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('Signup error:', error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
