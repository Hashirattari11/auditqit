import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseGitHubUrl } from '@/lib/github';
import { auth } from '@/lib/auth';
import { checkUserUsage, checkAnonymousUsage, getIPFromRequest, incrementUserAuditCount } from '@/lib/limits';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'GitHub repository URL is required' }, { status: 400 });
    }

    let owner: string, repo: string;
    try {
      const parsed = parseGitHubUrl(url);
      owner = parsed.owner;
      repo = parsed.repo;
    } catch {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Expected: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    const session = await auth();
    let userId: string | undefined;

    if (session?.user?.id) {
      userId = session.user.id;
      const usage = await checkUserUsage(userId);
      if (!usage.allowed) {
        return NextResponse.json({
          error: usage.reason, limitReached: true,
          current: usage.current, limit: usage.limit, plan: usage.plan,
        }, { status: 403 });
      }
    } else {
      const ip = getIPFromRequest(request);
      const usage = await checkAnonymousUsage(ip);
      if (!usage.allowed) {
        return NextResponse.json({
          error: usage.reason, limitReached: true,
          current: usage.current, limit: usage.limit, plan: 'anonymous',
        }, { status: 403 });
      }
    }

    const audit = await db.createRepoAudit(url, owner, repo, userId);

    if (userId) {
      await incrementUserAuditCount(userId);
    }

    return NextResponse.json({
      auditId: audit.id,
      status: 'pending',
      message: `GitHub audit started for ${owner}/${repo}`,
    });
  } catch (error) {
    console.error('Failed to start GitHub audit:', error);
    return NextResponse.json({ error: 'Failed to create GitHub audit job' }, { status: 500 });
  }
}
