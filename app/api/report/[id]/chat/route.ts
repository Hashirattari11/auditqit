import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAISummary } from '@/lib/llm';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { message, history } = await request.json();

    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const audit = await db.getAudit(id);
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const systemPrompt = `You are AuditIQ's AI expert analyzing this specific audit report for ${audit.url}.
Complete audit data: ${JSON.stringify(audit.results)}

Answer questions specifically about THIS audit. Be direct and technical.
Give exact fix instructions with code when relevant.
Keep responses under 150 words unless code is needed.
If asked about something not in the audit data, say so.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).map((h: any) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ];

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.LLM_API_KEY || 'sk-placeholder',
      baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    });

    const stream = await client.chat.completions.create({
      model: process.env.LLM_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '' })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
