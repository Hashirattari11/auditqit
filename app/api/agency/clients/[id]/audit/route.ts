import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { runFetch } from '../../../../../../workers/fetch';
import { runSecurity } from '../../../../../../workers/security';
import { runSEO } from '../../../../../../workers/seo';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await db.getAgencyClient(params.id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const url = client.website_url.startsWith('http') ? client.website_url : 'https://' + client.website_url;

  try {
    const [fetchRes, secRes, seoRes] = await Promise.allSettled([
      runFetch(url),
      runSecurity(url),
      runSEO(url, ''),
    ]);

    const scores = {
      performance: 50,
      seo: seoRes.status === 'fulfilled' ? seoRes.value.score : 0,
      security: secRes.status === 'fulfilled' ? secRes.value.score : 0,
    };

    const audit = await db.createAudit(url, session.user.id);
    await db.updateAudit((audit as any).id, {
      status: 'completed',
      current_step: 'completed',
      results: {
        security: secRes.status === 'fulfilled' ? secRes.value : {},
        seo: seoRes.status === 'fulfilled' ? seoRes.value : {},
        performance: scores,
        overallScore: Math.round((scores.performance + scores.seo + scores.security) / 3),
      },
    });
    await db.addClientAudit(params.id, (audit as any).id);

    return NextResponse.json({ auditId: (audit as any).id, scores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
