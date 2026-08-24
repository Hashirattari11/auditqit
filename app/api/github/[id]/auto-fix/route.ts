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
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    // Get user from DB (fresh read for latest token)
    const { data: user } = await supabase
      .from('users')
      .select('id, plan, github_access_token, github_username')
      .eq('id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check Pro plan
    const isAdmin = session.user.email === 'hashirattari73@gmail.com';
    if (user.plan === 'free' && !isAdmin) {
      return NextResponse.json(
        {
          error: 'Auto-Fix PR requires Pro plan',
          action: 'upgrade',
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    // Check GitHub connected
    if (!user.github_access_token) {
      return NextResponse.json(
        {
          error: 'GitHub account not connected',
          action: 'connect_github',
          message: 'Please connect your GitHub account to use Auto-Fix PR. You can do this from Settings or by signing in with GitHub.',
        },
        { status: 400 }
      );
    }

    // Get the GitHub audit
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

    // GitHub token expired or revoked
    if (err.status === 401 || err.message?.includes('Bad credentials')) {
      // Clear invalid token from DB
      try {
        const session = await auth();
        if (session?.user?.id) {
          await supabase
            .from('users')
            .update({ github_access_token: null, github_username: null })
            .eq('id', session.user.id);
        }
      } catch {
        // Best effort cleanup
      }
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub connection expired. Please reconnect your GitHub account.',
          action: 'reconnect_github',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Failed to create auto-fix PR' },
      { status: 500 }
    );
  }
}
