import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await db.getApiKeys(session.user.id);
  return NextResponse.json(keys);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const key = await db.createApiKey(session.user.id, name);
    return NextResponse.json(key);
  } catch {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }
}
