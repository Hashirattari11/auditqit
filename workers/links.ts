import * as cheerio from 'cheerio';
import axios from 'axios';

export interface LinksResult {
  broken: Array<{ url: string; status: number; error?: string; fix: string }>;
  total: number;
  checked: number;
  brokenCount: number;
}

export async function runLinks(url: string, html: string): Promise<LinksResult> {
  if (!html) return { broken: [], total: 0, checked: 0, brokenCount: 0 };

  const $ = cheerio.load(html);
  const links: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    try {
      const absoluteUrl = new URL(href, url).href;
      if (!links.includes(absoluteUrl) && links.length < 50) {
        links.push(absoluteUrl);
      }
    } catch { /* invalid URL, skip */ }
  });

  const broken: LinksResult['broken'] = [];
  const batchSize = 10;

  for (let i = 0; i < Math.min(links.length, 50); i += batchSize) {
    const batch = links.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (link) => {
        try {
          const res = await axios.head(link, {
            timeout: 5000,
            validateStatus: () => true,
            headers: { 'User-Agent': 'AuditIQ Link Checker' },
            maxRedirects: 3,
          });
          return { url: link, status: res.status, ok: res.status < 400 };
        } catch (err: any) {
          return { url: link, status: 0, ok: false, error: err.message };
        }
      })
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.ok) {
        broken.push({
          url: batch[index],
          status: result.value.status,
          error: result.value.error,
          fix: result.value.status === 404
            ? 'Page not found — update or remove this link'
            : 'Link is unreachable — check if destination still exists',
        });
      }
    });
  }

  return {
    broken,
    total: links.length,
    checked: Math.min(links.length, 50),
    brokenCount: broken.length,
  };
}
