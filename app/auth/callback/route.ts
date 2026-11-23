import { NextRequest, NextResponse } from 'next/server';

/**
 * Supabase Auth callback.
 *
 * Supabase redirects here with `?code=...` (PKCE) after:
 *  - Google OAuth sign-in
 *  - email confirmation
 *  - password recovery
 *
 * The PKCE `code_verifier` lives in the browser's storage, so the exchange must
 * happen on the client. This handler only normalises the incoming query string
 * and forwards it to the client-side exchange page (/auth/complete).
 *
 * In the Android APK build the whole app is a static export and the callback
 * arrives as a deep link (com.easvarafy.app://auth/callback) handled by
 * @capacitor/app — see lib/auth/native.ts.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === 'true') {
    // Static export has no server runtime; the APK handles this via deep link.
    return NextResponse.json({ ok: true, handler: 'client' });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const errorDescription =
    url.searchParams.get('error_description') || url.searchParams.get('error');

  const destination = new URL('/auth/complete', url.origin);

  if (code) destination.searchParams.set('code', code);
  if (tokenHash) destination.searchParams.set('token_hash', tokenHash);
  if (type) destination.searchParams.set('type', type);
  if (errorDescription) destination.searchParams.set('error', errorDescription);

  // Preserve the Supabase recovery/confirmation flow target.
  if (type === 'recovery') destination.searchParams.set('next', '/reset-password');

  return NextResponse.redirect(destination);
}
