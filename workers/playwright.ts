export interface FrontendBug {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  element: string;
  fix: string;
}

export interface PlaywrightResult {
  consoleErrors: Array<{ message: string; location?: any; severity: string; fix: string }>;
  failedRequests: Array<{ url: string; method: string; error: string; resourceType: string; fix: string }>;
  frontendBugs: FrontendBug[];
  desktopScreenshot: string | null;
  mobileScreenshot: string | null;
  errorCount: number;
  failedRequestCount: number;
  frontendBugCount: number;
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

    // ====== FRONTEND BUG DETECTION ======
    const frontendBugs: FrontendBug[] = await page.evaluate(() => {
      const bugs: any[] = [];

      // 1. Images without alt
      document.querySelectorAll('img:not([alt])').forEach(img => {
        bugs.push({
          type: 'Missing Alt Text',
          severity: 'medium',
          element: (img as HTMLImageElement).src?.slice(0, 80) || 'unknown image',
          fix: 'Add alt attribute to this image tag for accessibility and SEO',
        });
      });

      // 2. Broken/empty links
      document.querySelectorAll('a[href=""], a[href="#"], a:not([href])').forEach(a => {
        bugs.push({
          type: 'Empty or broken anchor link',
          severity: 'low',
          element: (a as HTMLElement).outerHTML?.slice(0, 100),
          fix: 'Add a valid href or remove the anchor tag',
        });
      });

      // 3. Forms without labels
      document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([id])').forEach(input => {
        bugs.push({
          type: 'Form input missing label',
          severity: 'medium',
          element: (input as HTMLElement).outerHTML?.slice(0, 100),
          fix: 'Add a <label> element or aria-label attribute',
        });
      });

      // 4. Buttons without text
      document.querySelectorAll('button').forEach(btn => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
          bugs.push({
            type: 'Button has no text or aria-label',
            severity: 'high',
            element: btn.outerHTML?.slice(0, 100),
            fix: 'Add visible text or aria-label to button',
          });
        }
      });

      // 5. Mixed content (HTTP resources on HTTPS page)
      if (window.location.protocol === 'https:') {
        document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]').forEach(el => {
          bugs.push({
            type: 'Mixed Content (HTTP resource on HTTPS page)',
            severity: 'high',
            element: (el as HTMLImageElement).src || (el as HTMLLinkElement).href || '',
            fix: 'Change all resource URLs to HTTPS',
          });
        });
      }

      // 6. Multiple H1 tags
      const h1s = document.querySelectorAll('h1');
      if (h1s.length > 1) {
        bugs.push({
          type: `Multiple H1 tags found (${h1s.length})`,
          severity: 'medium',
          element: Array.from(h1s).map(h => h.textContent?.slice(0, 30)).join(', '),
          fix: 'Use only one H1 per page for proper SEO hierarchy',
        });
      }

      // 7. Missing viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        bugs.push({
          type: 'Missing viewport meta tag',
          severity: 'high',
          element: '<head>',
          fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
        });
      }

      // 8. Inline styles (bad practice)
      const inlineStyles = document.querySelectorAll('[style]').length;
      if (inlineStyles > 10) {
        bugs.push({
          type: `Excessive inline styles (${inlineStyles} elements)`,
          severity: 'low',
          element: `${inlineStyles} elements have inline style attributes`,
          fix: 'Move styles to CSS classes for better maintainability',
        });
      }

      // 9. console.log in page (dev code left in production)
      const scripts = Array.from(document.querySelectorAll('script:not([src])'));
      scripts.forEach(script => {
        if (script.textContent?.includes('console.log')) {
          bugs.push({
            type: 'console.log found in production code',
            severity: 'low',
            element: 'Inline script tag',
            fix: 'Remove all console.log statements before deploying to production',
          });
        }
      });

      // 10. Render blocking resources
      const renderBlockingScripts = document.querySelectorAll('head script:not([async]):not([defer]):not([type="application/json"])');
      if (renderBlockingScripts.length > 0) {
        bugs.push({
          type: `${renderBlockingScripts.length} render-blocking script(s) in <head>`,
          severity: 'high',
          element: `${renderBlockingScripts.length} <script> tags block page rendering`,
          fix: 'Add async or defer attribute to script tags in <head>',
        });
      }

      return bugs;
    });

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
      frontendBugs: frontendBugs.slice(0, 50),
      desktopScreenshot,
      mobileScreenshot,
      errorCount: consoleErrors.length,
      failedRequestCount: failedRequests.length,
      frontendBugCount: frontendBugs.length,
    };
  } finally {
    if (browser) await browser.close();
  }
}
