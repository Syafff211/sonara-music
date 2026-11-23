# Setup Login Google (OAuth) — Easvarafy

Supabase project: `kxvckczujvwvfkykofzc`
(`https://kxvckczujvwvfkykofzc.supabase.co`)

Login email + password **sudah jalan** tanpa langkah ini. Panduan ini hanya untuk
mengaktifkan tombol **"Lanjutkan dengan Google"**.

---

## Konsep: siapa menelepon siapa

```
App (web / APK)
   │  1. supabase.auth.signInWithOAuth({ provider: 'google' })
   ▼
Supabase Auth  ──2. redirect ke Google──▶  accounts.google.com
                                              │ 3. user pilih akun
   ┌──────────────────────────────────────────┘
   ▼  4. Google redirect ke SATU-SATUNYA URI yang didaftarkan di Google:
      https://kxvckczujvwvfkykofzc.supabase.co/auth/v1/callback
Supabase Auth
   │  5. Supabase menukar code ke Google, membuat sesi,
   │     lalu redirect ke `redirectTo` milik app
   ▼
App: https://domain-kamu/auth/callback?code=...
     atau (APK) com.easvarafy.app://auth/callback?code=...
```

Karena itu:

| URL | Didaftarkan di | Kenapa |
| --- | --- | --- |
| `https://kxvckczujvwvfkykofzc.supabase.co/auth/v1/callback` | **Google Cloud Console** | Satu-satunya URI yang dilihat Google |
| `https://domain-kamu/auth/callback` | **Supabase → URL Configuration** | Supabase yang mengarahkan balik ke app |
| `https://domain-kamu/reset-password` | **Supabase → URL Configuration** | Link reset password |
| `com.easvarafy.app://auth/callback` | **Supabase → URL Configuration** | Deep link APK |

> Google **tidak perlu** tahu domain app kamu, dan **tidak perlu** tahu deep link
> `com.easvarafy.app://...`. Semua itu urusan Supabase.

---

## Langkah 1 — Buat OAuth Client di Google Cloud Console

1. Buka <https://console.cloud.google.com/>.
2. Pilih project di dropdown atas, atau **New Project** → nama bebas
   (mis. `Easvarafy Auth`) → **Create**.
   *Disarankan project/client baru, jangan menumpang client milik aplikasi lain.*

### 1a. Konfigurasi OAuth consent screen

3. Menu kiri: **APIs & Services → OAuth consent screen**.
4. Pilih **External** → **Create**.
5. Isi:
   - **App name**: `Easvarafy`
   - **User support email**: email kamu
   - **Developer contact information**: email kamu
   - Logo & domain opsional (butuh verifikasi kalau diisi)
6. **Save and Continue**.
7. **Scopes** → **Add or remove scopes** → centang:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

   → **Update** → **Save and Continue**.
8. **Test users** (hanya muncul kalau status masih *Testing*): tambahkan email
   Google yang mau kamu pakai untuk tes → **Save and Continue** → **Back to Dashboard**.
9. Kalau sudah siap untuk publik: **Publish app**.
   > Selama status masih *Testing*, hanya test user yang bisa login dan refresh
   > token-nya kedaluwarsa tiap 7 hari. Untuk produksi, publish.

### 1b. Buat OAuth client ID

10. Menu kiri: **APIs & Services → Credentials**.
11. **+ Create Credentials → OAuth client ID**.
12. **Application type**: **Web application**.
13. **Name**: `Easvarafy Web` (bebas).
14. **Authorized JavaScript origins** — tambahkan:

    ```
    https://kxvckczujvwvfkykofzc.supabase.co
    ```
    (opsional tapi aman; app ini memakai redirect penuh, bukan Google JS SDK)

15. **Authorized redirect URIs** — tambahkan **persis** ini:

    ```
    https://kxvckczujvwvfkykofzc.supabase.co/auth/v1/callback
    ```

    ⚠️ Perhatikan `/auth/v1/callback` di akhir — **bukan** `/auth/callback`, dan
    **tanpa** trailing slash. Salah sedikit langsung `redirect_uri_mismatch`.

16. **Create** → muncul modal berisi **Client ID** dan **Client secret**.
    Salin keduanya (secret bisa diunduh JSON).

---

## Langkah 2 — Tempel kredensial di Supabase

