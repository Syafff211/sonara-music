'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AuthShell,
  ErrorBanner,
  Field,
  SubmitButton,
  SuccessBanner,
  inputClass,
} from '@/components/auth/AuthUI';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

/**
 * Landing page for the Supabase password-recovery link.
 * Supabase puts the recovery tokens in the URL hash; the SDK picks them up and
 * emits a PASSWORD_RECOVERY event, after which updateUser({ password }) works.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    };
    void init();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next: { password?: string; confirm?: string } = {};
    if (!password) next.password = 'Password baru wajib diisi.';
    else if (password.length < 8) next.password = 'Password minimal 8 karakter.';
    if (!confirm) next.confirm = 'Konfirmasi password wajib diisi.';
    else if (confirm !== password) next.confirm = 'Konfirmasi password tidak sama.';
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSuccess('Password berhasil diperbarui. Kamu akan diarahkan ke halaman login.');
    setTimeout(() => router.replace('/login'), 1800);
  };

  return (
    <AuthShell
      title="Buat password baru"
      subtitle="Masukkan password baru untuk akun Easvarafy kamu."
      footer={
        <Link
          href="/login"
          className="block text-center text-[12.5px] font-semibold text-[var(--m3-primary)]"
        >
          Kembali ke login
        </Link>
      }
    >
      {ready && !hasSession ? (
        <ErrorBanner message="Link reset tidak valid atau sudah kedaluwarsa. Minta link baru dari halaman Lupa Password." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={formError} />
          <SuccessBanner message={success} />
          <Field id="password" label="Password baru" error={errors.password}>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id="confirm" label="Konfirmasi password baru" error={errors.confirm}>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi password baru"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </Field>
          <SubmitButton loading={loading}>
            {loading ? 'Menyimpan…' : 'Simpan password baru'}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
