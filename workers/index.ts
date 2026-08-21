import { db } from '../lib/db';
import { runFetch } from './fetch';
import { runSecurity } from './security';
import { runSEO } from './seo';
import { runLinks } from './links';
import { runLighthouse } from './lighthouse';
import { runPlaywright } from './playwright';
import { runAI } from './ai-summary';
import { withTimeout } from '../lib/timeout';

interface AuditData {
  url: string;
  auditId: string;
}

const STEP_KEYS = {
  fetch: 'fetch',
  security: 'security',
  seo: 'seo',
  links: 'links',
  performance: 'performance',
  errors: 'errors',
  ai: 'ai',
} as const;

export async function runAudit(data: AuditData) {
  const { url, auditId } = data;
  console.log(`[WORKER] Starting audit ${auditId} for ${url}`);

  const updateStep = async (step: string) => {
    await db.updateAudit(auditId, { status: 'running', current_step: step });
    console.log(`[WORKER] Step: ${step}`);
  };

  try {
    // Step 1: Fetch
    await updateStep(STEP_KEYS.fetch);
    const fetchData = await withTimeout(runFetch(url), 15000, 'fetch').catch(() => ({
      html: '', statusCode: 0, responseTime: 0, finalUrl: url, contentLength: null, contentType: null, error: 'Timeout',
    }));

    // Step 2: Security
    await updateStep(STEP_KEYS.security);
    const securityData = await withTimeout(runSecurity(url), 10000, 'security').catch(() => ({
      headers: {}, score: 0, isHttps: false, issues: [], statusCode: 0,
    }));

    // Step 3: SEO
    await updateStep(STEP_KEYS.seo);
    const seoData = await withTimeout(runSEO(url, fetchData.html), 10000, 'seo').catch(() => ({
      score: 0, issues: [], details: {},
    }));

    // Step 4: Links
    await updateStep(STEP_KEYS.links);
    const linksData = await withTimeout(runLinks(url, fetchData.html), 20000, 'links').catch(() => ({
      broken: [], total: 0, checked: 0, brokenCount: 0,
    }));

    // Step 5: Performance (Lighthouse)
    await updateStep(STEP_KEYS.performance);
    const perfData = await withTimeout(runLighthouse(url), 45000, 'performance').catch(() => ({
      performance: 0, seo: 0, accessibility: 0, bestPractices: 0,
      metrics: { lcp: null, cls: null, fcp: null, ttfb: null, tbt: null },
      raw: {},
    }));

    // Step 6: JS Errors (Playwright)
    await updateStep(STEP_KEYS.errors);
    const errorsData = await withTimeout(runPlaywright(url), 30000, 'errors').catch(() => ({
      consoleErrors: [], failedRequests: [], desktopScreenshot: null, mobileScreenshot: null, errorCount: 0, failedRequestCount: 0,
    }));

    // Step 7: AI Analysis
    await updateStep(STEP_KEYS.ai);
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
      current_step: 'completed',
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

    console.log(`[WORKER] Completed audit ${auditId}`);
  } catch (err: any) {
    console.error(`[WORKER] Fatal error for ${auditId}:`, err);
    await db.updateAudit(auditId, {
      status: 'failed',
      current_step: 'failed',
      results: { error: err.message } as any,
    });
  }
}

console.log('[WORKER] Ready, listening for jobs...');
