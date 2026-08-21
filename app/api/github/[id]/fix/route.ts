import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { issueId, filePath, originalCode, issue } = await request.json();

    if (!issue || !filePath) {
      return NextResponse.json({ error: 'issue and filePath required' }, { status: 400 });
    }

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.LLM_API_KEY || 'sk-placeholder',
      baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    });

    const prompt = `You are a senior developer fixing a real bug found in production code.

File: ${filePath}
Issue: ${issue}
${originalCode ? `Original code:\n\`\`\`\n${originalCode}\n\`\`\`` : ''}

Generate the complete fixed version of this code.
Rules:
- Include ONLY the fixed code in a code block
- Preserve all existing functionality
- Add a brief comment at top explaining what was changed
- Use proper syntax highlighting for the file type`;

    const response = await client.chat.completions.create({
      model: process.env.LLM_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const fixedCode = response.choices[0]?.message?.content || '';

    return NextResponse.json({
      fixedCode,
      filePath,
      issueId,
    });
  } catch (error) {
    console.error('Auto-fix error:', error);
    return NextResponse.json({ error: 'Failed to generate fix' }, { status: 500 });
  }
}
