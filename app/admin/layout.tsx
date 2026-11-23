'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Music4, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AccountAvatar } from '@/components/auth/AccountMenu';
import { displayNameOf } from '@/lib/auth/types';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
];

/**
 * Admin shell + guard.
 * Any non-admin (guest or plain user) is redirected to /login — the only admin
 * entry point is /admin/login.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, isAuthenticated, isAdmin, profile, email, signOut } = useAuth();
  const isLoginRoute = pathname === '/admin/login' || pathname?.startsWith('/admin/login/');

  useEffect(() => {
    if (!ready || isLoginRoute) return;
    if (!isAuthenticated || !isAdmin) router.replace('/login?redirectTo=/admin/dashboard');
  }, [ready, isAuthenticated, isAdmin, isLoginRoute, router]);

  if (isLoginRoute) return <>{children}</>;

  if (!ready) {
    return (
      <div className="min-h-screen bg-[var(--m3-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFF] via-[#5B8CFF] to-[#22D3C5] animate-pulse" />
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400">Memeriksa akses admin…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--m3-bg)] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <ShieldCheck className="w-8 h-8 text-[var(--m3-primary)]" />
        <p className="text-sm font-semibold">Halaman ini khusus admin</p>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
          Kamu akan diarahkan ke halaman login…
        </p>
        <Link
          href="/login"
          className="mt-2 min-h-[44px] px-5 rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)] text-[13px] font-semibold inline-flex items-center"
        >
          Ke halaman login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--m3-bg)] text-[#1A1C20] dark:text-[#E6E8EE] flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-2rem)] sticky top-4 ml-4 my-4 rounded-3xl liquid-glass p-4 justify-between">
        <div className="flex flex-col gap-6">
          <Link href="/admin/dashboard" className="px-2 pt-1 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C5CFF] via-[#5B8CFF] to-[#22D3C5] flex items-center justify-center">
              <Music4 className="w-4 h-4 text-white" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-bold tracking-tight">Easvarafy</span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                Admin Console
              </span>
            </span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors',
                    active
                      ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/[0.06]'
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/[0.06]"
            >
              <Music4 className="w-[18px] h-[18px]" />
              Buka Player
            </Link>
          </nav>
        </div>

        <div className="rounded-2xl border border-[var(--m3-border)] p-2.5">
          <div className="flex items-center gap-2.5">
            <AccountAvatar size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold truncate">
                {displayNameOf(profile, email)}
              </p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Administrator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-2 w-full min-h-[34px] rounded-full text-[12px] font-medium inline-flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar + tabs */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-[54px] px-4 bg-[var(--m3-bg)]/95 border-b border-[var(--m3-border)]">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#22D3C5] flex items-center justify-center">
              <Music4 className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="text-sm font-bold">Easvarafy Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Keluar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <nav className="lg:hidden flex gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar border-b border-[var(--m3-border)]">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-semibold whitespace-nowrap',
                  active
                    ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]'
                    : 'text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/[0.06]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 sm:px-8 pt-6 pb-10 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
