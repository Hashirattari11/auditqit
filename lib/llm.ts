import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'sk-placeholder',
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

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

export async function generateAISummary(auditResults: Record<string, unknown>): Promise<string> {
  try {
    const model = process.env.LLM_MODEL || 'gpt-4o-mini';

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: WEB_AUDIT_PROMPT },
        {
          role: 'user',
          content: `Analyze these web audit results and provide your expert assessment:\n\n${JSON.stringify(auditResults, null, 2)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || 'AI summary generation failed - no response returned.';
  } catch (error) {
    console.error('AI Summary generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `AI summary generation failed: ${errorMessage}. Please review the raw audit data below.`;
  }
}

export async function generateGitHubAISummary(auditResults: Record<string, unknown>): Promise<string> {
  try {
    const model = process.env.LLM_MODEL || 'gpt-4o-mini';

    // Truncate results if too large for context window
    let resultsStr = JSON.stringify(auditResults, null, 2);
    if (resultsStr.length > 30000) {
      // Keep summary and first 50 issues
      const truncated = {
        ...auditResults,
        issues: (auditResults.issues as any[])?.slice(0, 50),
        _note: 'Results truncated for AI analysis. Full results available in raw data.',
      };
      resultsStr = JSON.stringify(truncated, null, 2);
    }

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: GITHUB_AUDIT_PROMPT },
        {
          role: 'user',
          content: `Analyze this GitHub repository code audit and provide your expert review:\n\n${resultsStr}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content || 'AI summary generation failed - no response returned.';
  } catch (error) {
    console.error('GitHub AI Summary generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `AI summary generation failed: ${errorMessage}. Please review the raw audit data below.`;
  }
}
