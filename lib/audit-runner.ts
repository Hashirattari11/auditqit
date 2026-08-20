import { db } from '@/lib/db';
import { withTimeout } from '@/lib/timeout';

const runningJobs = new Set<string>();

/**
 * Step keys that get written to DB current_step field.
 * The frontend matches these to show progress.
 */
const STEP_KEYS = {
  fetch: 'fetch',
  lighthouse: 'lighthouse',
  playwright: 'playwright',
  headers: 'headers',
  links: 'links',
  seo: 'seo',
  ai: 'ai',
} as const;

export async function runAuditInline(url: string, auditId: string) {
  if (runningJobs.has(auditId)) return;
  runningJobs.add(auditId);

  try {
    const { runLighthouse } = await import('@/workers/lighthouse');
    const { runPlaywright } = await import('@/workers/playwright');
    const { checkHeaders } = await import('@/workers/headers');
    const { checkLinks } = await import('@/workers/linkchecker');
    const { checkSEO } = await import('@/workers/seo');
    const { generateAISummary } = await import('@/lib/llm');
    const axios = (await import('axios')).default;

    await db.updateAudit(auditId, { status: 'running', current_step: STEP_KEYS.fetch });

    // Fetch HTML first
    let html = '';
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'AuditIQ/1.0 (Web Audit Tool)' },
      });
      html = typeof response.data === 'string' ? response.data : '';
    } catch {
      html = '';
    }

    interface AuditStep {
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      result?: unknown;
      error?: string;
      stepKey: string;
    }

    const steps: Record<string, AuditStep> = {
      lighthouse: { name: 'Lighthouse', status: 'pending', stepKey: STEP_KEYS.lighthouse },
      playwright: { name: 'Playwright', status: 'pending', stepKey: STEP_KEYS.playwright },
      headers: { name: 'HTTP Headers', status: 'pending', stepKey: STEP_KEYS.headers },
      links: { name: 'Link Checker', status: 'pending', stepKey: STEP_KEYS.links },
      seo: { name: 'SEO Analysis', status: 'pending', stepKey: STEP_KEYS.seo },
    };

    const stepTimeout = 45000;
    const totalTimeout = 180000;

    const runStep = async (key: string, fn: () => Promise<unknown>) => {
      steps[key].status = 'running';
      // Update current_step so the frontend shows which step is active
      await db.updateAudit(auditId, { current_step: steps[key].stepKey }).catch(() => {});
      try {
        const result = await withTimeout(fn(), stepTimeout, steps[key].name);
        steps[key].result = result;
        steps[key].status = 'completed';
      } catch (error) {
        steps[key].status = 'failed';
        steps[key].error = error instanceof Error ? error.message : 'Unknown error';
      }
    };

    await withTimeout(
      Promise.allSettled([
        runStep('lighthouse', () => runLighthouse(url)),
        runStep('playwright', () => runPlaywright(url)),
        runStep('headers', () => checkHeaders(url)),
        runStep('links', () => checkLinks(html, url)),
        runStep('seo', () => checkSEO(url, html)),
      ]),
      totalTimeout,
      'Total audit'
    );

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

    await db.updateAudit(auditId, { current_step: STEP_KEYS.ai });
    const aiSummary = await generateAISummary(results as Record<string, unknown>);

    await db.updateAudit(auditId, {
      status: 'completed',
      results: results as any,
      ai_summary: aiSummary,
      current_step: '',
    });
  } catch (error) {
    await db.updateAudit(auditId, {
      status: 'failed',
      current_step: '',
      results: { error: error instanceof Error ? error.message : 'Unknown error' } as any,
    });
  } finally {
    runningJobs.delete(auditId);
  }
}

export function isAuditRunning(auditId: string): boolean {
  return runningJobs.has(auditId);
}
