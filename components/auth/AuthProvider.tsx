'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ensureProfile, fetchProfile, homeForRole } from '@/lib/auth/profile';
import {
  closeAuthBrowser,
  isNativeApp,
  oauthRedirectUrl,
  onNativeAuthCallback,
  passwordResetRedirectUrl,
} from '@/lib/auth/native';
import type { Profile, UserRole } from '@/lib/auth/types';
import { LoginPromptDialog } from './LoginPromptDialog';

interface AuthResult {
  error?: string;
  needsEmailConfirmation?: boolean;
  destination?: string;
}

interface AuthContextValue {
  ready: boolean;
  configured: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isBanned: boolean;
  /** True when a signed-in session exists (guest playback stays allowed without it). */
  isAuthenticated: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (params: {
    name: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  /** Returns true when authenticated; otherwise opens the "Login dulu yuk" popup. */
  requireAuth: (message?: string) => boolean;
  openLoginPrompt: (message?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email atau password salah.',
  email_not_confirmed: 'Email belum dikonfirmasi. Cek inbox email kamu dulu ya.',
  user_not_found: 'Akun dengan email ini tidak ditemukan.',
  email_exists: 'Email ini sudah terdaftar. Coba login ya.',
  user_already_exists: 'Email ini sudah terdaftar. Coba login ya.',
  weak_password: 'Password terlalu lemah. Gunakan minimal 8 karakter.',
  same_password: 'Password baru tidak boleh sama dengan password lama.',
  over_email_send_rate_limit: 'Terlalu banyak permintaan email. Coba lagi beberapa menit.',
  over_request_rate_limit: 'Terlalu banyak percobaan. Coba lagi sebentar.',
  provider_disabled: 'Login Google belum diaktifkan di project Supabase.',
};

function translateAuthError(message?: string | null, code?: string | null): string {
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  const raw = (message || '').trim();
  if (!raw) return 'Terjadi kesalahan. Coba lagi.';
  const lower = raw.toLowerCase();
  if (lower.includes('invalid login credentials')) return AUTH_ERROR_MESSAGES.invalid_credentials;
  if (lower.includes('email not confirmed')) return AUTH_ERROR_MESSAGES.email_not_confirmed;
  if (lower.includes('already registered') || lower.includes('already exists'))
    return AUTH_ERROR_MESSAGES.email_exists;
  if (lower.includes('password should be at least')) return AUTH_ERROR_MESSAGES.weak_password;
  if (lower.includes('rate limit')) return AUTH_ERROR_MESSAGES.over_request_rate_limit;
  if (lower.includes('provider is not enabled')) return AUTH_ERROR_MESSAGES.provider_disabled;
  return raw;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptMessage, setPromptMessage] = useState<string | undefined>(undefined);
  const handledCallbackRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (uid: string | null) => {
    if (!uid || !isSupabaseConfigured) {
      setProfile(null);
      return null;
    }
    const next = (await fetchProfile(uid)) ?? (await ensureProfile());
    setProfile(next);
    return next;
  }, []);

  const applySessionUser = useCallback(
    async (session: { user: { id: string; email?: string | null } } | null) => {
      if (!session?.user) {
        setUserId(null);
        setEmail(null);
        setProfile(null);
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      const nextProfile = await loadProfile(session.user.id);
      if (nextProfile?.is_banned) {
        setPromptMessage('Akun kamu sedang diblokir. Hubungi admin Easvarafy ya.');
        setPromptOpen(true);
        await supabase.auth.signOut();
      }
    },
    [loadProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const next = await loadProfile(userId);
    return next;
  }, [loadProfile, userId]);

  // Bootstrap session + subscribe to auth changes.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        await applySessionUser(data.session);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySessionUser(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [applySessionUser]);

  /** Exchange a PKCE `code` coming from Supabase (web callback or APK deep link). */
  const exchangeCode = useCallback(
    async (code: string) => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return { error: translateAuthError(error.message, error.code) } as AuthResult;
      const nextProfile =
        (await loadProfile(data.user?.id ?? null)) ?? (await ensureProfile());
      const target = homeForRole(nextProfile?.role ?? 'user');
      return { destination: target } as AuthResult;
    },
    [loadProfile]
  );

  // APK deep link: com.easvarafy.app://auth/callback?code=...
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const handle = async (url: string) => {
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        const errorDescription =
          parsed.searchParams.get('error_description') || parsed.searchParams.get('error');
        if (errorDescription) return;
        if (!code || handledCallbackRef.current === code) return;
        handledCallbackRef.current = code;
        const result = await exchangeCode(code);
        await closeAuthBrowser();
        router.replace(result.destination || '/');
      } catch {
        /* ignore malformed deep links */
      }
    };

