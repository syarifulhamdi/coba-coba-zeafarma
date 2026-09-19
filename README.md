# ZEA Farma — Dashboard

Dashboard internal untuk memonitor kunjungan & omzet klinik/apotek ZEA Farma,
menggantikan dashboard manual di Google Sheets ("Smart Finance ZMF"). Dibangun
dengan Next.js 16 (App Router) + TypeScript, Tailwind CSS, komponen bergaya
shadcn/ui, dan Recharts. Data diambil langsung dari Google Sheets API v4
(read-only, via service account) dan di-cache selama 15 menit.

## Fitur

- **Dua dashboard dalam satu aplikasi**, dipilih lewat tab di header dan
  tersimpan di URL (`?view=keuangan` / `?view=kunjungan`):
  - **Keuangan** — omzet, pengeluaran, profit, margin.
  - **Kunjungan Pasien** — jumlah kunjungan, pasien baru vs lama, jenis
    layanan, performa staf, dan komposisi gender.
- **KPI cards**: Total Omzet, Total Pengeluaran, Net Profit, Margin %, dengan
  indikator naik/turun MoM (atau vs periode pembanding lainnya).
- **Export laporan bulanan**: unduh CSV (siap dibuka di Excel) berisi ringkasan
  keuangan + kunjungan + rincian transaksi untuk periode yang sedang dipilih,
  atau cetak/simpan PDF lewat tampilan cetak khusus.
- **Filter periode**: Bulanan / Tahunan / Custom range, tersimpan di URL query
  params (bisa di-bookmark & share).
- **Cross-filtering**: klik kategori di chart Omzet atau Pengeluaran akan
  memfokuskan chart tren dan tabel transaksi ke kategori itu saja. Klik lagi
  (atau tombol "×" pada chip fokus) untuk menghapus filter.
- **Tren bulanan** omzet, pengeluaran, dan net profit, dengan overlay garis
  target profit dari sheet "Setup" (jika tersedia untuk tahun tersebut).
- **Perbandingan periode**: periode berjalan vs periode sebelumnya.
- **Tabel transaksi detail**: bisa di-collapse/expand, ada search & sort.
- **Password gate**: seluruh dashboard dilindungi session cookie yang
  ditandatangani (HMAC), tidak ada data yang bisa diakses tanpa login.

## Struktur proyek

```
src/
  app/
    page.tsx              # Dashboard utama (server component, fetch snapshot)
    login/page.tsx         # Halaman login (password gate)
    api/auth/login|logout   # Route handlers untuk sesi login
    api/export/route.ts      # Unduhan laporan CSV untuk periode terpilih
    globals.css             # Design tokens (warna brand, radius, gaya cetak)
  components/
    ui/                     # Primitif ala shadcn/ui (Button, Card, Table, ...)
    dashboard/               # Komponen dashboard (KPI, chart, tabel, filter)
  lib/
    google-sheets.ts         # Klien Google Sheets API (service account)
    parse-sheets.ts          # Parser baris mentah -> Transaction / ProfitGoals
    parse-visits.ts           # Parser tab "Trafik Kunjungan" -> VisitRecord
    aggregate.ts              # KPI, breakdown kategori, tren bulanan, dst.
    visit-aggregate.ts         # KPI & breakdown untuk data kunjungan
    report.ts                   # Penyusun laporan bulanan + serialisasi CSV
    data.ts                   # Snapshot data ter-cache (15 menit)
    filters.ts                 # Serialize/parse filter dari/ke URL query params
    colors.ts                  # Palet warna kategori (konsisten & accessible)
    auth.ts                    # Sign/verify session cookie
  proxy.ts                      # Middleware: menahan request tanpa sesi ke /login
  types/index.ts               # Tipe data bersama
```

## Tentang sumber data

Dashboard ini membaca 3 tab dari spreadsheet "Smart Finance ZMF":

- **Income** — kolom: `DATE, ID, PRODUCT / SERVICE, CATEGORY, AMOUNT, TAX, DISC, NET INCOME, NOTES, M, Y, Y2`.
  Kategori yang ditemukan di data: `Penjualan Apotek`, `Jasa Pelayanan Klinik`, `Penjualan Mitra Apotek`.
- **Expenses** — kolom: `DATE, ID, ITEM / PRODUCT, CATEGORY, AMOUNT, TAX, FEES, NET EXPENSE, NOTES, M, Y, Y2`
  (perhatikan: kolom ke-7 di tab ini bernama **FEES**, bukan **DISC** seperti di Income).
  Kategori resmi di tab "Setup" ada 14 (Belanja Obat (HPA), Gaji Pegawai, Jasa
  Pelayanan, Biaya Tetap, Maintenance, ATK & Percetakan, Biaya Langganan &
  Promosi/Marketing, Biaya Kegiatan, Pajak dan lain-lain, Kerusakan
  Persediaan, Biaya Sewa Toko, Diskon/Promo, Bahan Medis Habis Pakai (BMHP),
  Bonus/Reward Pegawai) — tapi transaksi riil di tab Expenses juga memakai 2
  kategori tambahan yang tidak ada di daftar resmi tersebut (`Service
  Costumer` dan `Penambahan alat / kebutuhan`). Dashboard **tidak
  mengasumsikan daftar kategori tetap**: kategori diambil dari nilai yang
  benar-benar muncul di data, jadi kategori baru yang ditambahkan nanti akan
  otomatis muncul di chart tanpa perlu ubah kode.
