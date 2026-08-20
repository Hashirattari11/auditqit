import axios from 'axios';

interface LinkCheckResult {
  totalLinks: number;
  checkedLinks: number;
  brokenLinks: {
    url: string;
    status: number;
    statusText: string;
    source: string;
  }[];
  linkStats: {
    total: number;
    working: number;
    broken: number;
    skipped: number;
  };
}

export async function checkLinks(
  html: string,
  baseUrl: string
): Promise<LinkCheckResult> {
  // Extract all href from anchor tags
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;
  const links: { href: string; index: number }[] = [];

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1] || match[2] || match[3];
    if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
      links.push({ href, index: match.index });
    }
  }

  // Deduplicate
  const uniqueLinks = [...new Set(links.map((l) => l.href))];

  const result: LinkCheckResult = {
    totalLinks: links.length,
    checkedLinks: 0,
    brokenLinks: [],
    linkStats: {
      total: uniqueLinks.length,
      working: 0,
      broken: 0,
      skipped: 0,
    },
  };

  // Check links in batches of 20
  const batchSize = 20;
  for (let i = 0; i < uniqueLinks.length; i += batchSize) {
    const batch = uniqueLinks.slice(i, i + batchSize);
    const promises = batch.map(async (href) => {
      try {
        let fullUrl = href;
        if (!href.startsWith('http')) {
          try {
            fullUrl = new URL(href, baseUrl).toString();
          } catch {
            result.linkStats.skipped++;
            return;
          }
        }

        // Only check same-origin links to avoid rate limiting
        const origin = new URL(baseUrl).origin;
        if (!fullUrl.startsWith(origin)) {
          result.linkStats.skipped++;
          return;
        }

        const response = await axios.head(fullUrl, {
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'AuditIQ/1.0 (Link Checker)',
          },
        });

        result.checkedLinks++;

        if (response.status >= 400) {
          result.brokenLinks.push({
            url: fullUrl,
            status: response.status,
            statusText: response.statusText || 'Unknown',
            source: 'page-link',
          });
          result.linkStats.broken++;
        } else {
          result.linkStats.working++;
        }
      } catch {
        result.checkedLinks++;
        result.linkStats.skipped++;
      }
    });

    await Promise.allSettled(promises);
  }

  return result;
}
