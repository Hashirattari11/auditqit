import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { checkUserUsage, checkAnonymousUsage, getIPFromRequest, incrementUserAuditCount } from '@/lib/limits';

// Simple in-process job runner (replaces BullMQ)
const runningJobs = new Map<string, Promise<void>>();

async function runAuditInline(url: string, auditId: string) {
  const { runLighthouse } = await import('@/workers/lighthouse');
  const { runPlaywright } = await import('@/workers/playwright');
  const { checkHeaders } = await import('@/workers/headers');
  const { checkLinks } = await import('@/workers/linkchecker');
  const { checkSEO } = await import('@/workers/seo');
  const { generateAISummary } = await import('@/lib/llm');
  const axios = (await import('axios')).default;

  interface AuditStep {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: unknown;
    error?: string;
  }

  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      ),
    ]);
  }

  try {
    await db.updateAudit(auditId, { status: 'running', current_step: 'Initializing audit...' });

    // Fetch HTML first
    let html = '';
    try {
      await db.updateAudit(auditId, { current_step: 'Fetching page content...' });
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'AuditIQ/1.0 (Web Audit Tool)' },
      });
      html = typeof response.data === 'string' ? response.data : '';
    } catch {
      html = '';
    }

    await db.updateAudit(auditId, { current_step: 'Running performance & security checks...' });

    const steps: Record<string, AuditStep> = {
      lighthouse: { name: 'Lighthouse', status: 'pending' },
      playwright: { name: 'Playwright', status: 'pending' },
      headers: { name: 'HTTP Headers', status: 'pending' },
      links: { name: 'Link Checker', status: 'pending' },
      seo: { name: 'SEO Analysis', status: 'pending' },
    };

    const timeout = 60000;

    const runStep = async (key: string, fn: () => Promise<unknown>) => {
      steps[key].status = 'running';
      try {
        const result = await withTimeout(fn(), timeout, steps[key].name);
        steps[key].result = result;
        steps[key].status = 'completed';
        console.log(`  ✅ ${steps[key].name} completed`);
      } catch (error) {
        steps[key].status = 'failed';
        steps[key].error = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ❌ ${steps[key].name} failed: ${steps[key].error}`);
      }
    };

    // Run all checks in parallel
    await Promise.allSettled([
      runStep('lighthouse', () => runLighthouse(url)),
      runStep('playwright', () => runPlaywright(url)),
      runStep('headers', () => checkHeaders(url)),
      runStep('links', () => checkLinks(html, url)),
      runStep('seo', () => checkSEO(url, html)),
    ]);

    const results = {
      url,
      timestamp: new Date().toISOString(),
      lighthouse: steps.lighthouse.status === 'completed' ? steps.lighthouse.result : null,
      playwright: steps.playwright.status === 'completed' ? steps.playwright.result : null,
      headers: steps.headers.status === 'completed' ? steps.headers.result : null,
      links: steps.links.status === 'completed' ? steps.links.result : null,
      seo: steps.seo.status === 'completed' ? steps.seo.result : null,
      errors: {
        failedSteps: Object.entries(steps)
          .filter(([, s]) => s.status === 'failed')
          .map(([key, s]) => ({ step: key, name: s.name, error: s.error })),
      },
    };

    // Generate AI summary
    await db.updateAudit(auditId, { current_step: 'Generating AI analysis...' });
    console.log('  🤖 Generating AI summary...');

    const aiSummary = await generateAISummary(results as Record<string, unknown>);

    await db.updateAudit(auditId, {
      status: 'completed',
      results: results as any,
      ai_summary: aiSummary,
      current_step: '',
    });

    console.log(`\n🎉 Audit completed for: ${url}\n`);
  } catch (error) {
    console.error(`\n💥 Audit failed for ${url}:`, error);
    await db.updateAudit(auditId, {
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

    // Run audit inline (non-blocking — fire and forget)
    const jobPromise = runAuditInline(parsedUrl.toString(), audit.id);
    runningJobs.set(audit.id, jobPromise);
    jobPromise.finally(() => runningJobs.delete(audit.id));

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
