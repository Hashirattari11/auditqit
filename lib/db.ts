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
  overall_score: number;
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
  github_access_token: string | null;
  github_username: string | null;
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
      .select('id, url, status, current_step, results, ai_summary, user_id, is_public, score, overall_score, created_at, updated_at')
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

  async deleteAudit(id: string) {
    const { error } = await supabase.from('audits').delete().eq('id', id);
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
      .select('*');

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

  async deleteRepoAudit(id: string) {
    const { error } = await supabase.from('repo_audits').delete().eq('id', id);
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
      .select('*');

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

  async updateUser(id: string, updates: Partial<Pick<User, 'name' | 'plan' | 'stripe_customer_id' | 'stripe_subscription_id' | 'audits_this_month' | 'month_reset_date' | 'github_access_token' | 'github_username'>>) {
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

  // === API Keys ===
  async createApiKey(userId: string, name: string) {
    const key = 'aiq_live_' + Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, '0')).join('');
    const { data, error } = await supabase.from('api_keys').insert({ user_id: userId, name, key }).select('id, key, name').single();
    if (error) throw error;
    return data as { id: string; key: string; name: string };
  },

  async getApiKeys(userId: string) {
    const { data, error } = await supabase.from('api_keys').select('id, name, key, last_used, usage_count, is_active, created_at').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map((k: any) => ({ ...k, key: k.key.substring(0, 12) + '...' }));
  },

  async revokeApiKey(id: string, userId: string) {
    const { error } = await supabase.from('api_keys').update({ is_active: false }).eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },

  async validateApiKey(key: string) {
    const { data, error } = await supabase.from('api_keys').select('*').eq('key', key).eq('is_active', true).single();
    if (error || !data) return null;
    await supabase.from('api_keys').update({ last_used: new Date().toISOString(), usage_count: (data.usage_count || 0) + 1 }).eq('id', data.id);
    return data;
  },

  async logApiKeyUsage(apiKeyId: string, endpoint: string) {
    await supabase.from('api_usage').insert({ api_key_id: apiKeyId, endpoint });
  },

  async getApiKeyUsageCount(apiKeyId: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const { count } = await supabase.from('api_usage').select('id', { count: 'exact', head: true }).eq('api_key_id', apiKeyId).gte('created_at', since);
    return count || 0;
  },

  // === Monitors ===
  async createMonitor(userId: string, url: string, name: string, frequency = 'daily', alertOnDrop = 10) {
    const nextRun = new Date(Date.now() + (frequency === 'weekly' ? 7 : 1) * 86400000).toISOString();
    const { data, error } = await supabase.from('monitors').insert({ user_id: userId, url, name, frequency, alert_on_drop: alertOnDrop, next_run_at: nextRun }).select().single();
    if (error) throw error;
    return data;
  },

  async getMonitors(userId: string) {
    const { data, error } = await supabase.from('monitors').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async deleteMonitor(id: string, userId: string) {
    const { error } = await supabase.from('monitors').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },

  async getMonitorsDueForAudit() {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('monitors').select('*').eq('is_active', true).lte('next_run_at', now);
    if (error) return [];
    return data || [];
  },

  async updateMonitorScore(monitorId: string, score: number, auditId: string) {
    const monitor = await supabase.from('monitors').select('frequency').eq('id', monitorId).single();
    const freq = monitor.data?.frequency || 'daily';
    const nextRun = new Date(Date.now() + (freq === 'weekly' ? 7 : 1) * 86400000).toISOString();
    await supabase.from('monitors').update({ last_score: score, last_audit_id: auditId, next_run_at: nextRun }).eq('id', monitorId);
    await supabase.from('monitor_audits').insert({ monitor_id: monitorId, audit_id: auditId, score });
  },

  // === Teams ===
  async createTeam(name: string, ownerId: string) {
    const { data: team, error: teamErr } = await supabase.from('teams').insert({ name, owner_id: ownerId }).select().single();
    if (teamErr) throw teamErr;
    await supabase.from('team_members').insert({ team_id: team.id, user_id: ownerId, role: 'owner' });
    return team;
  },

  async getUserTeam(userId: string) {
    const { data: membership } = await supabase.from('team_members').select('team_id, role').eq('user_id', userId).single();
    if (!membership) return null;
    const { data: team } = await supabase.from('teams').select('*').eq('id', membership.team_id).single();
    if (!team) return null;
    const { data: members } = await supabase.from('team_members').select('*').eq('team_id', team.id);
    return { ...team, members: members || [], myRole: membership.role };
  },

  async inviteTeamMember(teamId: string, email: string) {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
    const expires = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data, error } = await supabase.from('team_invites').insert({ team_id: teamId, email, token, expires_at: expires }).select().single();
    if (error) throw error;
    return data;
  },

  async acceptTeamInvite(token: string, userId: string) {
    const { data: invite } = await supabase.from('team_invites').select('*').eq('token', token).eq('accepted', false).single();
    if (!invite) return null;
    if (new Date(invite.expires_at) < new Date()) return null;
    await supabase.from('team_invites').update({ accepted: true }).eq('id', invite.id);
    await supabase.from('team_members').insert({ team_id: invite.team_id, user_id: userId, role: 'member' });
    return invite;
  },

  // === Roasts ===
  async createRoast(data: { url: string; domain: string; roast_text: string; perf_score: number; seo_score: number; sec_score: number; bug_count: number; user_id?: string }) {
    const insertData: Record<string, unknown> = { ...data };
    if (!data.user_id) delete insertData.user_id;
    const { data: result, error } = await supabase.from('roasts').insert(insertData).select().single();
    if (error) throw error;
    return result;
  },

  async getRecentRoasts(limit = 5) {
    const { data, error } = await supabase.from('roasts').select('id, domain, roast_text, perf_score, seo_score, sec_score, bug_count, created_at').eq('is_public', true).order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  },

  async getRoast(id: string) {
    const { data, error } = await supabase.from('roasts').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  // === VS Battles ===
  async createVsBattle(data: { url1: string; url2: string; domain1: string; domain2: string; scores1: any; scores2: any; winner: string; commentary: string; user_id?: string }) {
    const insertData: Record<string, unknown> = { ...data };
    if (!data.user_id) delete insertData.user_id;
    const { data: result, error } = await supabase.from('vs_battles').insert(insertData).select().single();
    if (error) throw error;
    return result;
  },

  async getVsBattle(id: string) {
    const { data, error } = await supabase.from('vs_battles').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async getRecentBattles(limit = 5) {
    const { data, error } = await supabase.from('vs_battles').select('id, domain1, domain2, scores1, scores2, winner, commentary, created_at').eq('is_public', true).order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  },

  // === Agencies ===
  async createAgency(ownerId: string, name: string, logo?: string, primaryColor?: string) {
    const { data, error } = await supabase.from('agencies').insert({ owner_id: ownerId, name, logo: logo || null, primary_color: primaryColor || '#6366F1' }).select().single();
    if (error) throw error;
    return data;
  },

  async getAgency(ownerId: string) {
    const { data, error } = await supabase.from('agencies').select('*').eq('owner_id', ownerId).single();
    if (error) return null;
    return data;
  },

  async getAgencyById(id: string) {
    const { data, error } = await supabase.from('agencies').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async updateAgency(id: string, updates: { name?: string; logo?: string; primary_color?: string; custom_domain?: string }) {
    const { error } = await supabase.from('agencies').update(updates).eq('id', id);
    if (error) throw error;
  },

  async addAgencyClient(agencyId: string, data: { name: string; email: string; website_url: string; password_hash?: string; notes?: string }) {
    const { data: result, error } = await supabase.from('agency_clients').insert({ agency_id: agencyId, ...data }).select().single();
    if (error) throw error;
    return result;
  },

  async getAgencyClients(agencyId: string) {
    const { data, error } = await supabase.from('agency_clients').select('*').eq('agency_id', agencyId).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async getAgencyClient(clientId: string) {
    const { data, error } = await supabase.from('agency_clients').select('*').eq('id', clientId).single();
    if (error) return null;
    return data;
  },

  async updateAgencyClient(clientId: string, updates: { name?: string; email?: string; website_url?: string; notes?: string }) {
    const { error } = await supabase.from('agency_clients').update(updates).eq('id', clientId);
    if (error) throw error;
  },

  async deleteAgencyClient(clientId: string) {
    const { error } = await supabase.from('agency_clients').delete().eq('id', clientId);
    if (error) throw error;
  },

  async addClientAudit(clientId: string, auditId: string) {
    const { data, error } = await supabase.from('client_audits').insert({ client_id: clientId, audit_id: auditId }).select().single();
    if (error) throw error;
    return data;
  },

  async getClientAudits(clientId: string, limit = 20) {
    const { data, error } = await supabase.from('client_audits').select('*, audits(*)').eq('client_id', clientId).order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  },

  async getClientByPortal(agencyId: string, email: string) {
    const { data, error } = await supabase.from('agency_clients').select('*').eq('agency_id', agencyId).eq('email', email).single();
    if (error) return null;
    return data;
  },
};
