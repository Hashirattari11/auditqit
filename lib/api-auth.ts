import { NextRequest } from 'next/server';
import { db } from './db';

export interface ApiAuthResult {
  user: any;
  apiKey: any;
  error?: string;
  status?: number;
}

export async function validateApiRequest(request: NextRequest): Promise<ApiAuthResult> {
  const key = request.headers.get('x-api-key');
  if (!key) return { user: null, apiKey: null, error: 'Missing x-api-key header', status: 401 };

  const result = await db.validateApiKey(key);
  if (!result) return { user: null, apiKey: null, error: 'Invalid or revoked API key', status: 401 };

  const isPro = key.startsWith('aiq_pro_');
  const hourlyLimit = isPro ? 100 : 10;
  const dailyLimit = isPro ? 1000 : 50;

  const hourly = await db.getApiKeyUsageCount(result.id, 1);
  const daily = await db.getApiKeyUsageCount(result.id, 24);

  if (hourly >= hourlyLimit) return { user: result, apiKey: result, error: `Rate limit: ${hourlyLimit}/hour`, status: 429 };
  if (daily >= dailyLimit) return { user: result, apiKey: result, error: `Rate limit: ${dailyLimit}/day`, status: 429 };

  await db.logApiKeyUsage(result.id, request.url);
  return { user: result, apiKey: result };
}
