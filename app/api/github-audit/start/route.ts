import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseGitHubUrl } from '@/lib/github';
import { auth } from '@/lib/auth';
import { checkUserUsage, checkAnonymousUsage, getIPFromRequest, incrementUserAuditCount } from '@/lib/limits';

// Simple in-process job runner
const runningJobs = new Map<string, Promise<void>>();

async function runGitHubAuditInline(repoUrl: string, auditId: string) {
  const { runGitHubAudit } = await import('@/workers/github-audit');
  const { generateGitHubAISummary } = await import('@/lib/llm');

  try {
    await db.updateRepoAudit(auditId, { status: 'running', current_step: 'Fetching repository...' });

    // Run the audit
    const results = await runGitHubAudit(repoUrl);

    // Generate AI summary
    await db.updateRepoAudit(auditId, { current_step: 'Generating AI analysis...' });
    console.log('  🤖 Generating AI summary...');

    const aiSummary = await generateGitHubAISummary(results as unknown as Record<string, unknown>);

    await db.updateRepoAudit(auditId, {
      status: 'completed',
      results: results as any,
      ai_summary: aiSummary,
      current_step: '',
    });

    console.log(`\n🎉 GitHub audit completed for: ${repoUrl}\n`);
  } catch (error) {
    console.error(`\n💥 GitHub audit failed for ${repoUrl}:`, error);
    await db.updateRepoAudit(auditId, {
      status: 'failed',
      current_step: '',
      results: { error: error instanceof Error ? error.message : 'Unknown error' } as any,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'GitHub repository URL is required' }, { status: 400 });
    }

    // Parse and validate GitHub URL
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

    // Check usage limits
    const session = await auth();
    let userId: string | undefined;

    if (session?.user?.id) {
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

    // Create audit record
    const audit = await db.createRepoAudit(url, owner, repo, userId);

    // Increment user audit count
    if (userId) {
      await incrementUserAuditCount(userId);
    }

    // Run audit inline (non-blocking — fire and forget)
    const jobPromise = runGitHubAuditInline(url, audit.id);
    runningJobs.set(audit.id, jobPromise);
    jobPromise.finally(() => runningJobs.delete(audit.id));

    return NextResponse.json({
      auditId: audit.id,
      status: 'pending',
      message: `GitHub audit started for ${owner}/${repo}`,
    });
  } catch (error) {
    console.error('Failed to start GitHub audit:', error);
    return NextResponse.json(
      { error: 'Failed to create GitHub audit job' },
      { status: 500 }
    );
  }
}
