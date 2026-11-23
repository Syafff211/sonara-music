'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'primary' | 'danger' | 'success';
}) {
  return (
    <div className="rounded-2xl border border-[var(--m3-border)] bg-[var(--m3-surface)] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              tone === 'primary' && 'bg-[var(--m3-primary-soft)] text-[var(--m3-primary)]',
              tone === 'danger' && 'bg-red-500/10 text-red-600 dark:text-red-400',
              tone === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              tone === 'default' && 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300'
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="text-[26px] font-bold tracking-tight mt-2 font-mono-nums leading-none">
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'admin' | 'danger' | 'success';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
        tone === 'neutral' && 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300',
        tone === 'admin' && 'bg-[var(--m3-primary-soft)] text-[var(--m3-primary)]',
        tone === 'danger' && 'bg-red-500/10 text-red-600 dark:text-red-400',
        tone === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      )}
    >
      {children}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  danger = true,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button type="button" aria-label="Tutup" onClick={onCancel} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-3xl bg-[var(--m3-surface)] border border-[var(--m3-border)] p-5 shadow-2xl">
        <h2 className="text-[16px] font-bold">{title}</h2>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          {description}
        </p>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] rounded-full border border-[var(--m3-border)] text-[13px] font-semibold hover:bg-black/5 dark:hover:bg-white/10"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 min-h-[44px] rounded-full text-[13px] font-semibold text-white disabled:opacity-60',
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--m3-primary)]'
            )}
          >
            {loading ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--m3-border)] p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
