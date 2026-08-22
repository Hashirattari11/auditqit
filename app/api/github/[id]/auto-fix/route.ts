import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { createAutoFixPR } from '@/workers/auto-fix';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check Pro plan
    if (user.plan === 'free') {
      return NextResponse.json({ error: 'Auto-Fix PR requires Pro plan' }, { status: 403 });
    }

    // Check GitHub connected
    if (!user.github_access_token) {
      return NextResponse.json(
        { error: 'Connect your GitHub account first. Click "Sign in with GitHub" on the login page.' },
        { status: 400 }
      );
    }

    // Get repo audit
    const { data: audit } = await supabase
      .from('repo_audits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Parse repo from URL
    const repoMatch = audit.repo_url?.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) {
      return NextResponse.json({ error: 'Invalid repo URL' }, { status: 400 });
    }

    const [, repoOwner, repoName] = repoMatch;
    const issues = (audit.results as any)?.issues || [];

    const result = await createAutoFixPR({
      githubToken: user.github_access_token,
      repoOwner,
      repoName: repoName.replace('.git', ''),
      auditResults: audit.results,
      issues,
    });

    if (result.success) {
      // Save PR record
      await supabase.from('auto_fix_prs').insert({
        user_id: user.id,
        audit_id: audit.id,
        repo_url: audit.repo_url,
        repo_owner: repoOwner,
        repo_name: repoName,
        branch_name: result.branchName,
        pr_number: result.prNumber,
        pr_url: result.prUrl,
        fixes_applied: result.fixesApplied,
        estimated_score_gain: result.estimatedGain,
        status: 'created',
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[auto-fix] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create auto-fix PR' }, { status: 500 });
  }
}
