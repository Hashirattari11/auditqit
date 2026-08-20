interface PlaywrightResult {
  consoleErrors: { type: string; text: string; url?: string; line?: number }[];
  failedRequests: { url: string; status: number; statusText: string; failureText?: string }[];
  screenshots: { desktop: string | null; mobile: string | null };
  pageLoaded: boolean;
  loadTime: number;
  title: string;
}

export async function runPlaywright(url: string): Promise<PlaywrightResult> {
  const result: PlaywrightResult = {
    consoleErrors: [],
    failedRequests: [],
    screenshots: { desktop: null, mobile: null },
    pageLoaded: false,
    loadTime: 0,
    title: '',
  };

  // Try Playwright first, then puppeteer-core as fallback
  let browser: any = null;
  let usePuppeteer = false;

  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  } catch {
    // Playwright unavailable — try puppeteer-core
    try {
      const puppeteer = await import('puppeteer-core');
      const chromium = await import('@sparticuz/chromium');
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      });
      usePuppeteer = true;
    } catch {
      // No browser available at all — return empty result
      result.consoleErrors.push({
        type: 'browser-unavailable',
        text: 'Screenshots unavailable: No browser found on this server',
      });
      return result;
    }
  }

  try {
    if (usePuppeteer) {
      return await runWithPuppeteer(browser, url, result);
    } else {
      return await runWithPlaywright(browser, url, result);
    }
  } finally {
    await browser.close();
  }
}

async function runWithPlaywright(browser: any, url: string, result: PlaywrightResult): Promise<PlaywrightResult> {
  const { chromium } = await import('playwright');

  // Desktop
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  });
  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', (msg: any) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      result.consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        url: msg.location()?.url,
        line: msg.location()?.lineNumber ?? undefined,
      });
    }
  });

  desktopPage.on('requestfailed', (request: any) => {
    result.failedRequests.push({
      url: request.url(),
      status: 0,
      statusText: 'FAILED',
      failureText: request.failure()?.errorText,
    });
  });

  desktopPage.on('response', (response: any) => {
    if (response.status() >= 400) {
      result.failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });

  try {
    const startTime = Date.now();
    const response = await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    result.loadTime = Date.now() - startTime;
    result.pageLoaded = response?.ok() ?? false;
    result.title = await desktopPage.title();
    await desktopPage.waitForTimeout(2000);
    const screenshot = await desktopPage.screenshot({ type: 'png', fullPage: false });
    result.screenshots.desktop = screenshot.toString('base64');
  } catch (error) {
    result.pageLoaded = false;
    result.consoleErrors.push({ type: 'page-error', text: `Page load failed: ${error instanceof Error ? error.message : 'Unknown'}` });
  }

  await desktopContext.close();

  // Mobile
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Chrome/120.0.0.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  try {
    await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    await mobilePage.waitForTimeout(2000);
    const screenshot = await mobilePage.screenshot({ type: 'png', fullPage: false });
    result.screenshots.mobile = screenshot.toString('base64');
  } catch {
    // Mobile failure is non-critical
  }

  await mobileContext.close();
  return result;
}

async function runWithPuppeteer(browser: any, url: string, result: PlaywrightResult): Promise<PlaywrightResult> {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (msg: any) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      result.consoleErrors.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('requestfailed', (req: any) => {
    result.failedRequests.push({ url: req.url(), status: 0, statusText: 'FAILED', failureText: req.failure()?.errorText });
  });

  try {
    const startTime = Date.now();
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
    result.loadTime = Date.now() - startTime;
    result.pageLoaded = response?.ok() ?? false;
    result.title = await page.title();
    await new Promise(r => setTimeout(r, 2000));
    const screenshot = await page.screenshot({ type: 'png' });
    result.screenshots.desktop = screenshot.toString('base64');
  } catch (error) {
    result.pageLoaded = false;
    result.consoleErrors.push({ type: 'page-error', text: `Page load failed: ${error instanceof Error ? error.message : 'Unknown'}` });
  }

  // Mobile
  try {
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await mobilePage.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise(r => setTimeout(r, 2000));
    const screenshot = await mobilePage.screenshot({ type: 'png' });
    result.screenshots.mobile = screenshot.toString('base64');
    await mobilePage.close();
  } catch {
    // Non-critical
  }

  return result;
}
