import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is used ONLY for authentication + the `profiles` table
 * (user identity & role). Songs, banners, covers and lyrics keep using the
 * existing ytmusic-api routes — nothing about the music source changed.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // OAuth callback (PKCE) is handled manually in app/auth/callback to
        // support both the web build and the Capacitor/Android deep link.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}

/** Lazily created proxy-ish helper so importing this file never throws at build time. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getSupabase() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
