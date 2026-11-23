'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import {
  AuthShell,
  ErrorBanner,
  Field,
  SubmitButton,
  SuccessBanner,
  inputClass,
  validateEmail,
} from '@/components/auth/AuthUI';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;

    setLoading(true);
    const result = await sendPasswordReset(email);
    setLoading(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      title="Lupa password"
      subtitle="Masukkan email akun kamu, kami kirim link buat bikin password baru."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 w-full text-[12.5px] font-semibold text-[var(--m3-primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke login
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <SuccessBanner message="Link reset password sudah dikirim. Cek inbox (dan folder spam) email kamu ya." />
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--m3-primary-soft)] p-4">
            <MailCheck className="w-5 h-5 text-[var(--m3-primary)] shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
              Link reset berlaku terbatas. Kalau tidak menerima email dalam beberapa menit,
              coba kirim ulang atau periksa alamat emailnya.
            </p>
          </div>
          <SubmitButton type="button" variant="ghost" onClick={() => setSent(false)}>
            Kirim ulang email
          </SubmitButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={formError} />
          <Field id="email" label="Email" error={error}>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <SubmitButton loading={loading}>
            {loading ? 'Mengirim…' : 'Kirim link reset'}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