1. Buka <https://supabase.com/dashboard/project/kxvckczujvwvfkykofzc/auth/providers>.
2. Cari **Google** → aktifkan toggle **Enable Sign in with Google**.
3. Tempel:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**
4. **Save**.

Selesai di sisi provider — tombol "Lanjutkan dengan Google" langsung aktif.

---

## Langkah 3 — Daftarkan URL redirect di Supabase

Supabase **menolak** redirect ke URL yang tidak ada di allowlist
(`redirect_to not allowed`), jadi langkah ini wajib.

1. Buka <https://supabase.com/dashboard/project/kxvckczujvwvfkykofzc/auth/url-configuration>.
2. **Site URL**: `https://domain-produksi-kamu`
3. **Redirect URLs** — tambahkan satu per satu:

   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   http://localhost:3000/reset-password
   https://domain-produksi-kamu/**
   https://domain-produksi-kamu/auth/callback
   https://domain-produksi-kamu/reset-password
   com.easvarafy.app://auth/callback
   ```

   Wildcard `/**` berguna untuk semua preview deployment Vercel, mis.
   `https://*.vercel.app/**` kalau kamu mau mencakup semuanya.
4. **Save**.

---

## Langkah 4 — Untuk APK (Capacitor)

Tidak ada yang perlu diubah di Google Cloud Console. Yang dibutuhkan:

1. `com.easvarafy.app://auth/callback` sudah ada di Supabase Redirect URLs
   (langkah 3).
2. `android/app/src/main/AndroidManifest.xml` punya intent-filter deep link:

   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="com.easvarafy.app" android:host="auth" android:pathPrefix="/callback" />
   </intent-filter>
   ```

3. Alur yang sudah ada di `lib/auth/native.ts`:
   `signInWithOAuth` → dibuka lewat `@capacitor/browser` → Supabase redirect ke
   deep link → `@capacitor/app` menangkap `appUrlOpen` (plus `getLaunchUrl` untuk
   cold start) → `exchangeCodeForSession(code)` → browser sheet ditutup →
   redirect ke `/` atau `/admin/dashboard`. Tidak berhenti di halaman putih.

---

## Uji cepat

1. `npm run dev` → buka `http://localhost:3000/login`.
2. Klik **Lanjutkan dengan Google** → pilih akun.
3. Seharusnya mendarat di `/auth/complete` sebentar lalu ke `/` (atau
   `/admin/dashboard` kalau akun itu role-nya admin).
4. Cek Supabase → **Table Editor → profiles**: baris baru muncul dengan
   `role = 'user'` (dibuat otomatis oleh trigger `on_auth_user_created`).

---

## Kalau error

| Pesan | Penyebab & solusi |
| --- | --- |
| `redirect_uri_mismatch` | URI di Google ≠ `https://kxvckczujvwvfkykofzc.supabase.co/auth/v1/callback`. Sering karena memakai `/auth/callback` atau ada trailing slash. Perbaiki di **Credentials → OAuth client → Edit** (perubahan bisa butuh beberapa menit). |
| `redirect_to not allowed` / kembali ke halaman login | URL app belum ada di **Supabase → URL Configuration → Redirect URLs**. |
| `provider is not enabled` / tombol tidak bereaksi | Provider Google belum di-enable atau Client ID/Secret salah di **Supabase → Authentication → Providers**. |
| `Access blocked: ... has not completed the verification` | Consent screen masih *Testing* dan akunmu bukan test user → tambahkan sebagai test user atau **Publish app**. |
| `Error 400: invalid_client` | Client secret salah/kadaluarsa → generate ulang di Google lalu tempel lagi. |
| Login web sukses tapi APK stuck putih | Deep link tidak tertangkap: cek intent-filter di AndroidManifest dan pastikan `com.easvarafy.app://auth/callback` ada di allowlist Supabase. |

---

## Catatan keamanan

- **Client secret hanya disimpan di Supabase** (Authentication → Providers).
  Jangan pernah menaruhnya di `NEXT_PUBLIC_*` atau di repo.
- Yang aman diekspos ke browser hanya `NEXT_PUBLIC_SUPABASE_URL` dan
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key memang dirancang publik; akses data
  tetap dibatasi RLS).
- Role admin **tidak bisa** dinaikkan sendiri oleh user — policy RLS
  `profiles_update_own` memblokir perubahan `role` dan `is_banned`.
