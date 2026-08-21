import { createClient, SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

function getSupabase(): SupabaseClient {
  if (globalForSupabase.supabase) return globalForSupabase.supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  const client = createClient(url, key);
  if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = client;
  return client;
}

// Lazy proxy — defers createClient until first actual use
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});

// Database helper types
export interface Audit {
  id: string;
  url: string;
  status: string;
  current_step: string | null;
  results: Record<string, unknown>;
  ai_summary: string;
  user_id: string | null;
  is_public: boolean;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface RepoAudit {
  id: string;
  repo_url: string;
  owner: string;
  repo: string;
  status: string;
  current_step: string | null;
  results: Record<string, unknown>;
  ai_summary: string;
  user_id: string | null;
  is_public: boolean;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  password_hash: string | null;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  audits_this_month: number;
  month_reset_date: string;
  created_at: string;
}

// Database operations
export const db = {
  // === Web Audit ===
  async createAudit(url: string, userId?: string): Promise<Audit> {
    const insertData: Record<string, unknown> = { url, status: 'pending' };
    if (userId) {
      insertData.user_id = userId;
    }

    const { data, error } = await supabase
      .from('audits')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as Audit;
  },

  async getAudit(id: string): Promise<Audit | null> {
    const { data, error } = await supabase
      .from('audits')
      .select('id, url, status, current_step, results, ai_summary, user_id, is_public, score, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getAudit error:', error);
      return null;
    }
    return data as unknown as Audit;
  },

  async updateAudit(id: string, updates: Partial<Pick<Audit, 'status' | 'current_step' | 'results' | 'ai_summary'>>) {
    const { error } = await supabase
      .from('audits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /** Atomically claim a pending audit — returns true if WE won the race */
  async claimAudit(id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('claim_audit', { audit_id: id });
    if (error) {
      console.error('claimAudit RPC error:', error);
      return false;
    }
    console.log('claimAudit RPC data:', JSON.stringify(data), 'type:', typeof data);
    // Supabase client may return: true, "true", [true], [{claim_audit:true}]
    if (data === true || data === 'true') return true;
    if (Array.isArray(data) && data.length > 0) {
      const val = data[0]?.claim_audit ?? data[0];
      return val === true || val === 'true';
    }
    return false;
  },

  async getRecentAudits(limit = 5, userId?: string): Promise<Audit[]> {
    let query = supabase
      .from('audits')
      .select('*')
      .eq('status', 'completed');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []) as Audit[];
  },

  // === GitHub Repo Audit ===
  async createRepoAudit(repoUrl: string, owner: string, repo: string, userId?: string): Promise<RepoAudit> {
    const insertData: Record<string, unknown> = { repo_url: repoUrl, owner, repo, status: 'pending' };
    if (userId) {
      insertData.user_id = userId;
    }

    const { data, error } = await supabase
      .from('repo_audits')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as RepoAudit;
  },

  async getRepoAudit(id: string): Promise<RepoAudit | null> {
    const { data, error } = await supabase
      .from('repo_audits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as RepoAudit;
  },

  async updateRepoAudit(id: string, updates: Partial<Pick<RepoAudit, 'status' | 'current_step' | 'results' | 'ai_summary'>>) {
    const { error } = await supabase
      .from('repo_audits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /** Atomically claim a pending repo audit — returns true if WE won the race */
  async claimRepoAudit(id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('claim_repo_audit', { audit_id: id });
    if (error) {
      console.error('claimRepoAudit RPC error:', error);
      return false;
    }
    return data === true;
  },

  async getRecentRepoAudits(limit = 5, userId?: string): Promise<RepoAudit[]> {
    let query = supabase
      .from('repo_audits')
      .select('*')
      .eq('status', 'completed');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []) as RepoAudit[];
  },

  // === User ===
  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as User;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data as User;
  },

  async updateUser(id: string, updates: Partial<Pick<User, 'name' | 'plan' | 'stripe_customer_id' | 'stripe_subscription_id' | 'audits_this_month' | 'month_reset_date'>>) {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getUserAudits(userId: string, limit = 20): Promise<(Audit | RepoAudit)[]> {
    const { data: webAudits } = await supabase
      .from('audits')
      .select('*, \'web\' as type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: repoAudits } = await supabase
      .from('repo_audits')
      .select('*, \'github\' as type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const all = [
      ...((webAudits as any[]) || []).map((a) => ({ ...a, type: 'web' })),
      ...((repoAudits as any[]) || []).map((a) => ({ ...a, type: 'github' })),
    ];

    return all.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit);
  },
};
