import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agency = await db.getAgency(session.user.id);
  return NextResponse.json(agency || null);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, logo, primaryColor } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const existing = await db.getAgency(session.user.id);
  if (existing) return NextResponse.json({ error: 'Agency already exists' }, { status: 400 });

  const agency = await db.createAgency(session.user.id, name, logo, primaryColor);
  return NextResponse.json(agency);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agency = await db.getAgency(session.user.id);
  if (!agency) return NextResponse.json({ error: 'No agency found' }, { status: 404 });

  const updates = await req.json();
  await db.updateAgency(agency.id, updates);
  return NextResponse.json({ ok: true });
}
