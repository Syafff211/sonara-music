#!/usr/bin/env node
/**
 * Builds the static bundle consumed by Capacitor (APK).
 *
 * The web build keeps the `/api/music/*` route handlers (ytmusic / lyrics —
 * the exact same music source as before) and `/auth/callback`. A static export
 * cannot contain server routes, and the APK doesn't need them:
 *   - music calls go to the deployed web build via NEXT_PUBLIC_API_BASE
 *     (see lib/api/base.ts), same endpoints, same data source;
 *   - the OAuth callback arrives as the deep link
 *     com.easvarafy.app://auth/callback handled by @capacitor/app
 *     (see lib/auth/native.ts).
 *
 * So for this build only, those server-only folders are moved aside, the
 * export runs, and everything is always restored afterwards (even on failure).
 */
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const stashRoot = path.join(root, '.static-export-stash');

/** Server-only paths that must not be part of a static export. */
const SERVER_ONLY = ['app/api', 'app/auth/callback'];

const moved = [];

function restoreAll() {
  while (moved.length > 0) {
    const entry = moved.pop();
    if (existsSync(entry.stash)) {
      mkdirSync(path.dirname(entry.original), { recursive: true });
      renameSync(entry.stash, entry.original);
      console.log(`· restored ${path.relative(root, entry.original)}`);
    }
  }
  if (existsSync(stashRoot)) {
    rmSync(stashRoot, { recursive: true, force: true });
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    restoreAll();
    process.exit(1);
  });
}

try {
  for (const relative of SERVER_ONLY) {
    const original = path.join(root, relative);
    if (!existsSync(original)) continue;
    const stash = path.join(stashRoot, relative);
    mkdirSync(path.dirname(stash), { recursive: true });
    renameSync(original, stash);
    moved.push({ original, stash });
    console.log(`· ${relative} temporarily excluded from the static export`);
  }

  const result = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, NEXT_STATIC_EXPORT: 'true' },
  });

  const code = result.status ?? 1;
  restoreAll();
  if (code !== 0) {
    console.error('Static export failed with exit code', code);
    process.exit(code);
  }
  console.log('✓ Static export ready in ./out (Capacitor webDir)');
} catch (error) {
  restoreAll();
  console.error(error);
  process.exit(1);
}