- **Trafik Kunjungan / Trafik Kunjungan 2026** — data kunjungan pasien, satu
  tab per tahun. Tiap tab berisi empat blok dengan bentuk matriks (kolom:
  label, TOTAL, JAN–DES): jumlah **Pasien Baru/Lama**, **Jenis Layanan**,
  **Performa staf**, dan **komposisi gender**. Parser mencari tiap blok lewat
  baris header-nya (bukan nomor baris), hanya membaca kolom bulan JAN–DES
  (beberapa baris punya angka nyasar di kolom sesudahnya, yang kalau ikut
  terbaca akan jadi "bulan ke-13"), dan memperlakukan sel kosong atau `-`
  sebagai *belum ada data* — bukan nol. Tab baru untuk tahun berikutnya akan
  terdeteksi otomatis selama namanya mengandung "Trafik Kunjungan" dan tahun.
  Angka **Total Kunjungan** diambil dari blok Pasien Baru/Lama, karena blok
  layanan dan staf di spreadsheet sumber punya total yang sedikit berbeda.
- **Setup** — target profit bulanan per tahun (2025–2029) dibaca secara
  dinamis: kode mencari sel "Calendar Year", memetakan kolom per tahun, lalu
  membaca nilai target pada baris tiap bulan (Jan–Des) di bawahnya. Ini
  sengaja dibuat dinamis (bukan hardcode nomor kolom) karena tab Setup
  memakai banyak merged cells — kalau susunannya berubah sedikit di
  spreadsheet, parser akan tetap mencoba menemukannya; kalau gagal, dashboard
  akan tetap jalan tanpa garis target (bukan error).

Kolom `NET INCOME` / `NET EXPENSE` dipakai sebagai nominal utama untuk semua
agregasi (bukan `AMOUNT`), karena itu yang mencerminkan nilai final setelah
pajak/potongan.

**Kalau nama tab atau struktur kolom di spreadsheet Anda berbeda:** nama tab
bisa diubah lewat environment variable (`SHEET_TAB_INCOME`,
`SHEET_TAB_EXPENSES`, `SHEET_TAB_SETUP`) tanpa ubah kode. Untuk perubahan
kolom, parser di `src/lib/parse-sheets.ts` mencari header berdasarkan teks
(`DATE`, `CATEGORY`, `AMOUNT`, kolom yang namanya diawali `NET`, dst.), bukan
posisi tetap, jadi cukup tahan terhadap penambahan/pemindahan kolom — tapi
kalau nama header berubah total, sesuaikan fungsi `findHeaderRow` di file
tersebut.

## Setup — langkah manual yang perlu Anda lakukan

Bagian ini **wajib** dilakukan sebelum dashboard bisa membaca data asli dari
Google Sheets.

### 1. Buat Google Cloud Project

