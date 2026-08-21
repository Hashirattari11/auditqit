import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agency = await db.getAgency(session.user.id);
  if (!agency) return NextResponse.json({ error: 'No agency' }, { status: 404 });

  const clients = await db.getAgencyClients(agency.id);
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agency = await db.getAgency(session.user.id);
  if (!agency) return NextResponse.json({ error: 'No agency' }, { status: 404 });

  const { name, email, website_url, notes } = await req.json();
  if (!name || !email || !website_url) return NextResponse.json({ error: 'Name, email, and website URL required' }, { status: 400 });

  const client = await db.addAgencyClient(agency.id, { name, email, website_url, notes });
  return NextResponse.json(client);
}
