'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ensureProfile, fetchProfile, homeForRole } from '@/lib/auth/profile';
import { AuthShell, ErrorBanner, SubmitButton } from '@/components/auth/AuthUI';

/**
 * Client-side completion of the Supabase auth redirect (PKCE code exchange).
 * Reachable as /auth/complete directly, or via /auth/callback (route handler).
 * Also used as the landing spot after tapping a confirm / recovery email link.
 */
function CompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working');
  const [message, setMessage] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const run = async () => {
      const errorParam = params.get('error');
      if (errorParam) {
        setStatus('error');
        setMessage(
          errorParam === 'access_denied'
            ? 'Login dibatalkan. Coba lagi ya.'
            : 'Link tidak valid atau sudah kedaluwarsa.'
        );
        return;
      }

      if (!isSupabaseConfigured) {
        setStatus('error');
        setMessage('Supabase belum dikonfigurasi. Isi .env.local dulu ya.');
        return;
      }

      const next = params.get('next');
      try {
        // Hash-based sessions (implicit flow / recovery links).
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        const code = params.get('code');
        const tokenHash = params.get('token_hash');
        const type = params.get('type');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'recovery' | 'email' | 'email_change' | 'invite' | 'magiclink',
          });
          if (error) throw error;
        }

        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          setStatus('error');
          setMessage('Sesi tidak ditemukan. Silakan login ulang.');
          return;
        }

        const profile = (await fetchProfile(data.user.id)) ?? (await ensureProfile());

        if (next) {
          setStatus('done');
          router.replace(next);
          return;
        }

        setStatus('done');
        router.replace(homeForRole(profile?.role ?? 'user'));
      } catch (err) {
        const error = err as { message?: string };
        setStatus('error');
        setMessage(error?.message || 'Gagal menyelesaikan login. Coba lagi.');
      }
    };

    void run();
  }, [params, router]);

  return (
    <AuthShell
      title={status === 'error' ? 'Login gagal' : 'Menyelesaikan login…'}
      subtitle={
        status === 'error'
          ? 'Ada masalah saat memproses link login kamu.'
          : 'Sebentar ya, kami sedang menyiapkan akun Easvarafy kamu.'
      }
      footer={
        status === 'error' ? (
          <div className="space-y-2">
            <Link href="/login" className="block">
              <SubmitButton type="button">Kembali ke login</SubmitButton>
            </Link>
            <Link
              href="/"
              className="block text-center text-[12px] font-medium text-slate-500 dark:text-slate-400"
            >
              Lanjut dengerin musik sebagai guest
            </Link>
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorBanner message={message} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-7 h-7 animate-spin text-[var(--m3-primary)]" />
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
            {message ?? 'Memverifikasi akun…'}
          </p>
        </div>
      )}
    </AuthShell>
  );
}

export default function AuthCompletePage() {
  return (
    <React.Suspense fallback={null}>
      <CompleteInner />
    </React.Suspense>
  );
}
