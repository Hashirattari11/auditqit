import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('webhooks').delete().eq('id', params.id).eq('user_id', session.user.id);
  if (error) throw error;
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Test webhook
  const { data: webhook } = await supabase.from('webhooks').select('*').eq('id', params.id).eq('user_id', session.user.id).single();
  if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const payload = { event: 'test', timestamp: new Date().toISOString(), data: { message: 'Test webhook from AuditIQ' } };
  const payloadStr = JSON.stringify(payload);
  const signature = createHmac('sha256', webhook.secret).update(payloadStr).digest('hex');

  try {
    const res = await fetch(webhook.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AuditIQ-Signature': signature }, body: payloadStr });
    await supabase.from('webhook_logs').insert({ webhook_id: params.id, event: 'test', status_code: res.status, success: res.ok });
    return NextResponse.json({ success: res.ok });
  } catch {
    await supabase.from('webhook_logs').insert({ webhook_id: params.id, event: 'test', success: false });
    return NextResponse.json({ error: 'Delivery failed' }, { status: 500 });
  }
}
