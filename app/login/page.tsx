'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import {
  AuthShell,
  ErrorBanner,
  Field,
  GoogleLogo,
  SubmitButton,
  inputClass,
  validateEmail,
} from '@/components/auth/AuthUI';
import { useAuth } from '@/components/auth/AuthProvider';
import { isSupabaseConfigured } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const { signInWithEmail, signInWithGoogle, isAuthenticated, ready, isAdmin, configured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Already signed in? Go straight to the right landing page.
  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    router.replace(redirectTo || (isAdmin ? '/admin/dashboard' : '/'));
  }, [ready, isAuthenticated, isAdmin, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const nextErrors: { email?: string; password?: string } = {
      email: validateEmail(email),
    };
    if (!password) nextErrors.password = 'Password wajib diisi.';
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }
    router.replace(redirectTo || result.destination || '/');
  };

  const handleGoogle = async () => {
    setFormError(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setGoogleLoading(false);
      setFormError(result.error);
    }
  };

  return (
    <AuthShell
      title="Masuk ke Easvarafy"
      subtitle="Dengerin musik tanpa batas — playlist, like, dan history kamu tersimpan aman."
      footer={
        <div className="space-y-3">
          <p className="text-center text-[12.5px] text-slate-500 dark:text-slate-400">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-[var(--m3-primary)]">
              Daftar gratis
            </Link>
          </p>
          <div className="h-px bg-[var(--m3-border)]" />
          <Link
            href="/admin/login"
            className="flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Login sebagai admin
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!configured && (
          <ErrorBanner message="Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local." />
        )}
        <ErrorBanner message={formError} />

        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            className={inputClass}
          />
        </Field>

        <Field id="password" label="Password" error={errors.password}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-[12px] font-medium text-[var(--m3-primary)] hover:underline"
          >
            Lupa password?
          </Link>
        </div>

        <SubmitButton loading={loading}>
          {loading ? 'Memproses…' : 'Masuk'}
        </SubmitButton>
      </form>

      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-[var(--m3-border)]" />
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">atau</span>
        <span className="h-px flex-1 bg-[var(--m3-border)]" />
      </div>

      <SubmitButton
        type="button"
        variant="secondary"
        loading={googleLoading}
        onClick={handleGoogle}
        disabled={!isSupabaseConfigured}
        className="text-[14px] font-semibold shadow-sm"
      >
        {!googleLoading && <GoogleLogo className="w-[18px] h-[18px]" />}
        Lanjutkan dengan Google
      </SubmitButton>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}
