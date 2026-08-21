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

export async function POST(req: Request) {
  try {
    const { url1, url2 } = await req.json();
    if (!url1 || !url2) return NextResponse.json({ error: 'Two URLs required' }, { status: 400 });

    const n1 = url1.startsWith('http') ? url1 : 'https://' + url1;
    const n2 = url2.startsWith('http') ? url2 : 'https://' + url2;
    const domain1 = extractDomain(url1);
    const domain2 = extractDomain(url2);

    // Run both audits in parallel
    const [r1, r2] = await Promise.all([
      Promise.allSettled([runFetch(n1), runSecurity(n1), runSEO(n1, '')]),
      Promise.allSettled([runFetch(n2), runSecurity(n2), runSEO(n2, '')]),
    ]);

    const getScore = (results: PromiseSettledResult<any>[], idx: number) =>
      results[idx]?.status === 'fulfilled' ? results[idx].value : {};

    const sec1 = getScore(r1, 1);
    const seo1 = getScore(r1, 2);
    const sec2 = getScore(r2, 1);
    const seo2 = getScore(r2, 2);

    const fetch1 = getScore(r1, 0);
    const fetch2 = getScore(r2, 0);
    const perf1 = fetch1.responseTime ? Math.max(10, Math.min(100, 100 - Math.floor(fetch1.responseTime / 100))) : 50;
    const perf2 = fetch2.responseTime ? Math.max(10, Math.min(100, 100 - Math.floor(fetch2.responseTime / 100))) : 50;
    const scores1 = { performance: perf1, seo: seo1.score ?? 0, security: sec1.score ?? 0 };
    const scores2 = { performance: perf2, seo: seo2.score ?? 0, security: sec2.score ?? 0 };

    // Calculate winners
    const categories = ['performance', 'seo', 'security'] as const;
    const categoryWinners = categories.map(cat => ({
      category: cat,
      winner: scores1[cat] > scores2[cat] ? 'url1' : scores2[cat] > scores1[cat] ? 'url2' : 'tie',
    }));

    const url1Wins = categoryWinners.filter(c => c.winner === 'url1').length;
    const url2Wins = categoryWinners.filter(c => c.winner === 'url2').length;
    const overallWinner = url1Wins > url2Wins ? 'url1' : url2Wins > url1Wins ? 'url2' : 'tie';

    // AI commentary
    let commentary = '';
    try {
      const prompt = `Two websites just battled. Here are their scores:
${domain1}: Performance ${scores1.performance}, SEO ${scores1.seo}, Security ${scores1.security}
${domain2}: Performance ${scores2.performance}, SEO ${scores2.seo}, Security ${scores2.security}
Overall winner: ${overallWinner === 'url1' ? domain1 : overallWinner === 'url2' ? domain2 : 'Tie'}
Write 2-3 sentences of battle commentary. Be dramatic and fun. Reference actual score differences. Keep it short, punchy, and shareable.`;

      const res = await client.chat.completions.create(
        {
          model: 'nvidia/llama-3.3-nemotron-super-49b-v1',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 300,
        },
        { timeout: 20000 }
      );
      commentary = res.choices[0]?.message?.content || '';
    } catch {
      commentary = `${domain1} scored ${Math.round((scores1.performance + scores1.seo + scores1.security) / 3)}/100 overall while ${domain2} scored ${Math.round((scores2.performance + scores2.seo + scores2.security) / 3)}/100.`;
    }

    // Save
    const battle = await db.createVsBattle({
      url1: n1, url2: n2, domain1, domain2,
      scores1, scores2, winner: overallWinner, commentary,
    });

    return NextResponse.json({
      id: (battle as any).id,
      scores1, scores2, domain1, domain2,
      categoryWinners, overallWinner, commentary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
