/**
 * The music catalog (songs, banners, covers, lyrics) keeps using the exact same
 * `/api/music/*` routes as before. The only difference is that the Android APK
 * build is a static export and has no server, so in that build the calls are
 * pointed at the deployed web build via NEXT_PUBLIC_API_BASE.
 *
 * Nothing about the data source changed — no scraping, no new music service.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) return path;
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}
