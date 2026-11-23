import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.easvarafy.app',
  appName: 'Easvarafy',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    // Google OAuth is opened in the system browser sheet; Supabase then
    // redirects to com.easvarafy.app://auth/callback which is captured by
    // @capacitor/app (see lib/auth/native.ts).
    Browser: {
      presentationStyle: 'popover',
    },
  },
};

export default config;
