import { db } from '@/lib/db';

const runningJobs = new Set<string>();

export async function runGitHubAuditInline(repoUrl: string, auditId: string) {
  if (runningJobs.has(auditId)) return;
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
  } catch (error) {
    await db.updateRepoAudit(auditId, {
      status: 'failed',
      current_step: '',
      results: { error: error instanceof Error ? error.message : 'Unknown error' } as any,
    });
  } finally {
    runningJobs.delete(auditId);
  }
}

export function isGitHubAuditRunning(auditId: string): boolean {
  return runningJobs.has(auditId);
}
