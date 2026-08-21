import { db } from '@/lib/db';

const runningJobs = new Set<string>();

export interface GitHubAuditRunResult {
  status: 'completed' | 'failed';
  results: Record<string, unknown>;
  aiSummary: string;
}

export async function runGitHubAuditInline(repoUrl: string, auditId: string): Promise<GitHubAuditRunResult> {
  if (runningJobs.has(auditId)) {
    const existing = await db.getRepoAudit(auditId);
    return { status: (existing?.status as any) || 'running', results: existing?.results || {}, aiSummary: existing?.ai_summary || '' };
  }
  runningJobs.add(auditId);

  try {
    const { runGitHubAudit } = await import('@/workers/github-audit');
    const { generateGitHubAISummary } = await import('@/lib/llm');

    await db.updateRepoAudit(auditId, { status: 'running', current_step: 'scan' });

    const results = await runGitHubAudit(repoUrl);

    await db.updateRepoAudit(auditId, { current_step: 'ai' });
    const aiSummary = await generateGitHubAISummary(results as unknown as Record<string, unknown>);

    await db.updateRepoAudit(auditId, {
      status: 'completed',
      results: results as any,
      ai_summary: aiSummary,
      current_step: '',
    });

    return { status: 'completed', results: results as unknown as Record<string, unknown>, aiSummary };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await db.updateRepoAudit(auditId, {
      status: 'failed',
      current_step: '',
      results: { error: errMsg } as any,
    });
    return { status: 'failed', results: { error: errMsg }, aiSummary: '' };
  } finally {
    runningJobs.delete(auditId);
  }
}

export function isGitHubAuditRunning(auditId: string): boolean {
  return runningJobs.has(auditId);
}