1. Buka [console.cloud.google.com](https://console.cloud.google.com/).
2. Buat project baru (atau pakai project yang sudah ada), misalnya
   `zea-farma-dashboard`.

### 2. Aktifkan Google Sheets API

1. Di project tersebut, buka **APIs & Services → Library**.
2. Cari **Google Sheets API**, klik **Enable**.

### 3. Buat Service Account

1. Buka **APIs & Services → Credentials → Create Credentials → Service
   Account**.
2. Beri nama, misalnya `zea-farma-dashboard`. Role bisa dikosongkan (tidak
   perlu akses project-level apa pun — aksesnya diberikan langsung di
   spreadsheet pada langkah berikutnya).
3. Setelah service account dibuat, buka tab **Keys** pada service account
   tersebut → **Add Key → Create new key → JSON**. File JSON akan otomatis
   terunduh — simpan baik-baik, ini kredensial sensitif.
4. Dari file JSON tersebut, catat dua nilai:
   - `client_email` → ini untuk `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
   - `private_key` → ini untuk `GOOGLE_PRIVATE_KEY`.

### 4. Share spreadsheet ke service account

1. Buka spreadsheet **"Smart Finance ZMF"** di Google Sheets.
2. Klik **Share**, tempel email service account (`client_email` dari file
   JSON, formatnya seperti `nama@project-id.iam.gserviceaccount.com`).
3. Beri akses **Viewer** (dashboard ini hanya membaca data, tidak pernah
   menulis).

### 5. Siapkan environment variables

1. Salin `.env.example` menjadi `.env.local` untuk pengembangan lokal.
2. Isi:
   - `GOOGLE_SHEETS_ID` — ID spreadsheet, diambil dari URL-nya:
     `https://docs.google.com/spreadsheets/d/<ID_DI_SINI>/edit`.
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — dari `client_email`.
   - `GOOGLE_PRIVATE_KEY` — dari `private_key` (termasuk baris
     `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`).
   - `DASHBOARD_PASSWORD` — password untuk masuk ke dashboard. Pilih yang
     kuat & unik.
   - `AUTH_SECRET` — jalankan `openssl rand -base64 32` di terminal, tempel
     hasilnya.
3. Jangan pernah commit `.env.local` ke git (sudah otomatis di-ignore lewat
   `.gitignore`).

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — Anda akan diarahkan ke
`/login`, masukkan `DASHBOARD_PASSWORD` yang sudah diisi di `.env.local`.

## Build

```bash
npm run build
```

Route `/` sengaja dirender dinamis per-request (bukan di-generate statis saat
build) karena dilindungi sesi login — jadi `npm run build` **tidak**
memerlukan kredensial Google Sheets yang valid untuk berhasil. Data Google
Sheets baru benar-benar diambil saat halaman diakses saat runtime, dan
hasilnya di-cache 15 menit (lihat bagian Caching di bawah).

## Deploy ke Vercel

### Opsi A — lewat GitHub integration (disarankan)

1. Push repo ini ke GitHub.
2. Di [vercel.com](https://vercel.com/new), pilih **Import Project**, pilih
   repo ini.
3. Saat konfigurasi, tambahkan seluruh environment variables dari
   `.env.example` (lihat langkah 5 di atas) di bagian **Environment
   Variables**. Isi untuk **Production**, **Preview**, dan **Development**
   sesuai kebutuhan.
4. Klik **Deploy**.

### Opsi B — lewat Vercel CLI

```bash
npm install -g vercel
vercel login
vercel link
vercel env add GOOGLE_SHEETS_ID
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add DASHBOARD_PASSWORD
vercel env add AUTH_SECRET
vercel deploy --prod
```

> Saat mengisi `GOOGLE_PRIVATE_KEY` lewat prompt CLI, tempel nilainya persis
> seperti di file JSON (multi-baris). Kalau tools Anda memaksa satu baris
> dengan `\n` literal, itu juga didukung — kode akan otomatis meng-unescape.

## Caching & rate limit

Data Google Sheets **tidak** di-fetch pada setiap request. Fungsi
`getSnapshot()` (`src/lib/data.ts`) dibungkus dengan `unstable_cache` Next.js
dan revalidate setiap 15 menit, jadi dalam window tersebut semua request
dilayani dari cache tanpa memanggil Sheets API lagi. Ini menjaga dashboard
tetap cepat dan jauh dari rate limit Google Sheets API.

## Keamanan

- **Password gate**: middleware (`src/proxy.ts`) memeriksa session cookie
  bertanda tangan HMAC-SHA256 (`AUTH_SECRET`) pada setiap request; tanpa
  cookie valid, request diarahkan ke `/login`. Cookie di-set `httpOnly`,
  `secure` (di production), dan `sameSite=lax`.
- **Tidak ada kredensial di kode**: semua kredensial (Google service account,
  password dashboard, secret sesi) hanya lewat environment variables. Jangan
  commit `.env.local` atau file kredensial JSON ke git.
- Kalau ke depannya ingin membatasi akses ke email Google tertentu (bukan
  cuma satu password bersama), opsi paling praktis adalah mengganti password
  gate ini dengan [NextAuth.js](https://authjs.dev) + Google provider, dibatasi
  lewat `signIn` callback yang mengecek domain/daftar email yang diizinkan.
  Ini belum diimplementasikan di MVP ini agar setup tetap sederhana (satu
  password bersama untuk direksi/tim internal), tapi struktur middleware
  sudah terpisah rapi di `src/proxy.ts` + `src/lib/auth.ts` sehingga mudah
  diganti nanti.

## Known limitations / ide pengembangan lanjutan

- Perbandingan periode untuk mode "Custom range" memakai window dengan
  panjang yang sama persis sebelum tanggal mulai (bukan tahun kalender
  sebelumnya) — cukup untuk kebanyakan kasus, tapi bisa disesuaikan di
  `getPeriodRange` (`src/lib/aggregate.ts`) kalau perlu perilaku lain.
- Search & sort pada tabel transaksi belum tercermin di URL (hanya filter
  kategori & periode sesuai yang diminta) — bisa ditambahkan kalau
  dibutuhkan.
- Tab "Balance Sheet" pada spreadsheet sumber belum dipakai (di luar scope
  income/expense/target yang diminta).
