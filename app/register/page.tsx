'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import {
  AuthShell,
  ErrorBanner,
  Field,
  GoogleLogo,
  SuccessBanner,
  SubmitButton,
  inputClass,
  validateEmail,
} from '@/components/auth/AuthUI';
import { useAuth } from '@/components/auth/AuthProvider';
import { isSupabaseConfigured } from '@/lib/supabase';

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordChecks = [
    { label: 'Minimal 8 karakter', ok: password.length >= 8 },
    { label: 'Mengandung huruf', ok: /[a-zA-Z]/.test(password) },
    { label: 'Mengandung angka', ok: /\d/.test(password) },
  ];

  const validate = (): RegisterErrors => {
    const next: RegisterErrors = {};
    if (!name.trim()) next.name = 'Nama wajib diisi.';
    else if (name.trim().length < 2) next.name = 'Nama minimal 2 karakter.';
    next.email = validateEmail(email);
    if (!password) next.password = 'Password wajib diisi.';
    else if (password.length < 8) next.password = 'Password minimal 8 karakter.';
    if (!confirm) next.confirm = 'Konfirmasi password wajib diisi.';
    else if (confirm !== password) next.confirm = 'Konfirmasi password tidak sama.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    const result = await signUpWithEmail({ name: name.trim(), email, password });
    setLoading(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccess(
        'Akun berhasil dibuat! Cek inbox email kamu untuk konfirmasi, lalu login.'
      );
      return;
    }

    router.replace(result.destination || '/');
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
      title="Buat akun Easvarafy"
      subtitle="Gratis selamanya. Simpan playlist, like lagu, dan lihat recap musik kamu."
      footer={
        <p className="text-center text-[12.5px] text-slate-500 dark:text-slate-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-[var(--m3-primary)]">
            Masuk di sini
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!isSupabaseConfigured && (
          <ErrorBanner message="Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local." />
        )}
        <ErrorBanner message={formError} />
        <SuccessBanner message={success} />

        <Field id="name" label="Nama" error={errors.name}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Nama kamu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
          />
        </Field>

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
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
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

        {password.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 -mt-1">
            {passwordChecks.map((check) => (
              <li
                key={check.label}
                className={`inline-flex items-center gap-1 text-[11px] ${
                  check.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {check.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {check.label}
              </li>
            ))}
          </ul>
        )}

        <Field id="confirm" label="Konfirmasi Password" error={errors.confirm}>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Ulangi password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={Boolean(errors.confirm)}
            className={inputClass}
          />
        </Field>

        <SubmitButton loading={loading}>
          {loading ? 'Membuat akun…' : 'Daftar sekarang'}
        </SubmitButton>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          Dengan mendaftar kamu setuju dengan ketentuan penggunaan Easvarafy.
        </p>
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
        className="shadow-sm"
      >
        {!googleLoading && <GoogleLogo className="w-[18px] h-[18px]" />}
        Lanjutkan dengan Google
      </SubmitButton>
    </AuthShell>
  );
}
