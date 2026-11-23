'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogIn, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useMusic } from '@/components/MusicProvider';
import { displayNameOf, initialsOf } from '@/lib/auth/types';
import { cn } from '@/lib/utils';

export function AccountAvatar({ size = 32 }: { size?: number }) {
  const { profile, email } = useAuth();
  const label = displayNameOf(profile, email);
  const avatar = profile?.avatar_url;

  return (
    <span
      className="rounded-full overflow-hidden bg-gradient-to-br from-[#7C5CFF] via-[#5B8CFF] to-[#22D3C5] flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white/30"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initialsOf(label)
      )}
    </span>
  );
}

/** "Profil & Library" — keeps the existing player shell, just switches tab. */
function ProfileLibraryButton({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { setActiveTab, openDetail } = useMusic();
  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        openDetail(null);
        setActiveTab('library');
      }}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/10',
        className
      )}
    >
      <UserIcon className="w-4 h-4" />
      Profil &amp; Library
    </button>
  );
}

function AccountMenuCard({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, email, isAdmin, isBanned, signOut } = useAuth();
  const router = useRouter();
  const name = displayNameOf(profile, email);

  return (
    <div className="w-64 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-border)] shadow-2xl p-3">
      <div className="flex items-center gap-3 px-1 py-1.5">
        <AccountAvatar size={38} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {email ?? '—'}
          </p>
        </div>
      </div>

      <div className="h-px bg-[var(--m3-border)] my-2" />

      {isAdmin && (
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          <LayoutDashboard className="w-4 h-4" />
          Admin Dashboard
        </Link>
      )}
      <ProfileLibraryButton onNavigate={onNavigate} />
      {isBanned && (
        <p className="px-2.5 py-1.5 text-[11px] text-red-600 dark:text-red-400">
          Akun kamu diblokir admin.
        </p>
      )}
      <button
        type="button"
        onClick={async () => {
          onNavigate?.();
          await signOut();
          router.refresh();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10"
      >
        <LogOut className="w-4 h-4" />
        Keluar
      </button>
    </div>
  );
}

/** Compact account entry used in the mobile top bar. */
export function MobileAccountButton() {
  const { isAuthenticated, ready } = useAuth();
  const [open, setOpen] = useState(false);

  if (!ready) return <span className="w-10 h-10" />;

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="min-h-[40px] px-3.5 rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)] text-[13px] font-semibold inline-flex items-center gap-1.5"
      >
        <LogIn className="w-4 h-4" />
        Masuk
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        aria-expanded={open}
        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full"
      >
        <AccountAvatar size={30} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup menu akun"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50">
            <AccountMenuCard onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

/** Sidebar footer block: sign-in CTA for guests, account card for members. */
export function SidebarAccount({ className }: { className?: string }) {
  const { isAuthenticated, ready, profile, email, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!ready) return <div className={cn('h-14', className)} />;

  if (!isAuthenticated) {
    return (
      <div className={cn('rounded-2xl border border-[var(--m3-border)] p-3', className)}>
        <p className="text-sm font-semibold">Dengerin tanpa batas</p>
        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
          Login buat simpan playlist, like, dan history kamu.
        </p>
        <Link
          href="/login"
          className="mt-2.5 w-full min-h-[38px] rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)] text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
        >
          <LogIn className="w-4 h-4" />
          Masuk
        </Link>
        <Link
          href="/register"
          className="mt-1.5 w-full min-h-[34px] rounded-full text-[12.5px] font-medium inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Daftar akun baru
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Buka menu akun"
        className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors text-left"
      >
        <AccountAvatar size={34} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold truncate">{displayNameOf(profile, email)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate inline-flex items-center gap-1">
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3 h-3" /> Admin
              </>
            ) : (
              'Free account'
            )}
          </p>
        </div>
        <span
          role="button"
          tabIndex={-1}
          aria-label="Keluar"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            void signOut().then(() => router.refresh());
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <LogOut className="w-3.5 h-3.5" />
        </span>
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50">
          <AccountMenuCard onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
