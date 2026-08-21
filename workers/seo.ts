import * as cheerio from 'cheerio';
import axios from 'axios';

export interface SEOResult {
  score: number;
  issues: Array<{ severity: string; issue: string; fix: string; location?: string }>;
  details: Record<string, any>;
}

export async function runSEO(url: string, html: string): Promise<SEOResult> {
  const issues: SEOResult['issues'] = [];
  let score = 100;

  if (!html) {
    return { score: 0, issues: [{ severity: 'critical', issue: 'Could not fetch page HTML', fix: 'Check if URL is accessible' }], details: {} };
  }

  const $ = cheerio.load(html);
  const details: Record<string, any> = {};

  // Title tag
  const title = $('title').text().trim();
  details.title = title;
  if (!title) {
    issues.push({ severity: 'high', issue: 'Missing title tag', fix: 'Add <title>Your Page Title</title> in <head>', location: '<head>' });
    score -= 20;
  } else if (title.length < 30) {
    issues.push({ severity: 'medium', issue: `Title too short (${title.length} chars)`, fix: 'Title should be 50-60 characters', location: '<title>' + title + '</title>' });
    score -= 5;
  } else if (title.length > 60) {
    issues.push({ severity: 'low', issue: `Title too long (${title.length} chars)`, fix: 'Shorten title to under 60 characters', location: '<title>' + title + '</title>' });
    score -= 5;
  }

  // Meta description
  const metaDesc = $('meta[name="description"]').attr('content') ?? '';
  details.metaDescription = metaDesc;
  if (!metaDesc) {
    issues.push({ severity: 'high', issue: 'Missing meta description', fix: 'Add <meta name="description" content="Your description">', location: '<head>' });
    score -= 15;
  } else if (metaDesc.length < 120) {
    issues.push({ severity: 'low', issue: `Meta description too short (${metaDesc.length} chars)`, fix: 'Should be 150-160 characters' });
    score -= 3;
  }

  // H1 tag
  const h1s = $('h1');
  details.h1Count = h1s.length;
  if (h1s.length === 0) {
    issues.push({ severity: 'high', issue: 'No H1 tag found', fix: 'Add exactly one <h1> tag with your main keyword', location: 'Page body' });
    score -= 15;
  } else if (h1s.length > 1) {
    issues.push({ severity: 'medium', issue: `Multiple H1 tags found (${h1s.length})`, fix: 'Use only one <h1> per page', location: 'Page body' });
    score -= 10;
  }

  // Images without alt
  const imgsWithoutAlt: string[] = [];
  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    const src = $(el).attr('src') ?? 'unknown';
    if (!alt && alt !== '') imgsWithoutAlt.push(src);
  });
  details.imagesWithoutAlt = imgsWithoutAlt.length;
  if (imgsWithoutAlt.length > 0) {
    issues.push({
      severity: 'medium',
      issue: `${imgsWithoutAlt.length} image(s) missing alt text`,
      fix: 'Add descriptive alt attributes to all images',
      location: imgsWithoutAlt.slice(0, 3).join(', '),
    });
    score -= Math.min(imgsWithoutAlt.length * 3, 15);
  }

  // Canonical
  const canonical = $('link[rel="canonical"]').attr('href');
  details.canonical = canonical ?? null;
  if (!canonical) {
    issues.push({ severity: 'low', issue: 'No canonical tag', fix: 'Add <link rel="canonical" href="https://yoursite.com/page">', location: '<head>' });
    score -= 5;
  }

  // Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  details.hasOpenGraph = !!(ogTitle && ogImage);
  if (!ogTitle) {
    issues.push({ severity: 'low', issue: 'Missing Open Graph tags', fix: 'Add og:title, og:description, og:image for social sharing', location: '<head>' });
    score -= 5;
  }

  // Viewport meta
  const viewport = $('meta[name="viewport"]').attr('content');
  details.hasViewport = !!viewport;
  if (!viewport) {
    issues.push({ severity: 'high', issue: 'Missing viewport meta tag', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">', location: '<head>' });
    score -= 10;
  }

  // robots.txt
  try {
    const robotsUrl = new URL('/robots.txt', url).href;
    const robotsRes = await axios.get(robotsUrl, { timeout: 5000, validateStatus: () => true });
    details.hasRobotsTxt = robotsRes.status === 200;
    if (robotsRes.status !== 200) {
      issues.push({ severity: 'low', issue: 'No robots.txt found', fix: 'Create a robots.txt file at the root of your domain', location: '/robots.txt' });
      score -= 5;
    }
  } catch { details.hasRobotsTxt = false; }

  // sitemap.xml
  try {
    const sitemapUrl = new URL('/sitemap.xml', url).href;
    const sitemapRes = await axios.get(sitemapUrl, { timeout: 5000, validateStatus: () => true });
    details.hasSitemap = sitemapRes.status === 200;
    if (sitemapRes.status !== 200) {
      issues.push({ severity: 'low', issue: 'No sitemap.xml found', fix: 'Create and submit a sitemap.xml to help search engines crawl your site', location: '/sitemap.xml' });
      score -= 5;
    }
  } catch { details.hasSitemap = false; }

  return {
    score: Math.max(0, score),
    issues,
    details,
  };
}
