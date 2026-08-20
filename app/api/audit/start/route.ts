import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { checkUserUsage, checkAnonymousUsage, getIPFromRequest, incrementUserAuditCount } from '@/lib/limits';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check usage limits
    const session = await auth();
    let userId: string | undefined;

    if (session?.user?.id) {
      // Logged-in user — check plan limits
      userId = session.user.id;
      const usage = await checkUserUsage(userId);
      if (!usage.allowed) {
        return NextResponse.json({
          error: usage.reason,
          limitReached: true,
          current: usage.current,
          limit: usage.limit,
          plan: usage.plan,
        }, { status: 403 });
      }
    } else {
      // Anonymous — check IP-based limits
      const ip = getIPFromRequest(request);
      const usage = await checkAnonymousUsage(ip);
      if (!usage.allowed) {
        return NextResponse.json({
          error: usage.reason,
          limitReached: true,
          current: usage.current,
          limit: usage.limit,
          plan: 'anonymous',
        }, { status: 403 });
      }
    }

    // Create audit record in Supabase
    const audit = await db.createAudit(parsedUrl.toString(), userId);

    // Increment user audit count
    if (userId) {
      await incrementUserAuditCount(userId);
    }

    return NextResponse.json({
      auditId: audit.id,
      status: 'pending',
      message: 'Audit job created successfully',
    });
  } catch (error) {
    console.error('Failed to start audit:', error);
    return NextResponse.json(
      { error: 'Failed to create audit job' },
      { status: 500 }
    );
  }
}
