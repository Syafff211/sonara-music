import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile, UserRole } from './types';

/** Fetch the profile row (role included) for a given auth user id. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, avatar_url, role, is_banned, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // Profiles row may not exist yet (e.g. older Google accounts) — don't throw.
    console.warn('fetchProfile failed:', error.message);
    return null;
  }
  return (data as Profile | null) ?? null;
}

/** Where should this role land after login? */
export function homeForRole(role: UserRole | null | undefined): string {
  return role === 'admin' ? '/admin/dashboard' : '/';
}

/**
 * Resolve the post-login destination from the profiles table.
 * Returns '/login' if there is no session.
 */
export async function resolveDestinationAfterLogin(): Promise<string> {
  if (!isSupabaseConfigured) return '/';
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return '/login';
  const profile = await fetchProfile(user.id);
  return homeForRole(profile?.role ?? 'user');
}

/** Ensure a profiles row exists for the current auth user (idempotent). */
export async function ensureProfile(params?: {
  name?: string;
  avatarUrl?: string | null;
}): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const existing = await fetchProfile(user.id);
  if (existing) {
    const patch: Partial<Profile> = {};
    if (!existing.name && params?.name) patch.name = params.name;
    if (!existing.avatar_url && params?.avatarUrl) patch.avatar_url = params.avatarUrl;
    if (Object.keys(patch).length > 0) {
      const { data: updated } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .select('id, email, name, avatar_url, role, is_banned, created_at')
        .maybeSingle();
      return (updated as Profile | null) ?? existing;
    }
    return existing;
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaName =
    typeof metadata.name === 'string'
      ? metadata.name
      : typeof metadata.full_name === 'string'
        ? metadata.full_name
        : null;
  const metaAvatar =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : null;

  const insertPayload = {
    id: user.id,
    email: user.email ?? null,
    name: params?.name ?? metaName ?? (user.email ? user.email.split('@')[0] : null),
    avatar_url: params?.avatarUrl ?? metaAvatar,
    role: 'user' as const,
  };

  const { data: inserted, error } = await supabase
    .from('profiles')
    .insert(insertPayload)
    .select('id, email, name, avatar_url, role, is_banned, created_at')
    .maybeSingle();

  if (error) {
    console.warn('ensureProfile insert failed:', error.message);
    return fetchProfile(user.id);
  }
  return (inserted as Profile | null) ?? null;
}
