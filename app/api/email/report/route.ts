import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendAuditReportEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { auditId, type } = body;

    if (!auditId) {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 });
    }

    // Import db here to avoid circular dependency
    const { db } = await import('@/lib/db');

    let auditData;
    if (type === 'github') {
      auditData = await db.getRepoAudit(auditId);
    } else {
      auditData = await db.getAudit(auditId);
    }

    if (!auditData) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Calculate score from results
    const results = auditData.results as Record<string, unknown>;
    let score = 0;
    const lighthouse = results?.lighthouse as Record<string, unknown> | null;
    if (lighthouse) {
      const perf = (lighthouse.performance as number) || 0;
      const seo = (lighthouse.seo as number) || 0;
      const acc = (lighthouse.accessibility as number) || 0;
      score = Math.round((perf + seo + acc) / 3);
    }

    const grade =
      score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reportPath = type === 'github' ? 'github-report' : 'report';
    const displayUrl = type === 'github'
      ? (results?.repoUrl as string) || (auditData as any).repo_url || ''
      : (auditData as any).url || '';

    const sent = await sendAuditReportEmail(session.user.email!, {
      url: displayUrl,
      score,
      grade,
      topIssues: [], // Could extract from results
      reportUrl: `${baseUrl}/${reportPath}/${auditId}`,
      type: type || 'web',
    });

    return NextResponse.json({
      success: sent,
      message: sent ? 'Email sent' : 'Email skipped (not configured)',
    });
  } catch (error) {
    console.error('Email report failed:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
