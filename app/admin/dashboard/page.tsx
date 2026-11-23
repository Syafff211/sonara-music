'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge, EmptyState, StatCard } from '@/components/admin/AdminUI';
import { getUserStats, listUsers, type UserStats } from '@/lib/admin/users';
import type { Profile } from '@/lib/auth/types';
import { displayNameOf, initialsOf } from '@/lib/auth/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recent, setRecent] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ stats: nextStats, error: statsError }, list] = await Promise.all([
      getUserStats(),
      listUsers({ perPage: 5, page: 1 }),
    ]);
    setStats(nextStats);
    setRecent(list.rows);
    if (statsError || list.error) setError(statsError ?? list.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight">Dashboard</h1>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
          Statistik user Easvarafy. Admin tidak mengelola lagu — katalog musik tetap dari sumber lama.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-800 dark:text-amber-200">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total user"
          value={loading ? '—' : (stats?.total ?? 0)}
          hint="Semua akun terdaftar"
          icon={<Users className="w-4 h-4" />}
          tone="primary"
        />
        <StatCard
          label="Admin"
          value={loading ? '—' : (stats?.admins ?? 0)}
          hint="Akses panel admin"
          icon={<ShieldCheck className="w-4 h-4" />}
          tone="success"
        />
        <StatCard
          label="Diblokir"
          value={loading ? '—' : (stats?.banned ?? 0)}
          hint="Akun dibanned"
          icon={<Ban className="w-4 h-4" />}
          tone="danger"
        />
        <StatCard
          label="Baru 7 hari"
          value={loading ? '—' : (stats?.new_7d ?? 0)}
          hint={`${stats?.new_30d ?? 0} dalam 30 hari`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-[var(--m3-border)] bg-[var(--m3-surface)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[var(--m3-primary)]" />
              User terbaru
            </h2>
            <Link
              href="/admin/users"
              className="text-[12px] font-semibold text-[var(--m3-primary)] inline-flex items-center gap-1"
            >
              Semua user <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-black/5 dark:bg-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              title="Belum ada user"
              description="User yang mendaftar lewat /register atau Google akan muncul di sini."
            />
          ) : (
            <ul className="divide-y divide-[var(--m3-border)]">
              {recent.map((user) => (
                <li key={user.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#22D3C5] text-white text-[12px] font-bold flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      initialsOf(displayNameOf(user, user.email))
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate">
                      {displayNameOf(user, user.email)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.is_banned && <Badge tone="danger">Banned</Badge>}
                    <Badge tone={user.role === 'admin' ? 'admin' : 'neutral'}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-[var(--m3-border)] bg-[var(--m3-surface)] p-4">
            <h2 className="text-[14px] font-bold mb-2">Akses admin</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Untuk menjadikan seseorang admin, buka <strong>Users</strong> dan ubah role-nya menjadi
              <strong> Admin</strong>. Admin bisa melihat semua profile; user biasa hanya bisa melihat
              profile miliknya sendiri (RLS).
            </p>
            <Link
              href="/admin/users"
              className="mt-3 inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)] text-[12.5px] font-semibold"
            >
              Kelola user
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--m3-border)] bg-[var(--m3-surface)] p-4">
            <h2 className="text-[14px] font-bold mb-1.5">Data yang disimpan Supabase</h2>
            <ul className="text-[12px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
              <li>· Auth user (email / Google)</li>
              <li>· Tabel <code className="text-[11px]">profiles</code>: nama, email, avatar, role</li>
              <li>· Playlist, like & history tetap di perangkat user (localStorage)</li>
              <li>· Lagu, banner, cover, lirik: tidak disimpan di Supabase</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
