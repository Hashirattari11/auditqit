import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { is_public } = await request.json();

  const { error } = await supabase
    .from('audits')
    .update({ is_public })
    .eq('id', params.id)
    .eq('user_id', session.user.id);

  if (error) throw error;
  return NextResponse.json({ success: true, is_public });
}
