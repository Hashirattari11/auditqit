import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/db';

const ADMIN_EMAIL = 'hashirattari73@gmail.com';

// PATCH - Update user (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  // Only allow specific fields to be updated
  if (body.plan !== undefined) updates.plan = body.plan;
  if (body.audits_this_month !== undefined) updates.audits_this_month = body.audits_this_month;
  if (body.name !== undefined) updates.name = body.name;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id)
    .select('id, name, email, plan, audits_this_month, created_at')
    .single();

  if (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// DELETE - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { error } = await supabase.from('users').delete().eq('id', params.id);
  if (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
