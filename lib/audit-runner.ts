import { db } from '@/lib/db';
import { withTimeout } from '@/lib/timeout';

export interface AuditRunResult {
  status: 'completed' | 'failed';
  results: Record<string, unknown>;
  aiSummary: string;
}

export async function runAuditInline(url: string, auditId: string): Promise<AuditRunResult> {
  // DB-based guard: check current status instead of in-memory Set
  // (in-memory Set persists across warm serverless instances causing stale locks)
  const existing = await db.getAudit(auditId);
  if (existing && (existing.status === 'completed' || existing.status === 'failed' || existing.status === 'running')) {
    return {
      status: existing.status as any,
      results: existing.results || {},
      aiSummary: existing.ai_summary || '',
    };
  }

  try {
    // Dynamic imports to avoid bundle-time failures
    const { runFetch } = await import('@/workers/fetch');
    const { runSecurity } = await import('@/workers/security');
    const { runSEO } = await import('@/workers/seo');
    const { runLinks } = await import('@/workers/links');
    const { runLighthouse } = await import('@/workers/lighthouse');
    const { runPlaywright } = await import('@/workers/playwright');
    const { runAI } = await import('@/workers/ai-summary');

    const STEP_KEYS = {
      fetch: 'fetch',
      security: 'security',
      seo: 'seo',
      links: 'links',
      performance: 'performance',
      errors: 'errors',
      ai: 'ai',
    } as const;

    // Step 1: Fetch
    await db.updateAudit(auditId, { status: 'running', current_step: STEP_KEYS.fetch });
    const fetchData = await withTimeout(runFetch(url), 15000, 'fetch').catch(() => ({
      html: '', statusCode: 0, responseTime: 0, finalUrl: url, contentLength: null, contentType: null, error: 'Timeout',
    }));

    // Step 2: Security
    await db.updateAudit(auditId, { current_step: STEP_KEYS.security });
    const securityData = await withTimeout(runSecurity(url), 10000, 'security').catch(() => ({
      headers: {}, score: 0, isHttps: false, issues: [], statusCode: 0,
    }));

    // Step 3: SEO
    await db.updateAudit(auditId, { current_step: STEP_KEYS.seo });
    const seoData = await withTimeout(runSEO(url, fetchData.html), 10000, 'seo').catch(() => ({
      score: 0, issues: [], details: {},
    }));

    // Step 4: Links
    await db.updateAudit(auditId, { current_step: STEP_KEYS.links });
    const linksData = await withTimeout(runLinks(url, fetchData.html), 20000, 'links').catch(() => ({
      broken: [], total: 0, checked: 0, brokenCount: 0,
    }));

    // Step 5: Performance (Lighthouse)
    await db.updateAudit(auditId, { current_step: STEP_KEYS.performance });
    const perfData = await withTimeout(runLighthouse(url), 45000, 'performance').catch(() => ({
      performance: 0, seo: 0, accessibility: 0, bestPractices: 0,
      metrics: { lcp: null, cls: null, fcp: null, ttfb: null, tbt: null },
      raw: {},
    }));

    // Step 6: JS Errors (Playwright)
    await db.updateAudit(auditId, { current_step: STEP_KEYS.errors });
    const errorsData = await withTimeout(runPlaywright(url), 30000, 'errors').catch(() => ({
      consoleErrors: [], failedRequests: [], frontendBugs: [], desktopScreenshot: null, mobileScreenshot: null, errorCount: 0, failedRequestCount: 0, frontendBugCount: 0,
    }));

    // Step 7: AI Analysis
    await db.updateAudit(auditId, { current_step: STEP_KEYS.ai });
    const aiData = await withTimeout(
      runAI({ url, securityData, seoData, linksData, perfData, errorsData }),
      30000,
      'ai'
    ).catch(() => ({
      summary: 'AI analysis unavailable', issueCount: 0, criticalCount: 0, highCount: 0, allIssues: [], overallScore: 0,
    }));

    // Calculate overall score
    const scores = [perfData.performance, seoData.score, securityData.score].filter((s) => s > 0);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Complete
    await db.updateAudit(auditId, {
      status: 'completed',
      current_step: '',
      results: {
        url,
        completedAt: new Date().toISOString(),
        fetch: fetchData,
        security: securityData,
        seo: seoData,
        links: linksData,
        performance: perfData,
        errors: errorsData,
        ai: aiData,
        overallScore,
      } as any,
      ai_summary: aiData.summary || '',
    });

    return {
      status: 'completed',
      results: {
        url,
        completedAt: new Date().toISOString(),
        fetch: fetchData,
        security: securityData,
        seo: seoData,
        links: linksData,
        performance: perfData,
        errors: errorsData,
        ai: aiData,
        overallScore,
      },
      aiSummary: aiData.summary || '',
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await db.updateAudit(auditId, {
      status: 'failed',
      current_step: '',
      results: { error: errMsg } as any,
    });
    return { status: 'failed', results: { error: errMsg }, aiSummary: '' };
  }
}
