'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Convenience alias so /admin doesn't 404 (client redirect keeps static export happy). */
export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--m3-bg)]">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--m3-primary)]" />
    </div>
  );
}
