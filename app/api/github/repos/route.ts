import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/db';
import { Octokit } from '@octokit/rest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    // Get GitHub token from DB
    const { data: user } = await supabase
      .from('users')
      .select('github_access_token')
      .eq('id', session.user.id)
      .single();

    if (!user?.github_access_token) {
      return NextResponse.json(
        { error: 'GitHub not connected', repos: [] },
        { status: 200 }
      );
    }

    const octokit = new Octokit({ auth: user.github_access_token });

    // Fetch user's repos (sorted by recently updated, max 100)
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      type: 'owner',
    });

    const repoList = repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description || '',
      language: r.language || 'Unknown',
      stars: r.stargazers_count,
      forks: r.forks_count,
      updatedAt: r.updated_at,
      url: r.html_url,
      isPrivate: r.private,
    }));

    return NextResponse.json({ repos: repoList });
  } catch (err: any) {
    console.error('[github/repos] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch repos', repos: [] }, { status: 500 });
  }
}
