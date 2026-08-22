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
  if (existing && existing.status === 'running') {
    return {
      status: existing.status as any,
      results: existing.results || {},
      aiSummary: existing.ai_summary || '',
    };
  }
  // If completed but ALL scores are 0 (workers all failed), allow re-run
  if (existing && existing.status === 'completed' && existing.results) {
    const r = existing.results as any;
    const hasData = (r.performance?.performance ?? 0) > 0 || (r.security?.score ?? 0) > 0 || (r.seo?.score ?? 0) > 0;
    if (!hasData && !r.fetch?.error) {
      // All workers returned 0 — treat as incomplete, re-run
    } else {
      return {
        status: existing.status as any,
        results: existing.results || {},
        aiSummary: existing.ai_summary || '',
      };
    }
  } else if (existing && existing.status === 'failed') {
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
    const fetchData = await withTimeout(runFetch(url), 20000, 'fetch').catch((e) => ({
      html: '', statusCode: 0, responseTime: 0, finalUrl: url, contentLength: null, contentType: null, error: e?.message || 'Fetch failed', workerFailed: true,
    }));

    // Step 2: Security
    await db.updateAudit(auditId, { current_step: STEP_KEYS.security });
    const securityData = await withTimeout(runSecurity(url), 15000, 'security').catch((e) => ({
      headers: {}, score: 0, isHttps: false, issues: [{ severity: 'critical', issue: 'Security scan failed', description: e?.message || 'Could not connect', fix: 'Check if URL is accessible' }], statusCode: 0, workerFailed: true,
    }));

    // Step 3: SEO
    await db.updateAudit(auditId, { current_step: STEP_KEYS.seo });
    const seoData = await withTimeout(runSEO(url, fetchData.html), 15000, 'seo').catch((e) => ({
      score: 0, issues: [{ severity: 'critical', issue: 'SEO scan failed', fix: e?.message || 'Could not analyze page' }], details: {}, workerFailed: true,
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
      raw: {}, workerFailed: true,
    }));

    // Step 6: JS Errors (Playwright)
    await db.updateAudit(auditId, { current_step: STEP_KEYS.errors });
    const errorsData = await withTimeout(runPlaywright(url), 30000, 'errors').catch(() => ({
      consoleErrors: [], failedRequests: [], frontendBugs: [], desktopScreenshot: null, mobileScreenshot: null, errorCount: 0, failedRequestCount: 0, frontendBugCount: 0, workerFailed: true,
    }));

    // Step 7: AI Analysis
    await db.updateAudit(auditId, { current_step: STEP_KEYS.ai });
    const aiData = await withTimeout(
      runAI({ url, securityData, seoData, linksData, perfData, errorsData }),
      60000,
      'ai'
    ).catch(() => ({
      summary: '', issueCount: 0, criticalCount: 0, highCount: 0, allIssues: [], overallScore: 0,
    }));

    // Calculate overall score — only count workers that succeeded
    const workerScores: { name: string; score: number; failed: boolean }[] = [
      { name: 'performance', score: perfData.performance ?? 0, failed: !!(perfData as any).workerFailed },
      { name: 'seo', score: seoData.score ?? 0, failed: !!(seoData as any).workerFailed },
      { name: 'security', score: securityData.score ?? 0, failed: !!(securityData as any).workerFailed },
    ];
    const succeeded = workerScores.filter(s => !s.failed && s.score > 0);
    const overallScore = succeeded.length > 0
      ? Math.round(succeeded.reduce((a, b) => a + b.score, 0) / succeeded.length)
      : 0;

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
