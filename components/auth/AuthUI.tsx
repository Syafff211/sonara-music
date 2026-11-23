'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  badge,
  mobile = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: string;
  mobile?: boolean;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--m3-bg)] text-[#1A1C20] dark:text-[#E6E8EE]">
      <header className="px-5 pt-6 pb-2 flex items-center justify-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C5CFF] via-[#5B8CFF] to-[#22D3C5] flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg viewBox="0 0 64 64" className="w-5 h-5" aria-hidden="true">
              <g fill="#fff">
                <rect x="16" y="27" width="4" height="10" rx="2" />
                <rect x="24" y="20" width="4" height="24" rx="2" />
                <rect x="32" y="14" width="4" height="36" rx="2" />
                <rect x="40" y="22" width="4" height="20" rx="2" />
                <rect x="48" y="28" width="4" height="8" rx="2" />
              </g>
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-bold tracking-tight">Easvarafy</span>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
              Dengerin Musik Tanpa Batas
            </span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:py-10">
        <div
          className={cn(
            'w-full liquid-glass rounded-3xl p-6 sm:p-8',
            mobile ? 'max-w-md' : 'max-w-[420px]'
          )}
        >
          {badge && (
            <span className="inline-flex items-center rounded-full bg-[var(--m3-primary-soft)] text-[var(--m3-primary)] text-[11px] font-semibold px-2.5 py-1 mb-3">
              {badge}
            </span>
          )}
          <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-5">{children}</div>

          {footer && <div className="mt-5">{footer}</div>}
        </div>
      </main>

      <footer className="px-5 pb-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Easvarafy · Dengerin Musik Tanpa Batas
      </footer>
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[12.5px] font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[11.5px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11.5px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  'w-full min-h-[48px] rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-transparent focus:border-[var(--m3-primary)] focus:bg-transparent focus:outline-none focus:ring-4 focus:ring-[var(--m3-ring)] px-4 text-[14px] transition-colors placeholder:text-slate-400';

export function SubmitButton({
  loading,
  children,
  variant = 'primary',
  type = 'submit',
  onClick,
  className,
  disabled,
}: {
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'submit' | 'button';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full min-h-[50px] rounded-full font-semibold text-[14px] inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] hover:opacity-90 active:scale-[0.99]',
        variant === 'secondary' &&
          'bg-white text-[#1F2937] border border-black/10 hover:bg-slate-50 dark:bg-white dark:text-[#1F2937]',
        variant === 'ghost' &&
          'border border-[var(--m3-border)] hover:bg-black/5 dark:hover:bg-white/10',
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-3 text-[12.5px] leading-relaxed"
    >
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-3 text-[12.5px] leading-relaxed"
    >
      {message}
    </div>
  );
}

export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className ?? 'w-[18px] h-[18px]'} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email wajib diisi.';
  if (!emailPattern.test(value.trim())) return 'Format email tidak valid.';
  return undefined;
}
