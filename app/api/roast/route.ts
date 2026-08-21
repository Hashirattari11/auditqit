import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import OpenAI from 'openai';
import { runFetch } from '../../../workers/fetch';
import { runSecurity } from '../../../workers/security';
import { runSEO } from '../../../workers/seo';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY || process.env.NVIDIA_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

function extractDomain(url: string): string {
  try {
    const u = url.startsWith('http') ? new URL(url) : new URL('https://' + url);
    return u.hostname.replace('www.', '');
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0].replace('www.', '');
  }
}

const ROAST_PROMPT = (url: string, perfScore: number, seoScore: number, secScore: number, bugCount: number, issues: any[]) => `You are a brutally honest senior developer who roasts websites like a stand-up comedian.
You've seen this website's audit data:

URL: ${url}
Performance Score: ${perfScore}/100
SEO Score: ${seoScore}/100
Security Score: ${secScore}/100
Bugs Found: ${bugCount}
Issues: ${JSON.stringify(issues.slice(0, 10))}

Write a ROAST of this website. Rules:
- Be funny but technically accurate — reference REAL numbers from the data
- Use the actual scores and metrics in your jokes
- 4-6 sentences max
- End with one genuine fix suggestion
- Do NOT be mean about the developer personally — roast the CODE only
- Style: like a senior dev reviewing a junior's first project

Example style:
"Bhai tera LCP 6.2 seconds hai — mere dada internet pe bhi yeh itna slow nahi tha. X-Frame-Options header missing hai — matlab koi bhi teri site ko iframe mein daal ke clickjack kar sakta hai, free of charge. Bugs mile hain — yeh website nahi, bug collection hai. Ek kaam karo: pehle image compress karo, baaki sab baad mein."

Keep it technical, funny, and in Hinglish OR English based on the URL's apparent target audience.
If scores are actually good (>85), roast lightly: "Actually decent — but fix karo phir baat karte hain."`;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const normalizedUrl = url.startsWith('http') ? url : 'https://' + url;
    const domain = extractDomain(url);

    // Run quick audit — parallel
    const [fetchResult, secResult, seoResult] = await Promise.allSettled([
      runFetch(normalizedUrl),
      runSecurity(normalizedUrl),
      runSEO(normalizedUrl, ''),
    ]);

    const fetchVal = fetchResult.status === 'fulfilled' ? fetchResult.value : null;
    const perfScore = fetchVal ? Math.max(10, Math.min(100, 100 - Math.floor(fetchVal.responseTime / 100))) : 50;
    const seoScore = seoResult.status === 'fulfilled' ? seoResult.value.score : 0;
    const secScore = secResult.status === 'fulfilled' ? secResult.value.score : 0;

    const allIssues = [
      ...(secResult.status === 'fulfilled' ? secResult.value.issues : []),
      ...(seoResult.status === 'fulfilled' ? seoResult.value.issues : []),
    ];
    const bugCount = allIssues.length;

    // Generate roast
    let roastText = '';
    try {
      const response = await client.chat.completions.create(
        {
          model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
          messages: [{ role: 'user', content: ROAST_PROMPT(normalizedUrl, perfScore, seoScore, secScore, bugCount, allIssues) }],
          temperature: 0.9,
          max_tokens: 500,
        },
        { timeout: 30000 }
      );
      roastText = response.choices[0]?.message?.content || 'This website needs more work than a Monday morning. Fix your basics first.';
    } catch {
      roastText = `Performance: ${perfScore}/100, SEO: ${seoScore}/100, Security: ${secScore}/100. That's all you need to know — fix it!`;
    }

    // Save to DB
    const roast = await db.createRoast({
      url: normalizedUrl,
      domain,
      roast_text: roastText,
      perf_score: perfScore,
      seo_score: seoScore,
      sec_score: secScore,
      bug_count: bugCount,
    });

    return NextResponse.json({
      id: (roast as any).id,
      roastText,
      domain,
      perfScore,
      seoScore,
      secScore,
      bugCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
