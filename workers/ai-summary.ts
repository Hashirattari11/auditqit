import OpenAI from 'openai';

// Gemini client (primary) — official OpenAI-compatible endpoint
const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || 'sk-placeholder',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// NVIDIA client (fallback)
const nvidiaClient = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'sk-placeholder',
  baseURL: process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

// Official model names — MUST match Google's docs exactly
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'];
const NVIDIA_MODELS = ['nvidia/llama-3.3-nemotron-super-49b-v1', 'meta/llama-3.3-70b-instruct'];

/** Sleep helper for retry backoff */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
    // Frontend bugs from Playwright (the real bugs!)
    ...(errorsData?.frontendBugs ?? []).map((b: any) => ({
      severity: b.severity,
      category: 'Frontend Bug',
      issue: b.type,
      description: b.element,
      fix: b.fix,
    })),
    // Security issues
    ...(securityData?.issues ?? []).map((i: any) => ({ ...i, category: 'Security' })),
    // SEO issues
    ...(seoData?.issues ?? []).map((i: any) => ({ ...i, category: 'SEO' })),
    // Broken links
    ...(linksData?.broken ?? []).slice(0, 10).map((l: any) => ({
      severity: 'medium',
      category: 'Links',
      issue: `Broken link: ${l.url}`,
      description: `HTTP ${l.status}`,
      fix: l.fix,
    })),
    // Console errors
    ...(errorsData?.consoleErrors ?? []).slice(0, 10).map((e: any) => ({
      severity: 'high',
      category: 'JavaScript',
      issue: 'JS Console Error',
      description: e.message,
      fix: e.fix,
    })),
    // Failed requests
    ...(errorsData?.failedRequests ?? []).slice(0, 10).map((r: any) => ({
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

  const prompt = `You are a senior developer doing a bug audit of: ${url}

REAL BUGS FOUND BY AUTOMATED SCANNER (${allIssues.length} total):

FRONTEND BUGS (${errorsData?.frontendBugCount ?? 0} found):
${(errorsData?.frontendBugs ?? []).slice(0, 15).map((b: any) => `- [${b.severity?.toUpperCase()}] ${b.type}: ${b.element || ''}`).join('\n') || 'None detected'}

SECURITY ISSUES (${securityData?.issues?.length ?? 0} found):
${(securityData?.issues ?? []).slice(0, 5).map((i: any) => `- [${i.severity?.toUpperCase()}] ${i.issue}: ${i.fix}`).join('\n') || 'None detected'}

SEO ISSUES (${seoData?.issues?.length ?? 0} found):
${(seoData?.issues ?? []).slice(0, 5).map((i: any) => `- [${i.severity?.toUpperCase()}] ${i.issue}: ${i.fix}`).join('\n') || 'None detected'}

BROKEN LINKS: ${linksData?.brokenCount ?? 0} broken out of ${linksData?.checked ?? 0} checked

JAVASCRIPT ERRORS (${errorsData?.errorCount ?? 0} console errors):
${(errorsData?.consoleErrors ?? []).slice(0, 5).map((e: any) => `- ${e.message}`).join('\n') || 'None'}

PERFORMANCE DATA:
- Score: ${perfData?.performance ?? 'N/A'}/100
- LCP: ${perfMetrics.lcp ? (perfMetrics.lcp / 1000).toFixed(2) + 's' : 'N/A'} (good: <2.5s)
- CLS: ${perfMetrics.cls ?? 'N/A'} (good: <0.1)
- TBT: ${perfMetrics.tbt ? perfMetrics.tbt + 'ms' : 'N/A'} (good: <200ms)

Your job: Explain the TOP 5 most important bugs in plain language.
For each bug:
1. What exactly is wrong (reference the actual element/data)
2. Why it matters (user impact or security risk)
3. Exact fix with code example if applicable

Do NOT give generic advice. Reference the actual bugs found above.
If no bugs found in a category, say "None detected".
End with 3 QUICK WINS — things that take under 1 hour to fix and would improve the site most.`;

  // Try Gemini first, then NVIDIA fallback
  const allAttempts: { client: OpenAI; model: string }[] = [
    ...GEMINI_MODELS.map(m => ({ client: geminiClient, model: m })),
    ...NVIDIA_MODELS.map(m => ({ client: nvidiaClient, model: m })),
  ];

  for (const { client, model } of allAttempts) {
    // Retry up to 2 times for rate limits (429)
    for (let attempt = 0; attempt < 2; attempt++) {
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
      } catch (error: any) {
        const is429 = error?.status === 429;
        console.error(`AI generation failed with model ${model} (attempt ${attempt + 1}):`, error?.message || error);
        if (is429 && attempt < 1) {
          await sleep(2000); // wait 2s before retry on rate limit
          continue;
        }
        break; // non-retryable error, move to next model
      }
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
