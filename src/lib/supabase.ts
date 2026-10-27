import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys for local storage
const LS_SUPABASE_URL = 'bimbel_supabase_url';
const LS_SUPABASE_KEY = 'bimbel_supabase_anon_key';

const DEFAULT_URL = 'https://qozxwgteablbjxmlncgj.supabase.co';
const DEFAULT_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvenh3Z3RlYWJsYmp4bWxuY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTgxNTYsImV4cCI6MjEwODY3NDE1Nn0.VDhUCbzTVz6c-rxD6XPH9yu_RP2VWkmwiY0x2HAh-GQ';

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Strip /rest/v1/ or /rest/v1 or trailing slashes
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(LS_SUPABASE_URL) || '';
  const storedKey = localStorage.getItem(LS_SUPABASE_KEY) || '';

  const rawUrl = storedUrl || envUrl || DEFAULT_URL;
  const rawKey = storedKey || envKey || DEFAULT_KEY;

  return {
    url: normalizeSupabaseUrl(rawUrl),
    anonKey: rawKey.trim(),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  const normalizedUrl = normalizeSupabaseUrl(url);
  if (normalizedUrl) {
    localStorage.setItem(LS_SUPABASE_URL, normalizedUrl);
  } else {
    localStorage.removeItem(LS_SUPABASE_URL);
  }

  if (anonKey.trim()) {
    localStorage.setItem(LS_SUPABASE_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(LS_SUPABASE_KEY);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (error) {
    console.error('Gagal inisialisasi Supabase client:', error);
    return null;
  }
}

/**
 * SQL Schema migration generator for the user to run in Supabase SQL editor.
 */
export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- SKEMA DATABASE SUPABASE UNTUK BIMBELSMART (BIMBINGAN BELAJAR)
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > New Query
-- ==========================================================

-- 1. TABEL USERS (Login untuk masing-masing role: Super Admin, Admin, Guru)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'guru')),
  phone TEXT,
  email TEXT,
  tutor_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL SISWA (Students)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY, -- Contoh: SIS-001
  name TEXT NOT NULL,
  bimbel_type TEXT NOT NULL CHECK (bimbel_type IN ('Kelompok', 'Privat 3', 'Privat 1', 'Home Visit')),
  parent_name TEXT,
  parent_phone TEXT NOT NULL,
  grade TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  joined_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL GURU (Tutors)
CREATE TABLE IF NOT EXISTS tutors (
  id TEXT PRIMARY KEY, -- Contoh: GRU-001
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  tunjangan_jabatan NUMERIC DEFAULT 0,
  default_bonus NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  account_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL JADWAL (Schedules: 4 hari Senin - Kamis, 5 sesi per hari)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis')),
  session_id INT NOT NULL CHECK (session_id BETWEEN 1 AND 5),
  session_time TEXT NOT NULL,
  bimbel_type TEXT NOT NULL,
  tutor_id TEXT REFERENCES tutors(id) ON DELETE SET NULL,
  tutor_name TEXT NOT NULL,
  student_ids JSONB DEFAULT '[]'::jsonb,
  student_names JSONB DEFAULT '[]'::jsonb,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL ABSENSI (Attendance)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  day TEXT NOT NULL,
  session_id INT NOT NULL,
  session_time TEXT NOT NULL,
  bimbel_type TEXT NOT NULL,
  tutor_id TEXT NOT NULL,
  tutor_name TEXT NOT NULL,
  attended_student_ids JSONB DEFAULT '[]'::jsonb,
  attended_student_names JSONB DEFAULT '[]'::jsonb,
  absent_student_ids JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  honor_earned NUMERIC DEFAULT 0,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL TRANSAKSI KEUANGAN (Financial Transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_id TEXT,
  payment_method TEXT DEFAULT 'Tunai',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL SLIP GAJI GURU (Salary Slips)
CREATE TABLE IF NOT EXISTS salary_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id TEXT NOT NULL,
  tutor_name TEXT NOT NULL,
  month_period TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  total_sessions INT DEFAULT 0,
  total_students_taught INT DEFAULT 0,
  session_honor_total NUMERIC DEFAULT 0,
  tunjangan_jabatan NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  total_salary NUMERIC NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'paid')),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  breakdown JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL TAGIHAN SISWA (Weekly Bills - Kamis Due Date)
CREATE TABLE IF NOT EXISTS student_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  parent_name TEXT,
  parent_phone TEXT NOT NULL,
  bimbel_type TEXT NOT NULL,
  week_period TEXT NOT NULL,
  due_date DATE NOT NULL,
  attendance_count INT DEFAULT 0,
  rate_per_day NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  paid_at TIMESTAMPTZ,
  receipt_number TEXT UNIQUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PENGATURAN HARGA BIMBEL
CREATE TABLE IF NOT EXISTS bimbel_settings (
  id INT PRIMARY KEY DEFAULT 1,
  bimbel_name TEXT DEFAULT 'Bimbel Prestasi Cerdas',
  tagline TEXT DEFAULT 'Membimbing Prestasi, Meraih Cita-Cita',
  address TEXT DEFAULT 'Jl. Pendidikan No. 45, Kompleks Pelajar',
  phone TEXT DEFAULT '081234567890',
  kelompok_price NUMERIC DEFAULT 20000,
  privat3_price NUMERIC DEFAULT 45000,
  privat1_price NUMERIC DEFAULT 75000,
  home_visit_price NUMERIC DEFAULT 100000,
  tutor_base_rate NUMERIC DEFAULT 9000,
  tutor_increment_per_student NUMERIC DEFAULT 1000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) - Buka akses anon untuk API Key
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bimbel_settings ENABLE ROW LEVEL SECURITY;

-- Buat policy publik anon untuk kemudahan koneksi aplikasi
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users', 'students', 'tutors', 'schedules', 'attendance', 'transactions', 'salary_slips', 'student_bills', 'bimbel_settings'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "Public access on %I" ON %I FOR ALL USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;
`;
