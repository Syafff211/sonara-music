import type { NextConfig } from 'next';

/**
 * Two builds share this config:
 *  - Web (Vercel / `next dev` / `npm run build`): standalone output, API routes live.
 *  - Android APK (`npm run build:static` with NEXT_STATIC_EXPORT=true): pure static
 *    export into `out/` for Capacitor. The music API routes are served by the
 *    deployed web build and reached through NEXT_PUBLIC_API_BASE.
 */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Required by static export (Capacitor WebView has no Next image optimizer).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'music.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // `output: 'export'` is only used for the APK build; the web build keeps the
  // Node API routes (ytmusic / lyrics) that the player has always used.
  output: isStaticExport ? 'export' : 'standalone',
  trailingSlash: true,
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
