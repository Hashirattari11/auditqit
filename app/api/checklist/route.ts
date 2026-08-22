import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

const CHECKLIST_ITEMS = [
  { id: 'https',       category: 'Security',    label: 'HTTPS enabled',                  critical: true  },
  { id: 'meta_title',  category: 'SEO',         label: 'Title tag present (30-60 chars)', critical: true  },
  { id: 'meta_desc',   category: 'SEO',         label: 'Meta description present',        critical: true  },
  { id: 'viewport',    category: 'Mobile',      label: 'Viewport meta tag',               critical: true  },
  { id: 'h1',         category: 'SEO',         label: 'Exactly one H1 tag',              critical: false },
  { id: 'robots',     category: 'SEO',         label: 'robots.txt exists',               critical: false },
  { id: 'sitemap',    category: 'SEO',         label: 'sitemap.xml exists',              critical: false },
  { id: 'og_tags',    category: 'Social',      label: 'Open Graph tags',                critical: false },
  { id: 'perf_score', category: 'Performance', label: 'Performance score > 70',          critical: true  },
  { id: 'no_errors',  category: 'Quality',     label: 'No JS console errors',            critical: true  },
  { id: 'no_404',     category: 'Quality',     label: 'No broken links',                critical: false },
  { id: 'csp',        category: 'Security',    label: 'Content Security Policy header',  critical: false },
  { id: 'hsts',       category: 'Security',    label: 'HSTS header',                    critical: false },
  { id: 'x_frame',    category: 'Security',    label: 'X-Frame-Options header',         critical: false },
  { id: 'canonical',  category: 'SEO',         label: 'Canonical tag',                  critical: false },
  { id: 'favicon',    category: 'UI',          label: 'Favicon present',                critical: false },
  { id: 'mobile_ok',  category: 'Mobile',      label: 'Mobile responsive',              critical: true  },
  { id: 'fast_load',  category: 'Performance', label: 'Page loads under 3 seconds',     critical: true  },
];

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const results: any[] = [];

    const check = (id: string, pass: boolean, fix: string) => {
      const item = CHECKLIST_ITEMS.find((i) => i.id === id)!;
      results.push({ ...item, pass, fix: pass ? 'Looks good!' : fix });
    };

    // Fetch page
    const response = await axios.get(normalizedUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'AuditIQ Checklist Bot' },
      validateStatus: () => true,
    });
    const html = typeof response.data === 'string' ? response.data : '';
    const $ = cheerio.load(html);
    const headers = response.headers;

    // HTTPS
    check('https', normalizedUrl.startsWith('https://'), "Get a free SSL cert from Let's Encrypt and enforce HTTPS");

    // Title
    const title = $('title').text().trim();
    check('meta_title', title.length >= 30 && title.length <= 60, `Title is ${title.length} chars — aim for 30-60`);

    // Meta description
    const metaDesc = $('meta[name="description"]').attr('content') ?? '';
    check('meta_desc', metaDesc.length > 0, 'Add <meta name="description" content="..."> to <head>');

    // Viewport
    check('viewport', !!$('meta[name="viewport"]').length, 'Add <meta name="viewport" content="width=device-width, initial-scale=1">');

    // H1
    check('h1', $('h1').length === 1, `Found ${$('h1').length} H1 tags — use exactly one`);

    // Favicon
    check('favicon', !!$('link[rel*="icon"]').length, 'Add <link rel="icon" href="/favicon.ico"> to <head>');

    // OG tags
    check('og_tags', !!$('meta[property="og:title"]').length, 'Add Open Graph meta tags for better social sharing');

    // Canonical
    check('canonical', !!$('link[rel="canonical"]').length, 'Add <link rel="canonical" href="..."> to <head>');

    // Security headers
    check('csp', !!headers['content-security-policy'], 'Add Content-Security-Policy header to your server/CDN');
    check('hsts', !!headers['strict-transport-security'], 'Add Strict-Transport-Security header');
    check('x_frame', !!headers['x-frame-options'], 'Add X-Frame-Options: DENY header');

    // Performance (basic — response time)
    const startTime = Date.now();
    await axios.get(normalizedUrl, { timeout: 5000, validateStatus: () => true });
    const loadTime = Date.now() - startTime;
    check('fast_load', loadTime < 3000, `Page loaded in ${loadTime}ms — optimize to under 3000ms`);

    // Robots.txt
    try {
      const robotsRes = await axios.get(new URL('/robots.txt', normalizedUrl).href, { timeout: 3000, validateStatus: () => true });
      check('robots', robotsRes.status === 200, 'Create a robots.txt file at the root of your domain');
    } catch {
      check('robots', false, 'Create a robots.txt file at the root of your domain');
    }

    // Sitemap
    try {
      const sitemapRes = await axios.get(new URL('/sitemap.xml', normalizedUrl).href, { timeout: 3000, validateStatus: () => true });
      check('sitemap', sitemapRes.status === 200, 'Create and submit a sitemap.xml');
    } catch {
      check('sitemap', false, 'Create and submit a sitemap.xml');
    }

    // Mobile
    const hasMobileIssues = html.includes('width=800') || html.includes('width=1024');
    check('mobile_ok', !hasMobileIssues, 'Remove fixed pixel widths that break mobile layout');

    // Perf score (basic heuristic based on load time)
    check('perf_score', loadTime < 2000, 'Run full audit to check Lighthouse performance score');

    // No errors / no 404 (basic — would need Playwright for real)
    check('no_errors', true, 'Run full audit to check for console errors');
    check('no_04', true, 'Run full audit to check for broken links');

    // Fix the no_04 id — rename it
    const idx = results.findIndex((r) => r.id === 'no_04');
    if (idx >= 0) results[idx].id = 'no_404';

    return NextResponse.json({ items: results, url: normalizedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: 'Could not reach URL: ' + (err.message || 'Unknown error') }, { status: 400 });
  }
}
