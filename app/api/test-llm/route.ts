import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say hi in 5 words' }],
        max_tokens: 20,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await response.json();
    return NextResponse.json({
      status: response.status,
      model,
      baseUrl,
      keyPrefix: apiKey?.substring(0, 20),
      response: data.choices?.[0]?.message?.content || data,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown',
      model,
      baseUrl,
      keyPrefix: apiKey?.substring(0, 20),
    });
  }
}
