# Rencana & Status Implementasi: Integrasi Logo dengan Supabase Storage

## 1. Analisis Masalah (Selesai Diselesaikan)
Sebelumnya logo hanya tersimpan sebagai string Base64 di `localStorage` peramban lokal uploader:
- Berkas gambar tidak diunggah ke *bucket* Supabase Storage.
- Ukuran Base64 yang besar membuat penyimpanan ke tabel `bimbel_settings` gagal atau terpotong.
- Instance *deploy* atau pengguna di perangkat lain membaca data dari Supabase yang kolom `logo_url`-nya masih kosong (`null`).
- Tidak tersedia penjelajah berkas bucket untuk memilih file yang sudah diunggah di dashboard Supabase.

---

## 2. Fitur yang Telah Diterapkan & Aktif

### A. Layanan Supabase Storage (`src/services/bimbelStorage.ts` & `src/types/bimbel.ts`)
- [x] **`uploadLogoToSupabase`**: Mengunggah berkas gambar langsung ke bucket Supabase Storage dan menghasilkan *Public URL* permanen.
- [x] **`listSupabaseBucketFiles`**: Membaca daftar berkas di bucket Supabase Storage (mendukung folder Root `/`, `logo/`, `photos/`, dan subfolder kustom) lengkap dengan nama berkas, ukuran (KB), thumbnail, dan tautan publik.
- [x] **Perbaikan `saveSettingsSync`**: Memastikan kolom `logo_url` selalu tersimpan aman ke tabel `bimbel_settings` di Supabase tanpa terpotong atau terlewati pada proses fallback.

### B. Antarmuka Pengaturan Logo (`src/components/modules/PengaturanModule.tsx`)
- [x] **Unggah Langsung ke Bucket**: Memilih berkas dari perangkat langsung mengunggahnya ke bucket publik Supabase dengan indikator status proses yang jelas.
- [x] **Penjelajah Berkas Bucket (Modal Picker)**:
  - Tombol **"Pilih dari Berkas di Bucket"** dan **"Lihat Berkas Bucket"**.
  - Menampilkan thumbnail gambar, navigasi folder (Root `/`, `logo/`, `photos/`), pencarian nama berkas, dan tombol **"Pilih Logo Ini"**.
  - Tombol uji pratinjau URL gambar di tab baru.
- [x] **Indikator Status & Migrasi Logo**:
  - Lencana **✓ Supabase Storage Publik** untuk URL cloud publik.
  - Lencana **⚠ Hanya Tersimpan Lokal** disertai tombol migrasi 1-klik untuk otomatis mengunggah logo Base64 lama ke Supabase Storage.

---

## 3. Hasil Verifikasi
- TypeScript check (`tsc --noEmit` via `lint_applet`): **Sukses tanpa error**.
- Build applet (`compile_applet`): **Sukses terkompilasi**.
- Dev server: **Berjalan aktif**.
