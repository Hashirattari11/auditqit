import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'sk-placeholder',
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

// Fallback models in case the primary one fails
const FALLBACK_MODELS = [
  process.env.LLM_MODEL,
  'meta/llama-3.3-70b-instruct',
  'microsoft/phi-4-mini-instruct',
  'nvidia/nemotron-mini-4b-instruct',
].filter(Boolean) as string[];

const WEB_AUDIT_PROMPT = `You are a web performance expert. Analyze these audit results and provide:
1. Overall health score (0-100)
2. Top 3 critical issues that need immediate fixing (with exact fix instructions)
3. Top 3 improvements for better performance
4. One positive thing about this website

Keep language simple, technical but not jargon-heavy. Format in clean sections with markdown.
Be specific with actionable advice. Reference actual values from the audit data.`;

const GITHUB_AUDIT_PROMPT = `You are a senior code reviewer and security expert. Analyze this GitHub repository audit data and provide:

1. **Security Score** (0-100) - based on critical/high security issues found
2. **Code Quality Score** (0-100) - based on code patterns, complexity, best practices
3. **Top 5 Critical Issues** - with exact fix instructions and corrected code
4. **Security Assessment** - vulnerabilities ranked by severity with remediation steps
5. **Code Quality Assessment** - patterns to improve, refactoring suggestions
6. **Best Practices Checklist** - what's done well, what needs improvement
7. **Action Plan** - prioritized list of fixes with estimated effort

IMPORTANT: For each critical/high issue, provide the EXACT corrected code that fixes the problem.
Format in clean markdown sections. Be specific with line references and file paths.
Use code blocks for all code suggestions.`;

async function tryGenerate(
  model: string,
  systemPrompt: string,
  userContent: string,
  maxTokens: number
): Promise<string | null> {
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }, { timeout: 30000 });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error(`AI generation failed with model ${model}:`, error);
    return null;
  }
}

export async function generateAISummary(auditResults: Record<string, unknown>): Promise<string> {
  const userContent = `Analyze these web audit results and provide your expert assessment:\n\n${JSON.stringify(auditResults, null, 2)}`;

  for (const model of FALLBACK_MODELS) {
    const result = await tryGenerate(model, WEB_AUDIT_PROMPT, userContent, 2000);
    if (result) return result;
  }
  return '';
}

export async function generateGitHubAISummary(auditResults: Record<string, unknown>): Promise<string> {
  // Truncate results if too large for context window
  let resultsStr = JSON.stringify(auditResults, null, 2);
  if (resultsStr.length > 30000) {
    const truncated = {
      ...auditResults,
      issues: (auditResults.issues as any[])?.slice(0, 50),
      _note: 'Results truncated for AI analysis. Full results available in raw data.',
    };
    resultsStr = JSON.stringify(truncated, null, 2);
  }

  const userContent = `Analyze this GitHub repository code audit and provide your expert review:\n\n${resultsStr}`;

  for (const model of FALLBACK_MODELS) {
    const result = await tryGenerate(model, GITHUB_AUDIT_PROMPT, userContent, 4000);
    if (result) return result;
  }
  return '';
}
