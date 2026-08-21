import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { createHmac, randomBytes } from 'crypto';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase.from('webhooks').select('id, url, events, is_active, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false });
  return NextResponse.json({ webhooks: data || [] });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, events } = await request.json();
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  const secret = randomBytes(32).toString('hex');

  const { data, error } = await supabase.from('webhooks').insert({
    user_id: session.user.id,
    url,
    events: events || ['audit.completed'],
    secret,
  }).select().single();

  if (error) throw error;
  return NextResponse.json({ webhook: { ...data, secret } });
}
