interface LighthouseResult {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  metrics: {
    lcp: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
    tbt: number | null;
  };
  raw: Record<string, unknown>;
}

const EMPTY_RESULT: LighthouseResult = {
  performance: 0,
  seo: 0,
  accessibility: 0,
  bestPractices: 0,
  metrics: { lcp: null, cls: null, fcp: null, ttfb: null, tbt: null },
  raw: {},
};

export async function runLighthouse(url: string): Promise<LighthouseResult> {
  // Try to find Chrome via chrome-launcher
  let chrome;
  try {
    const chromeLauncher = await import('chrome-launcher');
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--disable-extensions'],
    });
  } catch {
    // Chrome not available — try puppeteer as fallback
    try {
      const puppeteer = await import('puppeteer-core');
      const chromium = await import('@sparticuz/chromium');
      const browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      });
      const browserWSEndpoint = browser.wsEndpoint();
      const port = parseInt(new URL(browserWSEndpoint).port);
      const result = await runLighthouseWithPort(url, port);
      await browser.close();
      return result;
    } catch {
      // No browser available at all — lighthouse cannot run
      throw new Error('Lighthouse unavailable: No Chrome/Chromium found on this server');
    }
  }

  try {
    return await runLighthouseWithPort(url, chrome.port);
  } finally {
    if (chrome) await chrome.kill();
  }
}

async function runLighthouseWithPort(url: string, port: number): Promise<LighthouseResult> {
  // Dynamic import to avoid bundle-time failures (missing locale files on Vercel)
  let lighthouseFn: any;
  try {
    const mod = await import('lighthouse');
    lighthouseFn = mod.default || mod;
  } catch (err) {
    throw new Error(`Lighthouse module unavailable: ${err instanceof Error ? err.message : 'import failed'}`);
  }

  const result = await lighthouseFn(url, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
  });

  if (!result || !result.lhr) {
    throw new Error('Lighthouse returned no results');
  }

  const lhr = result.lhr;

  const getMetric = (id: string): number | null => {
    return lhr.audits[id]?.numericValue ?? null;
  };

  const getCategoryScore = (id: string): number => {
    return Math.round((lhr.categories[id]?.score ?? 0) * 100);
  };

  return {
    performance: getCategoryScore('performance'),
    seo: getCategoryScore('seo'),
    accessibility: getCategoryScore('accessibility'),
    bestPractices: getCategoryScore('best-practices'),
    metrics: {
      lcp: getMetric('largest-contentful-paint'),
      cls: getMetric('cumulative-layout-shift'),
      fcp: getMetric('first-contentful-paint'),
      ttfb: getMetric('server-response-time'),
      tbt: getMetric('total-blocking-time'),
    },
    raw: lhr as unknown as Record<string, unknown>,
  };
}
