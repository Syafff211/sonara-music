'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import {
  AuthShell,
  ErrorBanner,
  Field,
  SubmitButton,
  inputClass,
  validateEmail,
} from '@/components/auth/AuthUI';
import { useAuth } from '@/components/auth/AuthProvider';
import { adminExists, claimAdminIfNone } from '@/lib/admin/users';

/**
 * Admin bootstrap.
 *
 * Creates the first administrator account. The Supabase function
 * `claim_admin_if_none()` only grants the role while no admin exists yet, so
 * this page becomes a dead end (and links out) as soon as one admin is around.
 */
export default function AdminRegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, isAuthenticated, isAdmin, ready, refreshProfile } = useAuth();

  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void adminExists().then((exists) => {
      if (!cancelled) {
        setBlocked(exists);
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready && isAuthenticated && isAdmin) router.replace('/admin/dashboard');
  }, [ready, isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Nama wajib diisi.';
    next.email = validateEmail(email);
    if (!password) next.password = 'Password wajib diisi.';
    else if (password.length < 8) next.password = 'Password minimal 8 karakter.';
    if (!confirm) next.confirm = 'Konfirmasi password wajib diisi.';
    else if (confirm !== password) next.confirm = 'Konfirmasi password tidak sama.';
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);

    // Already signed in (e.g. opened this page as a normal user)? Just claim.
    if (isAuthenticated) {
      const claim = await claimAdminIfNone();
      if (claim.claimed) {
        await refreshProfile();
        setLoading(false);
        router.replace('/admin/dashboard');
        return;
      }
      setLoading(false);
      setFormError(
        claim.error ?? 'Sudah ada admin. Minta admin yang ada untuk menaikkan role akunmu.'
      );
      return;
    }

    const result = await signUpWithEmail({ name: name.trim(), email, password });
    if (result.error) {
      setLoading(false);
      setFormError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setLoading(false);
      setFormError(
        'Akun dibuat, tapi butuh konfirmasi email. Konfirmasi dulu, lalu buka halaman ini lagi untuk mengaktifkan role admin.'
      );
      return;
    }

    const claim = await claimAdminIfNone();
    setLoading(false);
    if (!claim.claimed) {
      setFormError(
        claim.error ?? 'Akun dibuat tapi role admin gagal diaktifkan. Coba login lewat /admin/login.'
      );
      return;
    }
    await refreshProfile();
    router.replace('/admin/dashboard');
  };

  return (
    <AuthShell
      badge="Setup admin pertama"
      title="Buat akun admin"
      subtitle="Hanya bisa dipakai sekali, selama belum ada admin di Easvarafy."
      footer={
        <div className="space-y-2">
          <p className="text-center text-[12.5px] text-slate-500 dark:text-slate-400">
            Sudah punya akun admin?{' '}
            <Link href="/admin/login" className="font-semibold text-[var(--m3-primary)]">
              Login admin
            </Link>
          </p>
          <Link
            href="/register"
            className="block text-center text-[11.5px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Mau daftar sebagai user biasa?
          </Link>
        </div>
      }
    >
      {checking ? (
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 py-6 text-center">
          Memeriksa status admin…
        </p>
      ) : blocked ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <TriangleAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
              Sudah ada admin di Easvarafy, jadi halaman ini tidak bisa dipakai lagi. Minta admin
              yang ada menaikkan role akunmu lewat <strong>Admin → Users</strong>.
            </p>
          </div>
          <Link href="/admin/login" className="block">
            <SubmitButton type="button">Ke login admin</SubmitButton>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={formError} />

          <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--m3-primary-soft)] px-3.5 py-3">
            <ShieldCheck className="w-4 h-4 text-[var(--m3-primary)] shrink-0 mt-0.5" />
            <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
              Akun ini akan langsung mendapat role <strong>admin</strong>.
            </p>
          </div>

          <Field id="admin-name" label="Nama" error={errors.name}>
            <input
              id="admin-name"
              type="text"
              autoComplete="name"
              placeholder="Nama admin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="admin-email" label="Email" error={errors.email}>
            <input
              id="admin-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="admin@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="admin-password" label="Password" error={errors.password}>
            <input
              id="admin-password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="admin-confirm" label="Konfirmasi password" error={errors.confirm}>
            <input
              id="admin-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </Field>

          <SubmitButton loading={loading}>
            {loading ? 'Menyiapkan admin…' : 'Buat admin & masuk'}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
