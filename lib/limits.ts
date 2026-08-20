import { supabase } from './db';

export const FREE_LIMIT = 5;
export const ANON_LIMIT = 2;
export const PRO_PRICE = '$9/month';

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
  reason?: string;
}

// Check if user can run an audit
export async function checkUserUsage(userId: string): Promise<UsageCheck> {
  const { data: user } = await supabase
    .from('users')
    .select('plan, audits_this_month, month_reset_date')
    .eq('id', userId)
    .single();

  if (!user) {
    return { allowed: false, current: 0, limit: 0, plan: 'none', reason: 'User not found' };
  }

  // Check if month has reset
  const now = new Date();
  const resetDate = new Date(user.month_reset_date);
  if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
    // Reset counter
    await supabase
      .from('users')
      .update({
        audits_this_month: 0,
        month_reset_date: now.toISOString(),
      })
      .eq('id', userId);

    return {
      allowed: true,
      current: 0,
      limit: user.plan === 'pro' ? Infinity : FREE_LIMIT,
      plan: user.plan,
    };
  }

  const limit = user.plan === 'pro' ? Infinity : FREE_LIMIT;
  const current = user.audits_this_month || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit: FREE_LIMIT,
      plan: user.plan,
      reason: `You've used all ${FREE_LIMIT} free audits this month. Upgrade to Pro for unlimited audits.`,
    };
  }

  return {
    allowed: true,
    current,
    limit: FREE_LIMIT,
    plan: user.plan,
  };
}

// Check anonymous (IP-based) usage
export async function checkAnonymousUsage(ip: string): Promise<UsageCheck> {
  const today = new Date().toISOString().split('T')[0];

  const { data: usage } = await supabase
    .from('ip_usage')
    .select('*')
    .eq('ip', ip)
    .single();

  if (!usage) {
    // First time - create record
    await supabase.from('ip_usage').insert({
      ip,
      audits_today: 1,
      last_audit_date: today,
    });
    return { allowed: true, current: 1, limit: ANON_LIMIT, plan: 'anonymous' };
  }

  // Check if day has reset
  if (usage.last_audit_date !== today) {
    await supabase
      .from('ip_usage')
      .update({ audits_today: 1, last_audit_date: today })
      .eq('ip', ip);
    return { allowed: true, current: 1, limit: ANON_LIMIT, plan: 'anonymous' };
  }

  const current = usage.audits_today || 0;
  if (current >= ANON_LIMIT) {
    return {
      allowed: false,
      current,
      limit: ANON_LIMIT,
      plan: 'anonymous',
      reason: `You've used all ${ANON_LIMIT} free audits today. Sign up for 5 audits/month or upgrade to Pro.`,
    };
  }

  // Increment counter
  await supabase
    .from('ip_usage')
    .update({ audits_today: current + 1 })
    .eq('ip', ip);

  return { allowed: true, current: current + 1, limit: ANON_LIMIT, plan: 'anonymous' };
}

// Increment user audit count after starting an audit
export async function incrementUserAuditCount(userId: string): Promise<void> {
  try {
    await supabase.rpc('increment_audits', { uid: userId });
  } catch {
    // Fallback if RPC doesn't exist - manual increment
    const { data } = await supabase
      .from('users')
      .select('audits_this_month')
      .eq('id', userId)
      .single();

    if (data) {
      await supabase
        .from('users')
        .update({ audits_this_month: (data.audits_this_month || 0) + 1 })
        .eq('id', userId);
    }
  }
}

// Get user IP from request headers
export function getIPFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}
