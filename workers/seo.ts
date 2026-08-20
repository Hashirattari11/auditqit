import axios from 'axios';

interface SEOCheckResult {
  title: {
    present: boolean;
    content: string;
    length: number;
    optimalLength: boolean;
  };
  metaDescription: {
    present: boolean;
    content: string;
    length: number;
    optimalLength: boolean;
  };
  h1: {
    count: number;
    texts: string[];
    hasExactlyOne: boolean;
  };
  imagesWithoutAlt: {
    total: number;
    withoutAlt: number;
    ratio: number;
    samples: string[];
  };
  canonical: {
    present: boolean;
    href: string | null;
  };
  robotsTxt: {
    exists: boolean;
    content: string | null;
  };
  sitemapXml: {
    exists: boolean;
    urls: number;
  };
  openGraph: {
    title: boolean;
    description: boolean;
    image: boolean;
    url: boolean;
    type: boolean;
  };
  score: number;
}

export async function checkSEO(url: string, html: string): Promise<SEOCheckResult> {
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;

  // Title check
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleContent = titleMatch ? titleMatch[1].trim() : '';

  // Meta description check
  const metaDescMatch = html.match(
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i
  ) || html.match(/<meta\s+[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const metaDescContent = metaDescMatch ? metaDescMatch[1].trim() : '';

  // H1 check
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Texts = h1Matches.map((h1) =>
    h1.replace(/<[^>]*>/g, '').trim()
  );

  // Images without alt
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAltList = imgMatches.filter(
    (img) => !img.match(/alt=["'][^"']+["']/i)
  );

  // Canonical
  const canonicalMatch = html.match(
    /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["']/i
  ) || html.match(
    /<link\s+[^>]*href=["']([\s\S]*?)["'][^>]*rel=["']canonical["']/i
  );

  // Open Graph
  const ogCheck = (prop: string) =>
    new RegExp(`property=["']og:${prop}["']`, 'i').test(html) ||
    new RegExp(`name=["']og:${prop}["']`, 'i').test(html);

  // Check robots.txt and sitemap.xml
  let robotsTxtExists = false;
  let robotsTxtContent: string | null = null;
  let sitemapExists = false;
  let sitemapUrls = 0;

  try {
    const robotsResponse = await axios.get(`${origin}/robots.txt`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    robotsTxtExists = robotsResponse.status === 200;
    robotsTxtContent = robotsTxtExists ? robotsResponse.data : null;
  } catch {
    // robots.txt doesn't exist
  }

  try {
    const sitemapResponse = await axios.get(`${origin}/sitemap.xml`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    sitemapExists = sitemapResponse.status === 200;
    if (sitemapExists) {
      const urlCount = sitemapResponse.data.match(/<url>/gi);
      sitemapUrls = urlCount ? urlCount.length : 0;
    }
  } catch {
    // sitemap.xml doesn't exist
  }

  // Calculate SEO score
  let score = 0;
  if (titleContent) score += 15;
  if (titleContent.length >= 50 && titleContent.length <= 60) score += 5;
  if (metaDescContent) score += 15;
  if (metaDescContent.length >= 120 && metaDescContent.length <= 160) score += 5;
  if (h1Texts.length === 1) score += 10;
  if (imagesWithoutAltList.length === 0 && imgMatches.length > 0) score += 10;
  else if (imagesWithoutAltList.length < imgMatches.length) score += 5;
  if (canonicalMatch) score += 5;
  if (robotsTxtExists) score += 10;
  if (sitemapExists) score += 10;
  if (ogCheck('title') && ogCheck('description') && ogCheck('image')) score += 15;

  return {
    title: {
      present: !!titleContent,
      content: titleContent,
      length: titleContent.length,
      optimalLength: titleContent.length >= 50 && titleContent.length <= 60,
    },
    metaDescription: {
      present: !!metaDescContent,
      content: metaDescContent,
      length: metaDescContent.length,
      optimalLength: metaDescContent.length >= 120 && metaDescContent.length <= 160,
    },
    h1: {
      count: h1Texts.length,
      texts: h1Texts,
      hasExactlyOne: h1Texts.length === 1,
    },
    imagesWithoutAlt: {
      total: imgMatches.length,
      withoutAlt: imagesWithoutAltList.length,
      ratio: imgMatches.length > 0 ? imagesWithoutAltList.length / imgMatches.length : 0,
      samples: imagesWithoutAltList.slice(0, 5).map((img) => {
        const srcMatch = img.match(/src=["']([^"']*)["']/i);
        return srcMatch ? srcMatch[1] : 'unknown';
      }),
    },
    canonical: {
      present: !!canonicalMatch,
      href: canonicalMatch ? canonicalMatch[1] : null,
    },
    robotsTxt: {
      exists: robotsTxtExists,
      content: robotsTxtContent,
    },
    sitemapXml: {
      exists: sitemapExists,
      urls: sitemapUrls,
    },
    openGraph: {
      title: ogCheck('title'),
      description: ogCheck('description'),
      image: ogCheck('image'),
      url: ogCheck('url'),
      type: ogCheck('type'),
    },
    score: Math.min(score, 100),
  };
}
