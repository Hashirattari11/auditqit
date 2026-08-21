import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const monitors = await db.getMonitors(session.user.id);
  return NextResponse.json(monitors);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { url, name, frequency, alertOnDrop } = await request.json();
    if (!url || !name) return NextResponse.json({ error: 'url and name are required' }, { status: 400 });

    const monitor = await db.createMonitor(session.user.id, url, name, frequency, alertOnDrop);
    return NextResponse.json(monitor);
  } catch {
    return NextResponse.json({ error: 'Failed to create monitor' }, { status: 500 });
  }
}
