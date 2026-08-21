export interface PlaywrightResult {
  consoleErrors: Array<{ message: string; location?: any; severity: string; fix: string }>;
  failedRequests: Array<{ url: string; method: string; error: string; resourceType: string; fix: string }>;
  desktopScreenshot: string | null;
  mobileScreenshot: string | null;
  errorCount: number;
  failedRequestCount: number;
}

export async function runPlaywright(url: string): Promise<PlaywrightResult> {
  let browser: any = null;

  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--disable-extensions'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    const page = await context.newPage();
    const consoleErrors: PlaywrightResult['consoleErrors'] = [];
    const failedRequests: PlaywrightResult['failedRequests'] = [];

    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          message: msg.text(),
          location: msg.location(),
          severity: 'high',
          fix: 'Check browser console for this error and fix the underlying JS issue',
        });
      }
    });

    page.on('requestfailed', (request: any) => {
      const reqUrl = request.url();
      if (reqUrl.includes('google-analytics') || reqUrl.includes('facebook') || reqUrl.includes('hotjar')) return;
      failedRequests.push({
        url: reqUrl,
        method: request.method(),
        error: request.failure()?.errorText ?? 'Unknown error',
        resourceType: request.resourceType(),
        fix: `Failed to load ${request.resourceType()} resource — check if file exists and is accessible`,
      });
    });

    // Try networkidle first, fallback to domcontentloaded
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    }

    // Wait for JS execution
    await page.waitForTimeout(2000);

    // Desktop screenshot
    const desktopScreenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false,
    }).then((buf: any) => buf.toString('base64')).catch(() => null);

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const mobileScreenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false,
    }).then((buf: any) => buf.toString('base64')).catch(() => null);

    return {
      consoleErrors: consoleErrors.slice(0, 20),
      failedRequests: failedRequests.slice(0, 20),
      desktopScreenshot,
      mobileScreenshot,
      errorCount: consoleErrors.length,
      failedRequestCount: failedRequests.length,
    };
  } finally {
    if (browser) await browser.close();
  }
}
