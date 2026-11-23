import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Easvarafy — Dengerin Musik Tanpa Batas',
  description:
    'Easvarafy — Dengerin Musik Tanpa Batas. Pemutar musik modern dengan lirik sinkron, equalizer, playlist, dan sleep timer.',
  applicationName: 'Easvarafy',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Easvarafy — Dengerin Musik Tanpa Batas',
    description:
      'Easvarafy — Dengerin Musik Tanpa Batas. Pemutar musik modern dengan lirik sinkron, equalizer, playlist, dan sleep timer.',
    siteName: 'Easvarafy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Easvarafy — Dengerin Musik Tanpa Batas',
    description:
      'Easvarafy — Dengerin Musik Tanpa Batas. Pemutar musik modern dengan lirik sinkron, equalizer, playlist, dan sleep timer.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`dark ${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[var(--m3-bg)] text-[#1A1C20] dark:text-[#E6E8EE] selection:bg-[var(--m3-primary-soft)] selection:text-[var(--m3-primary)] transition-colors duration-200"
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