    const cleanup = onNativeAuthCallback(handle);

    // Cold start from a deep link (app was closed).
    if (isNativeApp()) {
      void (async () => {
        try {
          const { App } = await import('@capacitor/app');
          const launch = await App.getLaunchUrl();
          if (launch?.url) await handle(launch.url);
        } catch {
          /* no launch url */
        }
      })();
    }

    return cleanup;
  }, [exchangeCode, router]);

  const signInWithEmail = useCallback(async (emailInput: string, password: string) => {
    if (!isSupabaseConfigured)
      return { error: 'Supabase belum dikonfigurasi. Isi .env.local dulu ya.' } as AuthResult;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim().toLowerCase(),
      password,
    });
    if (error) return { error: translateAuthError(error.message, error.code) } as AuthResult;

    const nextProfile =
      (await loadProfile(data.user?.id ?? null)) ?? (await ensureProfile());
    if (nextProfile?.is_banned)
      return { error: 'Akun kamu sedang diblokir. Hubungi admin Easvarafy ya.' } as AuthResult;

    return { destination: homeForRole(nextProfile?.role ?? 'user') } as AuthResult;
  }, [loadProfile]);

  const signUpWithEmail = useCallback(
    async ({ name, email: emailInput, password }: { name: string; email: string; password: string }) => {
      if (!isSupabaseConfigured)
        return { error: 'Supabase belum dikonfigurasi. Isi .env.local dulu ya.' } as AuthResult;

      const normalizedEmail = emailInput.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name: name.trim(), full_name: name.trim() },
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      if (error) return { error: translateAuthError(error.message, error.code) } as AuthResult;

      // With email confirmation enabled there is no session yet — the profile row
      // is created right here (RLS allows insert for own id) and confirmed later.
      if (data.session?.user) {
        await ensureProfile({ name: name.trim() });
        return { destination: '/', needsEmailConfirmation: false } as AuthResult;
      }

      // Try to pre-create the profile row so the admin panel sees the account.
      if (data.user?.id) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: normalizedEmail,
          name: name.trim(),
          role: 'user',
        });
      }
      return { needsEmailConfirmation: true, destination: '/login' } as AuthResult;
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured)
      return { error: 'Supabase belum dikonfigurasi. Isi .env.local dulu ya.' } as AuthResult;

    const redirectTo = oauthRedirectUrl('/auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) return { error: translateAuthError(error.message, error.code) } as AuthResult;
    if (!data?.url) return { error: 'Tidak bisa memulai login Google.' } as AuthResult;

    if (isNativeApp()) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, presentationStyle: 'popover' });
      return {} as AuthResult;
    }

    window.location.href = data.url;
    return {} as AuthResult;
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setProfile(null);
    setUserId(null);
    setEmail(null);
    router.replace('/');
  }, [router]);

  const sendPasswordReset = useCallback(async (emailInput: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase belum dikonfigurasi.' } as AuthResult;
    const { error } = await supabase.auth.resetPasswordForEmail(
      emailInput.trim().toLowerCase(),
      { redirectTo: passwordResetRedirectUrl() }
    );
    if (error) return { error: translateAuthError(error.message, error.code) } as AuthResult;
    return {} as AuthResult;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase belum dikonfigurasi.' } as AuthResult;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: translateAuthError(error.message, error.code) } as AuthResult;
    return {} as AuthResult;
  }, []);

  const openLoginPrompt = useCallback((message?: string) => {
    setPromptMessage(message);
    setPromptOpen(true);
  }, []);

  const isAuthenticated = Boolean(userId);
  const requireAuth = useCallback(
    (message?: string) => {
      if (isAuthenticated) return true;
      setPromptMessage(message);
      setPromptOpen(true);
      return false;
    },
    [isAuthenticated]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured: isSupabaseConfigured,
      userId,
      email,
      profile,
      role: profile?.role ?? (isAuthenticated ? 'user' : null),
      isAdmin: profile?.role === 'admin',
      isBanned: Boolean(profile?.is_banned),
      isAuthenticated,
      refreshProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      sendPasswordReset,
      updatePassword,
      requireAuth,
      openLoginPrompt,
    }),
    [
      ready,
      userId,
      email,
      profile,
      isAuthenticated,
      refreshProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      sendPasswordReset,
      updatePassword,
      requireAuth,
      openLoginPrompt,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginPromptDialog
        open={promptOpen}
        message={promptMessage}
        onClose={() => setPromptOpen(false)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
