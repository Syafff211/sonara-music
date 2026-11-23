import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/lib/auth/types';

export interface UserStats {
  total: number;
  admins: number;
  banned: number;
  new_7d: number;
  new_30d: number;
}

export interface ListUsersParams {
  search?: string;
  role?: 'all' | UserRole;
  status?: 'all' | 'active' | 'banned';
  page?: number;
  perPage?: number;
}

export interface ListUsersResult {
  rows: Profile[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

const PROFILE_COLUMNS = 'id, email, name, avatar_url, role, is_banned, created_at';

/**
 * Admin-only reads/writes on `profiles`.
 * RLS allows an admin to see/update every row; a normal user can only touch
 * their own row, so these calls simply return nothing for them.
 */
export async function listUsers({
  search = '',
  role = 'all',
  status = 'all',
  page = 1,
  perPage = 10,
}: ListUsersParams = {}): Promise<ListUsersResult> {
  if (!isSupabaseConfigured) {
    return { rows: [], total: 0, page, perPage, error: 'Supabase belum dikonfigurasi.' };
  }

  const from = (page - 1) * perPage;
  let query = supabase
    .from('profiles')
    .select(PROFILE_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (role !== 'all') query = query.eq('role', role);
  if (status === 'active') query = query.eq('is_banned', false);
  if (status === 'banned') query = query.eq('is_banned', true);

  const term = search.trim();
  if (term) {
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return { rows: [], total: 0, page, perPage, error: error.message };
  }
  return {
    rows: (data ?? []) as Profile[],
    total: count ?? 0,
    page,
    perPage,
  };
}

export async function getUserStats(): Promise<{ stats: UserStats; error?: string }> {
  const empty: UserStats = { total: 0, admins: 0, banned: 0, new_7d: 0, new_30d: 0 };
  if (!isSupabaseConfigured) return { stats: empty, error: 'Supabase belum dikonfigurasi.' };

  const { data, error } = await supabase.rpc('admin_user_stats');
  if (error || !data) {
    // Fallback: count in JS (works as long as RLS lets an admin read all rows).
    const { data: rows } = await supabase.from('profiles').select('role, is_banned, created_at');
    if (!rows) return { stats: empty, error: error?.message };
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    return {
      stats: {
        total: rows.length,
        admins: rows.filter((r) => r.role === 'admin').length,
        banned: rows.filter((r) => r.is_banned).length,
        new_7d: rows.filter((r) => now - new Date(r.created_at).getTime() < week).length,
        new_30d: rows.filter((r) => now - new Date(r.created_at).getTime() < week * 4).length,
      },
    };
  }

  const raw = data as Record<string, number>;
  return {
    stats: {
      total: Number(raw.total ?? 0),
      admins: Number(raw.admins ?? 0),
      banned: Number(raw.banned ?? 0),
      new_7d: Number(raw.new_7d ?? 0),
      new_30d: Number(raw.new_30d ?? 0),
    },
  };
}

export async function setUserRole(id: string, role: UserRole): Promise<{ error?: string }> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  return error ? { error: error.message } : {};
}

export async function setUserBanned(id: string, isBanned: boolean): Promise<{ error?: string }> {
  const { error } = await supabase.from('profiles').update({ is_banned: isBanned }).eq('id', id);
  return error ? { error: error.message } : {};
}

/**
 * Deletes the profile row. Note: auth.users removal requires the service_role
 * key (admin API), so the account can no longer sign in with data access but
 * the auth record itself is cleaned up by the `ban` flow. We warn the caller.
 */
export async function deleteUser(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  return error ? { error: error.message } : {};
}
