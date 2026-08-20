import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

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

export async function runLighthouse(url: string): Promise<LighthouseResult> {
  let chrome: chromeLauncher.LaunchedChrome | null = null;

  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
      ],
    });

    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
    });

    if (!result || !result.lhr) {
      throw new Error('Lighthouse returned no results');
    }

    const lhr = result.lhr;

    const getMetric = (id: string): number | null => {
      const audit = lhr.audits[id];
      return audit?.numericValue ?? null;
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
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}
