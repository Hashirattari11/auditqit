import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const battles = await db.getRecentBattles(5);
    return NextResponse.json(battles);
  } catch {
    return NextResponse.json([]);
  }
}
