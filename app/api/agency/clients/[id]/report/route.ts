import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await db.getAgencyClient(params.id);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const agency = await db.getAgencyById(client.agency_id);
  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 });

  // Get latest audit
  const audits = await db.getClientAudits(params.id, 1);
  const latestAudit = audits[0] as any;
  const auditData = latestAudit?.audits?.results || {};
  const scores = auditData.performance || {};
  const overall = auditData.overallScore || 0;

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: `${agency.name} <reports@auditiq.com>`,
      to: client.email,
      subject: `${agency.name} — Weekly Report for ${client.website_url}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${agency.logo ? `<img src="${agency.logo}" alt="${agency.name}" style="height: 40px; margin-bottom: 20px;" />` : ''}
          <h1 style="color: #333;">Weekly Website Health Report</h1>
          <p style="color: #666;">Prepared by <strong>${agency.name}</strong></p>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: ${overall >= 80 ? '#22c55e' : overall >= 50 ? '#eab308' : '#ef4444'};">${overall}/100</div>
          </div>
          <h3>Score Breakdown</h3>
          <ul>
            <li>Performance: ${scores.performance ?? 'N/A'}/100</li>
            <li>SEO: ${scores.seo ?? auditData.seo?.score ?? 'N/A'}/100</li>
            <li>Security: ${scores.security ?? auditData.security?.score ?? 'N/A'}/100</li>
          </ul>
          <a href="https://auditiq.com/report/${latestAudit?.audit_id}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">View Full Report</a>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">This report was prepared by ${agency.name}. Powered by AuditIQ.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
