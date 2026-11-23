'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import {
  AuthShell,
  ErrorBanner,
  Field,
  SubmitButton,
  inputClass,
  validateEmail,
} from '@/components/auth/AuthUI';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Admin login: email + password ONLY (no Google button).
 * Non-admin accounts are signed out again and told to use the user login.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const { signInWithEmail, isAuthenticated, isAdmin, ready, signOut, configured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated && isAdmin) router.replace('/admin/dashboard');
  }, [ready, isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next: { email?: string; password?: string } = { email: validateEmail(email) };
    if (!password) next.password = 'Password wajib diisi.';
    setErrors(next);
    if (next.email || next.password) return;

    setLoading(true);
    const result = await signInWithEmail(email, password);
    if (result.error) {
      setLoading(false);
      setFormError(result.error);
      return;
    }

    // Verify the role *after* signing in: only admins may pass.
    const { fetchProfile } = await import('@/lib/auth/profile');
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.auth.getUser();
    const profile = data.user ? await fetchProfile(data.user.id) : null;
    setLoading(false);

    if (profile?.role !== 'admin') {
      setFormError('Akun ini bukan admin. Gunakan halaman login user.');
      await signOut();
      return;
    }

    router.replace('/admin/dashboard');
  };

  return (
    <AuthShell
      badge="Admin Panel"
      title="Login Admin"
      subtitle="Khusus pengelola Easvarafy. Kelola user, role, dan statistik."
      footer={
        <div className="space-y-2">
          <p className="text-center text-[12.5px] text-slate-500 dark:text-slate-400">
            Bukan admin?{' '}
            <Link href="/login" className="font-semibold text-[var(--m3-primary)]">
              Login user
            </Link>
          </p>
          <Link
            href="/"
            className="block text-center text-[11.5px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Balik ke player
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!configured && <ErrorBanner message="Supabase belum dikonfigurasi." />}
        <ErrorBanner message={formError} />

        <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--m3-primary-soft)] px-3.5 py-3">
          <ShieldCheck className="w-4 h-4 text-[var(--m3-primary)] shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            Halaman ini tidak punya login Google dan tidak bisa dipakai akun user biasa.
          </p>
        </div>

        <Field id="admin-email" label="Email admin" error={errors.email}>
          <input
            id="admin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="admin@easvarafy.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field id="admin-password" label="Password" error={errors.password}>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <SubmitButton loading={loading}>
          {loading ? 'Memverifikasi…' : 'Masuk sebagai admin'}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
