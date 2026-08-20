import { chromium } from 'playwright';

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

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    // Desktop audit
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const desktopPage = await desktopContext.newPage();

    // Collect console errors
    desktopPage.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        result.consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          url: msg.location()?.url,
          line: msg.location()?.lineNumber ?? undefined,
        });
      }
    });

    // Collect failed requests
    desktopPage.on('requestfailed', (request) => {
      result.failedRequests.push({
        url: request.url(),
        status: 0,
        statusText: 'FAILED',
        failureText: request.failure()?.errorText,
      });
    });

    desktopPage.on('response', (response) => {
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
      const response = await desktopPage.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      result.loadTime = Date.now() - startTime;
      result.pageLoaded = response?.ok() ?? false;
      result.title = await desktopPage.title();

      // Wait a bit for dynamic content
      await desktopPage.waitForTimeout(2000);

      // Take desktop screenshot
      const desktopScreenshot = await desktopPage.screenshot({
        type: 'png',
        fullPage: false,
      });
      result.screenshots.desktop = desktopScreenshot.toString('base64');
    } catch (error) {
      result.pageLoaded = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.consoleErrors.push({
        type: 'page-error',
        text: `Page load failed: ${errorMessage}`,
      });
    }

    await desktopContext.close();

    // Mobile audit
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      isMobile: true,
    });
    const mobilePage = await mobileContext.newPage();

    try {
      await mobilePage.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await mobilePage.waitForTimeout(2000);

      const mobileScreenshot = await mobilePage.screenshot({
        type: 'png',
        fullPage: false,
      });
      result.screenshots.mobile = mobileScreenshot.toString('base64');
    } catch {
      // Mobile screenshot failure is non-critical
    }

    await mobileContext.close();
  } finally {
    await browser.close();
  }

  return result;
}
