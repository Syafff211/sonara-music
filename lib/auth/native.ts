'use client';

/**
 * Capacitor helpers.
 * - Google OAuth inside the APK is opened with @capacitor/browser; after
 *   Supabase redirects to com.easvarafy.app://auth/callback, @capacitor/app
 *   receives the deep link and we exchange the PKCE code for a session.
 * - Everything degrades to plain web behaviour when not running natively.
 */

export const NATIVE_OAUTH_REDIRECT = 'com.easvarafy.app://auth/callback';

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function cap(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNativeApp(): boolean {
  return Boolean(cap()?.isNativePlatform?.());
}

export function isAndroidApp(): boolean {
  return isNativeApp() && cap()?.getPlatform?.() === 'android';
}

/** OAuth redirect target: deep link in the APK, normal web URL in the browser. */
export function oauthRedirectUrl(path = '/auth/callback'): string {
  if (typeof window === 'undefined') return path;
  if (isNativeApp()) return NATIVE_OAUTH_REDIRECT;
  return `${window.location.origin}${path}`;
}

/** Password recovery redirect target. */
export function passwordResetRedirectUrl(): string {
  if (typeof window === 'undefined') return '/reset-password';
  if (isNativeApp()) return NATIVE_OAUTH_REDIRECT;
  return `${window.location.origin}/reset-password`;
}

/** Opens an OAuth URL — system browser sheet on Android, popup-free redirect on web. */
export async function openAuthUrl(url: string): Promise<void> {
  if (isNativeApp()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, presentationStyle: 'popover' });
    return;
  }
  window.location.href = url;
}

export async function closeAuthBrowser(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
  } catch {
    /* already closed */
  }
}

/**
 * Subscribe to the appUrlOpen deep link in the APK.
 * Returns a cleanup function.
 */
export function onNativeAuthCallback(
  handler: (url: string) => void | Promise<void>
): () => void {
  if (!isNativeApp()) return () => {};
  let removed = false;
  let removeListener: (() => void) | null = null;

  void (async () => {
    try {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appUrlOpen', (event) => {
        if (!event?.url) return;
        if (event.url.includes('auth/callback')) {
          void handler(event.url);
        }
      });
      if (removed) void handle.remove();
      else removeListener = () => void handle.remove();
    } catch {
      /* @capacitor/app not available (plain web build) */
    }
  })();

  return () => {
    removed = true;
    removeListener?.();
  };
}
