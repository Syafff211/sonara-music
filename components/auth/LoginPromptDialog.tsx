'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn, UserPlus, X } from 'lucide-react';

interface Props {
  open: boolean;
  message?: string;
  onClose: () => void;
}

/**
 * Soft gate popup shown when a guest tries to create a playlist, like a track
 * or save an item. Playback itself stays open to guests.
 */
export function LoginPromptDialog({ open, message, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3 sm:p-6"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-sm rounded-3xl bg-[var(--m3-surface)] text-[var(--m3-on-surface,#0F172A)] dark:text-white border border-[var(--m3-border)] shadow-2xl p-6 pb-7 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup popup"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C5CFF] via-[#5B8CFF] to-[#22D3C5] flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
          <svg viewBox="0 0 64 64" className="w-6 h-6" aria-hidden="true">
            <g fill="#fff">
              <rect x="16" y="27" width="4" height="10" rx="2" />
              <rect x="24" y="20" width="4" height="24" rx="2" />
              <rect x="32" y="14" width="4" height="36" rx="2" />
              <rect x="40" y="22" width="4" height="20" rx="2" />
              <rect x="48" y="28" width="4" height="8" rx="2" />
            </g>
          </svg>
        </div>

        <h2 id="login-prompt-title" className="text-lg font-bold tracking-tight">
          Login dulu yuk
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
          {message ??
            'Buat login dulu untuk bikin playlist, like lagu, dan simpan koleksi kamu. Dengerin musik tetap gratis kok.'}
        </p>

        <div className="flex flex-col gap-2 mt-5">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full min-h-[46px] rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)] font-semibold flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4" />
            Masuk
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="w-full min-h-[46px] rounded-full border border-[var(--m3-border)] font-semibold flex items-center justify-center gap-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Daftar akun baru
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Nanti aja, lanjut dengerin
          </button>
        </div>
      </div>
    </div>
  );
}
