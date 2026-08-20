import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

    const audit = await db.getRepoAudit(id);
    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (!audit.is_public && audit.user_id !== session?.user?.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const puppeteer = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');

    const browser = await puppeteer.default.launch({
      args: (chromium as any).args || [],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await (chromium as any).executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await page.goto(`${baseUrl}/github-report/${id}?pdf=true`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await new Promise((r) => setTimeout(r, 2000));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:10px;color:#64748b;width:100%;padding:0 40px;display:flex;justify-content:space-between;">
          <span>AuditIQ Code Review</span>
          <span>${new Date().toLocaleDateString()}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size:10px;color:#64748b;width:100%;text-align:center;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="code-review-${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
