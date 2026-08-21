import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || process.env.NVIDIA_API_KEY || 'sk-placeholder',
  baseURL: process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

const FALLBACK_MODELS = [
  process.env.LLM_MODEL,
  'nvidia/llama-3.3-nemotron-super-49b-v1',
  'meta/llama-3.3-70b-instruct',
].filter(Boolean) as string[];

export interface AIResult {
  summary: string;
  issueCount: number;
  criticalCount: number;
  highCount: number;
  allIssues: any[];
  overallScore: number;
}

export async function runAI(auditResults: any): Promise<AIResult> {
  const { url, securityData, seoData, linksData, perfData, errorsData } = auditResults;

  const allIssues = [
    ...(securityData?.issues ?? []).map((i: any) => ({ ...i, category: 'Security' })),
    ...(seoData?.issues ?? []).map((i: any) => ({ ...i, category: 'SEO' })),
    ...(linksData?.broken ?? []).slice(0, 10).map((l: any) => ({
      severity: 'medium',
      category: 'Links',
      issue: `Broken link: ${l.url}`,
      description: `HTTP ${l.status}`,
      fix: l.fix,
    })),
    ...(errorsData?.consoleErrors ?? []).slice(0, 5).map((e: any) => ({
      severity: 'high',
      category: 'JavaScript',
      issue: 'JS Console Error',
      description: e.message,
      fix: e.fix,
    })),
    ...(errorsData?.failedRequests ?? []).slice(0, 5).map((r: any) => ({
      severity: 'medium',
      category: 'Network',
      issue: `Failed to load: ${r.resourceType}`,
      description: r.error,
      fix: r.fix,
    })),
  ];

  const perfMetrics = perfData?.metrics ?? {};
  const overallScore = Math.round([
    perfData?.performance ?? 50,
    seoData?.score ?? 50,
    securityData?.score ?? 50,
  ].reduce((a, b) => a + b, 0) / 3);

  const prompt = `You are a senior web developer and SEO expert doing a professional audit of: ${url}

Here is the complete technical audit data:

PERFORMANCE (Score: ${perfData?.performance ?? 'N/A'}/100):
- LCP: ${perfMetrics.lcp ? (perfMetrics.lcp / 1000).toFixed(2) + 's' : 'N/A'}
- FCP: ${perfMetrics.fcp ? (perfMetrics.fcp / 1000).toFixed(2) + 's' : 'N/A'}
- CLS: ${perfMetrics.cls ?? 'N/A'}
- TBT: ${perfMetrics.tbt ? perfMetrics.tbt + 'ms' : 'N/A'}
- TTFB: ${perfMetrics.ttfb ? (perfMetrics.ttfb / 1000).toFixed(2) + 's' : 'N/A'}
- Accessibility: ${perfData?.accessibility ?? 'N/A'}/100
- Best Practices: ${perfData?.bestPractices ?? 'N/A'}/100

SEO (Score: ${seoData?.score ?? 'N/A'}/100):
- Title: ${seoData?.details?.title || 'Missing'}
- Meta Description: ${seoData?.details?.metaDescription ? 'Present (' + seoData.details.metaDescription.length + ' chars)' : 'Missing'}
- H1 Tags: ${seoData?.details?.h1Count ?? 'N/A'}
- Images without alt: ${seoData?.details?.imagesWithoutAlt ?? 'N/A'}
- Canonical: ${seoData?.details?.canonical ? 'Present' : 'Missing'}
- Viewport: ${seoData?.details?.hasViewport ? 'Present' : 'Missing'}
- robots.txt: ${seoData?.details?.hasRobotsTxt ? 'Exists' : 'Missing'}
- sitemap.xml: ${seoData?.details?.hasSitemap ? 'Exists' : 'Missing'}

SECURITY (Score: ${securityData?.score ?? 'N/A'}/100):
- HTTPS: ${securityData?.isHttps ? 'Yes' : 'No'}
- Missing headers: ${(securityData?.issues ?? []).filter((i: any) => i.issue?.includes('Missing')).map((i: any) => i.issue).join(', ') || 'None'}

BROKEN LINKS: ${linksData?.brokenCount ?? 0} broken out of ${linksData?.checked ?? 0} checked

JAVASCRIPT ERRORS: ${errorsData?.errorCount ?? 0} console errors found
${(errorsData?.consoleErrors ?? []).slice(0, 3).map((e: any) => '- ' + e.message).join('\n')}

FAILED REQUESTS: ${errorsData?.failedRequestCount ?? 0} failed network requests

ALL ISSUES FOUND (${allIssues.length} total):
${JSON.stringify(allIssues.slice(0, 20), null, 2)}

Based on this real data, provide:

1. EXECUTIVE SUMMARY (2-3 sentences about the overall state of this specific website)

2. OVERALL GRADE: ${overallScore}/100 — what does this mean for this site specifically?

3. TOP 5 CRITICAL ISSUES (from the real data above, most important first):
   For each: exact issue, why it matters, exact fix with code example if applicable

4. QUICK WINS (3 things that take under 1 hour to fix that would improve score most)

5. ONE POSITIVE (something this site actually does well based on the data)

Be specific to THIS website's data. Reference actual numbers. Do not give generic advice.
If performance score is 0 or missing, say audit timed out for that section.`;

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        },
        { timeout: 30000 }
      );

      const aiText = response.choices[0]?.message?.content || '';

      return {
        summary: aiText,
        issueCount: allIssues.length,
        criticalCount: allIssues.filter((i: any) => i.severity === 'critical').length,
        highCount: allIssues.filter((i: any) => i.severity === 'high').length,
        allIssues,
        overallScore,
      };
    } catch (error) {
      console.error(`AI generation failed with model ${model}:`, error);
      continue;
    }
  }

  // All models failed — return data without AI summary
  return {
    summary: '',
    issueCount: allIssues.length,
    criticalCount: allIssues.filter((i: any) => i.severity === 'critical').length,
    highCount: allIssues.filter((i: any) => i.severity === 'high').length,
    allIssues,
    overallScore,
  };
}
