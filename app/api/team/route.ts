import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await db.getUserTeam(session.user.id);
  return NextResponse.json(team);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const team = await db.createTeam(name, session.user.id);
    return NextResponse.json(team);
  } catch {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
