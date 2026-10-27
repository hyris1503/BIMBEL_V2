export type UserRole = 'super_admin' | 'admin' | 'guru';

export type BimbelType = 'Kelompok' | 'Privat 3' | 'Privat 1' | 'Home Visit';

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  password?: string;
  tutorId?: string; // If role is 'guru'
}

export interface Student {
  id: string;
  name: string;
  bimbelType: BimbelType;
  parentPhone: string;
  parentName: string;
  grade: string;
  address: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  notes?: string;
}

export interface Tutor {
  id: string; // e.g. GRU-001
  name: string;
  phone: string;
  tunjanganJabatan: number; // custom tunjangan jabatan
  tunjanganKehadiran: number; // tunjangan kehadiran
  transport: number; // uang transport
  status: 'active' | 'inactive';
  accountUsername?: string;
}

export interface SessionConfig {
  id: number; // 1 to 5
  name: string;
  time: string; // e.g. "13:30 - 14:45"
}

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  sessionId: number; // 1 to 5
  sessionTime: string;
  bimbelType: BimbelType;
  tutorId: string;
  tutorName: string;
  studentIds: string[];
  studentNames: string[];
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  sessionId: number; // 1 to 5
  sessionTime: string;
  bimbelType: BimbelType;
  tutorId: string;
  tutorName: string;
  attendedStudentIds: string[];
  attendedStudentNames: string[];
  absentStudentIds: string[];
  notes?: string;
  honorEarned: number;
  submittedBy: string;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'pemasukan' | 'pengeluaran';
  category: string;
  amount: number;
  description: string;
  referenceId?: string;
  paymentMethod: 'Tunai' | 'Transfer Bank' | 'QRIS';
  createdBy: string;
}

export interface SalarySlip {
  id: string;
  tutorId: string;
  tutorName: string;
  monthPeriod: string; // e.g. "Oktober 2026"
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalStudentsTaught: number;
  sessionHonorTotal: number;
  tunjanganJabatan: number;
  tunjanganKehadiran: number;
  transport: number;
  deductions: number;
  totalSalary: number;
  status: 'draft' | 'paid';
  paidAt?: string;
  notes?: string;
  breakdown: Array<{
    date: string;
    day: string;
    sessionId: number;
    studentCount: number;
    honor: number;
  }>;
}

export interface StudentBill {
  id: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  parentName: string;
  bimbelType: BimbelType;
  weekPeriod: string;
  dueDate: string;
  attendanceCount: number;
  ratePerDay: number;
  totalAmount: number;
  status: 'unpaid' | 'paid';
  paidAt?: string;
  paymentMethod?: string;
  receiptNumber: string;
  notes?: string;
}

export interface BimbelPricingSettings {
  bimbelName: string;
  tagline: string;
  address: string;
  phone: string;
  kelompokPrice: number;
  privat3Price: number;
  privat1Price: number;
  homeVisitPrice: number;
  tutorBaseRate: number;
  tutorIncrementPerStudent: number;
  maxStudentsKelompok: number;
  sessions: SessionConfig[];
}
