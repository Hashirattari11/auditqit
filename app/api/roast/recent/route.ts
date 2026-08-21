import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const roasts = await db.getRecentRoasts(5);
    return NextResponse.json(roasts);
  } catch {
    return NextResponse.json([]);
  }
}
