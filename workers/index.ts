import { db, supabase } from '../lib/db';
import { runLighthouse } from './lighthouse';
import { runPlaywright } from './playwright';
import { checkHeaders } from './headers';
import { checkLinks } from './linkchecker';
import { checkSEO } from './seo';
import { generateAISummary } from '../lib/llm';
import axios from 'axios';

interface AuditStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

interface AuditData {
  url: string;
  auditId: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function runAudit(data: AuditData) {
  const { url, auditId } = data;

  console.log(`\n🔍 Starting audit for: ${url} (${auditId})`);

  try {
    // Update status to running
    await db.updateAudit(auditId, { status: 'running', current_step: 'Initializing audit...' });

    // Fetch HTML first (needed for SEO and link checking)
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

    // Run all checks in parallel with 60s timeout each
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

    // Run all in parallel
    await Promise.allSettled([
      runStep('lighthouse', () => runLighthouse(url)),
      runStep('playwright', () => runPlaywright(url)),
      runStep('headers', () => checkHeaders(url)),
      runStep('links', () => checkLinks(html, url)),
      runStep('seo', () => checkSEO(url, html)),
    ]);

    // Collect results
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

    // Save results
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

// Start the worker (standalone mode)
console.log('🚀 AuditIQ Worker started. Waiting for jobs...');

// In standalone mode, we listen for Supabase changes or use a polling approach
// For now, this file is imported by the API route for inline execution
export { runAudit };
