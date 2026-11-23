'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
} from 'lucide-react';
import { Badge, ConfirmDialog, EmptyState } from '@/components/admin/AdminUI';
import {
  deleteUser,
  listUsers,
  setUserBanned,
  setUserRole,
} from '@/lib/admin/users';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Profile } from '@/lib/auth/types';
import { displayNameOf, initialsOf } from '@/lib/auth/types';
import { cn } from '@/lib/utils';

const PER_PAGE = 10;

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminUsersPage() {
  const { userId: myId } = useAuth();
  const [rows, setRows] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<'all' | 'user' | 'admin'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ user: Profile; mode: 'delete' | 'ban' | 'unban' } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listUsers({ search, role, status, page, perPage: PER_PAGE });
    setRows(result.rows);
    setTotal(result.total);
    if (result.error) setError(result.error);
    setLoading(false);
  }, [search, role, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const toggleRole = async (user: Profile) => {
    if (user.id === myId) {
      flash('Kamu tidak bisa menurunkan role akunmu sendiri.');
      return;
    }
    setBusyId(user.id);
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const { error: err } = await setUserRole(user.id, nextRole);
    setBusyId(null);
    if (err) {
      setError(err);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === user.id ? { ...r, role: nextRole } : r))
    );
    flash(
      `${displayNameOf(user, user.email)} sekarang ${nextRole === 'admin' ? 'Admin' : 'User'}.`
    );
  };

  const applyBan = async (user: Profile, banned: boolean) => {
    if (user.id === myId) {
      flash('Kamu tidak bisa memblokir akun sendiri.');
      return;
    }
    setBusyId(user.id);
    const { error: err } = await setUserBanned(user.id, banned);
    setBusyId(null);
    setConfirm(null);
    if (err) {
      setError(err);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === user.id ? { ...r, is_banned: banned } : r)));
    flash(`${displayNameOf(user, user.email)} ${banned ? 'diblokir' : 'diaktifkan kembali'}.`);
  };

  const applyDelete = async (user: Profile) => {
    if (user.id === myId) {
      flash('Kamu tidak bisa menghapus akun sendiri.');
      return;
    }
    setBusyId(user.id);
    const { error: err } = await deleteUser(user.id);
    setBusyId(null);
    setConfirm(null);
    if (err) {
      setError(err);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== user.id));
    setTotal((t) => Math.max(0, t - 1));
    flash(`Profile ${displayNameOf(user, user.email)} dihapus.`);
  };

  const rangeLabel = useMemo(() => {
    if (total === 0) return '0 user';
    const start = (page - 1) * PER_PAGE + 1;
    const end = Math.min(page * PER_PAGE, total);
    return `${start}–${end} dari ${total} user`;
  }, [page, total]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight">Users</h1>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
            Ubah role user ↔ admin, blokir, atau hapus profile.
          </p>
        </div>
        <span className="text-[11.5px] font-mono-nums text-slate-500 dark:text-slate-400">
          {rangeLabel}
        </span>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[12px] text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-[var(--m3-border)] bg-[var(--m3-surface)] p-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
          className="relative flex-1"
        >
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama atau email…"
            className="w-full min-h-[44px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] pl-10 pr-3 text-[13px] focus:outline-none focus:ring-4 focus:ring-[var(--m3-ring)]"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value as typeof role);
            }}
            aria-label="Filter role"
            className="min-h-[44px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] px-3 text-[12.5px] font-medium focus:outline-none"
          >
            <option value="all">Semua role</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as typeof status);
            }}
            aria-label="Filter status"
            className="min-h-[44px] rounded-xl bg-black/[0.04] dark:bg-white/[0.06] px-3 text-[12.5px] font-medium focus:outline-none"
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="banned">Diblokir</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-black/5 dark:bg-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Tidak ada user yang cocok"
          description="Coba ubah kata kunci pencarian atau filter role/status."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-[var(--m3-border)] bg-[var(--m3-surface)] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-[var(--m3-border)]">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Daftar</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => {
                  const isMe = user.id === myId;
                  const busy = busyId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--m3-border)] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#22D3C5] text-white text-[12px] font-bold flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              initialsOf(displayNameOf(user, user.email))
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold truncate">
                              {displayNameOf(user, user.email)}
                              {isMe && (
                                <span className="ml-1.5 text-[10px] font-medium text-[var(--m3-primary)]">
                                  (kamu)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {user.email ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={user.role === 'admin' ? 'admin' : 'neutral'}>
                          {user.role === 'admin' ? (
                            <>
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={user.is_banned ? 'danger' : 'success'}>
                          {user.is_banned ? 'Diblokir' : 'Aktif'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-[11.5px] text-slate-500 dark:text-slate-400 font-mono-nums">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void toggleRole(user)}
                            disabled={busy || isMe}
                            title={user.role === 'admin' ? 'Jadikan user' : 'Jadikan admin'}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
                          >
                            {user.role === 'admin' ? (
                              <ShieldOff className="w-4 h-4" />
                            ) : (
                              <UserCog className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirm({
                                user,
                                mode: user.is_banned ? 'unban' : 'ban',
                              })
                            }
                            disabled={busy || isMe}
                            title={user.is_banned ? 'Buka blokir' : 'Blokir user'}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
                          >
                            {user.is_banned ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirm({ user, mode: 'delete' })}
                            disabled={busy || isMe}
                            title="Hapus user"
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-2">
            {rows.map((user) => {
              const isMe = user.id === myId;
              const busy = busyId === user.id;
              return (
                <li
                  key={user.id}
                  className="rounded-2xl border border-[var(--m3-border)] bg-[var(--m3-surface)] p-3.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#22D3C5] text-white text-[13px] font-bold flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        initialsOf(displayNameOf(user, user.email))
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold truncate">
                        {displayNameOf(user, user.email)}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] font-medium text-[var(--m3-primary)]">
                            (kamu)
                          </span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email ?? '—'} · {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Badge tone={user.role === 'admin' ? 'admin' : 'neutral'}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                    <Badge tone={user.is_banned ? 'danger' : 'success'}>
                      {user.is_banned ? 'Diblokir' : 'Aktif'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => void toggleRole(user)}
                      disabled={busy || isMe}
                      className={cn(
                        'min-h-[38px] rounded-xl text-[11.5px] font-semibold inline-flex items-center justify-center gap-1',
                        'bg-black/5 dark:bg-white/[0.08] disabled:opacity-40'
                      )}
                    >
                      {user.role === 'admin' ? 'Jadikan user' : 'Jadikan admin'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({ user, mode: user.is_banned ? 'unban' : 'ban' })
                      }
                      disabled={busy || isMe}
                      className="min-h-[38px] rounded-xl text-[11.5px] font-semibold inline-flex items-center justify-center gap-1 bg-black/5 dark:bg-white/[0.08] disabled:opacity-40"
                    >
                      {user.is_banned ? 'Aktifkan' : 'Blokir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ user, mode: 'delete' })}
                      disabled={busy || isMe}
                      className="min-h-[38px] rounded-xl text-[11.5px] font-semibold inline-flex items-center justify-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 disabled:opacity-40"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-[40px] px-3.5 rounded-full border border-[var(--m3-border)] text-[12.5px] font-semibold inline-flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            <span className="text-[12px] font-mono-nums text-slate-500 dark:text-slate-400">
              Halaman {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="min-h-[40px] px-3.5 rounded-full border border-[var(--m3-border)] text-[12.5px] font-semibold inline-flex items-center gap-1 disabled:opacity-40"
            >
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.mode === 'delete'
            ? 'Hapus user ini?'
            : confirm?.mode === 'ban'
              ? 'Blokir user ini?'
              : 'Buka blokir user ini?'
        }
        description={
          confirm?.mode === 'delete'
            ? `${displayNameOf(confirm?.user ?? null, confirm?.user?.email)} tidak akan bisa login lagi ke Easvarafy. Data playlist/like miliknya ada di perangkatnya sendiri dan tidak terhapus.`
            : confirm?.mode === 'ban'
              ? `${displayNameOf(confirm?.user ?? null, confirm?.user?.email)} akan langsung dikeluarkan dan tidak bisa login sampai blokirnya dibuka.`
              : `${displayNameOf(confirm?.user ?? null, confirm?.user?.email)} bisa login lagi ke Easvarafy.`
        }
        confirmLabel={
          confirm?.mode === 'delete' ? 'Hapus' : confirm?.mode === 'ban' ? 'Blokir' : 'Buka blokir'
        }
        danger={confirm?.mode !== 'unban'}
        loading={Boolean(busyId)}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.mode === 'delete') void applyDelete(confirm.user);
          else void applyBan(confirm.user, confirm.mode === 'ban');
        }}
      />
    </div>
  );
}
