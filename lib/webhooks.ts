import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SIGNING_SECRET || 'default-webhook-secret';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export async function deliverWebhook(userId: string, event: string, data: Record<string, unknown>) {
  // Dynamic import to avoid circular dependency
  const { supabase } = await import('@/lib/db');

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (!webhooks || webhooks.length === 0) return;

  for (const webhook of webhooks) {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadStr = JSON.stringify(payload);
    const signature = createHmac('sha256', webhook.secret || WEBHOOK_SECRET)
      .update(payloadStr)
      .digest('hex');

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AuditIQ-Signature': signature,
          'X-AuditIQ-Event': event,
        },
        body: payloadStr,
      });

      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event,
        status_code: res.status,
        success: res.ok,
      });
    } catch {
      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event,
        success: false,
        response_body: 'Connection failed',
      });
    }
  }
}
