import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { agencyId, email, password } = await req.json();
    
    if (!agencyId || !email) {
      return NextResponse.json({ error: 'Missing agency ID or email' }, { status: 400 });
    }

    const clients = await db.getAgencyClients(agencyId);
    const client = clients.find((c: any) => c.email === email);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Simple auth for now — in production, use proper password hashing
    return NextResponse.json({ 
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        website_url: client.website_url,
        agency_id: client.agency_id
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Auth failed' }, { status: 500 });
  }
}
