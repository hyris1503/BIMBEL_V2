import {
  AttendanceRecord,
  BimbelPricingSettings,
  FinancialTransaction,
  SalarySlip,
  ScheduleItem,
  Student,
  StudentBill,
  Tutor,
  UserAccount,
} from '../types/bimbel';
import { getSupabaseClient } from '../lib/supabase';

export const DEFAULT_SESSIONS = [
  { id: 1, name: 'Sesi 1', time: '13:30 - 14:45' },
  { id: 2, name: 'Sesi 2', time: '15:00 - 16:15' },
  { id: 3, name: 'Sesi 3', time: '16:30 - 17:45' },
  { id: 4, name: 'Sesi 4', time: '18:30 - 19:45' },
  { id: 5, name: 'Sesi 5', time: '20:00 - 21:15' },
];

export const DEFAULT_SETTINGS: BimbelPricingSettings = {
  bimbelName: 'BimbelSmart',
  tagline: 'Sistem Terpadu Bimbingan Belajar',
  address: 'Jl. Pendidikan No. 42',
  phone: '081234567890',
  kelompokPrice: 20000,
  privat3Price: 45000,
  privat1Price: 75000,
  homeVisitPrice: 100000,
  tutorBaseRate: 9000,
  tutorIncrementPerStudent: 1000,
  maxStudentsKelompok: 6,
  sessions: DEFAULT_SESSIONS,
};

// Pure authentic users for real role login
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'superadmin',
    name: 'Super Administrator',
    role: 'super_admin',
    phone: '081234567801',
    email: 'superadmin@bimbel.com',
    password: 'password123',
  },
  {
    id: 'USR-002',
    username: 'admin',
    name: 'Admin Operasional & Keuangan',
    role: 'admin',
    phone: '081234567802',
    email: 'admin@bimbel.com',
    password: 'password123',
  },
  {
    id: 'USR-003',
    username: 'guru',
    name: 'Guru Pengajar',
    role: 'guru',
    phone: '081298765401',
    email: 'guru@bimbel.com',
    password: 'password123',
    tutorId: 'GRU-001',
  },
];

// Clean empty lists - NO dummy data
export const INITIAL_TUTORS: Tutor[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_SCHEDULES: ScheduleItem[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];
export const INITIAL_BILLS: StudentBill[] = [];
export const INITIAL_SALARY_SLIPS: SalarySlip[] = [];

export function calculateTutorHonor(
  studentCount: number,
  baseRate = 9000,
  increment = 1000,
  maxStudents = 6
): number {
  if (studentCount <= 0) return 0;
  const effectiveCount = Math.min(studentCount, maxStudents);
  return baseRate + (effectiveCount - 1) * increment;
}

const KEYS = {
  USERS: 'bimbel_clean_users_v2',
  STUDENTS: 'bimbel_clean_students_v2',
  TUTORS: 'bimbel_clean_tutors_v2',
  SCHEDULES: 'bimbel_clean_schedules_v2',
  ATTENDANCE: 'bimbel_clean_attendance_v2',
  TRANSACTIONS: 'bimbel_clean_transactions_v2',
  BILLS: 'bimbel_clean_bills_v2',
  SLIPS: 'bimbel_clean_slips_v2',
  SETTINGS: 'bimbel_clean_settings_v2',
  CURRENT_USER: 'bimbel_clean_active_user_v2',
};

export function isUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function ensureUUID(id?: string): string {
  if (id && isUUID(id)) {
    return id;
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class BimbelService {
  // Sync all data from Supabase
  static async syncAllFromSupabase(): Promise<{
    users: UserAccount[];
    students: Student[];
    tutors: Tutor[];
    schedules: ScheduleItem[];
    attendance: AttendanceRecord[];
    transactions: FinancialTransaction[];
    bills: StudentBill[];
    slips: SalarySlip[];
    settings: BimbelPricingSettings;
  } | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      // 1. Settings
      let settings = BimbelService.getSettings();
      const { data: setRows } = await client.from('bimbel_settings').select('*').limit(1);
      if (setRows && setRows.length > 0) {
        const s = setRows[0];
        settings = {
          ...settings,
          bimbelName: s.bimbel_name || settings.bimbelName,
          tagline: s.tagline || settings.tagline,
          address: s.address || settings.address,
          phone: s.phone || settings.phone,
          kelompokPrice: Number(s.kelompok_price ?? settings.kelompokPrice),
          privat3Price: Number(s.privat3_price ?? settings.privat3Price),
          privat1Price: Number(s.privat1_price ?? settings.privat1Price),
          homeVisitPrice: Number(s.home_visit_price ?? settings.homeVisitPrice),
          tutorBaseRate: Number(s.tutor_base_rate ?? settings.tutorBaseRate),
          tutorIncrementPerStudent: Number(
            s.tutor_increment_per_student ?? settings.tutorIncrementPerStudent
          ),
        };
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      }

      // 2. Users
      let users = BimbelService.getUsers();
      const { data: userRows } = await client.from('users').select('*');
      if (userRows && userRows.length > 0) {
        users = userRows.map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          phone: u.phone || '',
          email: u.email || '',
          password: u.password,
          tutorId: u.tutor_id,
        }));
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      }

      // 3. Students
      let students: Student[] = [];
      const { data: stRows } = await client
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (stRows) {
        students = stRows.map((s: any) => ({
          id: s.id,
          name: s.name,
          bimbelType: s.bimbel_type,
          parentName: s.parent_name || '',
          parentPhone: s.parent_phone,
          grade: s.grade,
          address: s.address || '',
          status: s.status,
          joinedAt: s.joined_at,
          notes: s.notes,
        }));
        localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
      }

      // 4. Tutors
      let tutors: Tutor[] = [];
      const { data: tutRows } = await client.from('tutors').select('*');
      if (tutRows) {
        tutors = tutRows.map((t: any) => ({
          id: t.id,
          name: t.name,
          phone: t.phone,
          tunjanganJabatan: Number(t.tunjangan_jabatan || 0),
          tunjanganKehadiran: Number(t.tunjangan_kehadiran || 0),
          transport: Number(t.transport || t.default_bonus || 0),
          status: t.status,
          accountUsername: t.account_username,
        }));
        localStorage.setItem(KEYS.TUTORS, JSON.stringify(tutors));
      }

      // 5. Schedules
      let schedules: ScheduleItem[] = [];
      const { data: scRows } = await client.from('schedules').select('*');
      if (scRows) {
        schedules = scRows.map((sc: any) => ({
          id: sc.id,
          day: sc.day,
          sessionId: sc.session_id,
          sessionTime: sc.session_time,
          bimbelType: sc.bimbel_type,
          tutorId: sc.tutor_id,
          tutorName: sc.tutor_name,
          studentIds: sc.student_ids || [],
          studentNames: sc.student_names || [],
        }));
        localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
      }

      // 6. Attendance
      let attendance: AttendanceRecord[] = [];
      const { data: attRows } = await client
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });
      if (attRows) {
        attendance = attRows.map((a: any) => ({
          id: a.id,
          date: a.date,
          day: a.day,
          sessionId: a.session_id,
          sessionTime: a.session_time,
          bimbelType: a.bimbel_type,
          tutorId: a.tutor_id,
          tutorName: a.tutor_name,
          attendedStudentIds: a.attended_student_ids || [],
          attendedStudentNames: a.attended_student_names || [],
          absentStudentIds: a.absent_student_ids || [],
          notes: a.notes,
          honorEarned: Number(a.honor_earned || 0),
          submittedBy: a.submitted_by,
          createdAt: a.created_at,
        }));
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(attendance));
      }

      // 7. Transactions
      let transactions: FinancialTransaction[] = [];
      const { data: trxRows } = await client
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (trxRows) {
        transactions = trxRows.map((tr: any) => ({
          id: tr.id,
          date: tr.date,
          type: tr.type,
          category: tr.category,
          amount: Number(tr.amount),
          description: tr.description,
          referenceId: tr.reference_id,
          paymentMethod: tr.payment_method,
          createdBy: tr.created_by,
        }));
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }

      // 8. Bills
      let bills: StudentBill[] = [];
      const { data: bRows } = await client
        .from('student_bills')
        .select('*')
        .order('created_at', { ascending: false });
      if (bRows) {
        bills = bRows.map((b: any) => ({
          id: b.id,
          studentId: b.student_id,
          studentName: b.student_name,
          parentName: b.parent_name,
          parentPhone: b.parent_phone,
          bimbelType: b.bimbel_type,
          weekPeriod: b.week_period,
          dueDate: b.due_date,
          attendanceCount: b.attendance_count,
          ratePerDay: Number(b.rate_per_day),
          totalAmount: Number(b.total_amount),
          status: b.status,
          paidAt: b.paid_at,
          receiptNumber: b.receipt_number,
          notes: b.notes,
        }));
        localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
      }

      // 9. Salary Slips
      let slips: SalarySlip[] = [];
      const { data: slRows } = await client
        .from('salary_slips')
        .select('*')
        .order('created_at', { ascending: false });
      if (slRows) {
        slips = slRows.map((sl: any) => ({
          id: sl.id,
          tutorId: sl.tutor_id,
          tutorName: sl.tutor_name,
          monthPeriod: sl.month_period,
          startDate: sl.start_date,
          endDate: sl.end_date,
          totalSessions: sl.total_sessions,
          totalStudentsTaught: sl.total_students_taught,
          sessionHonorTotal: Number(sl.session_honor_total),
          tunjanganJabatan: Number(sl.tunjangan_jabatan),
          tunjanganKehadiran: Number(sl.tunjangan_kehadiran || 0),
          transport: Number(sl.transport || sl.bonus || 0),
          deductions: Number(sl.deductions),
          totalSalary: Number(sl.total_salary),
          status: sl.status,
          paidAt: sl.paid_at,
          notes: sl.notes,
          breakdown: sl.breakdown || [],
        }));
        localStorage.setItem(KEYS.SLIPS, JSON.stringify(slips));
      }

      return {
        users,
        students,
        tutors,
        schedules,
        attendance,
        transactions,
        bills,
        slips,
        settings,
      };
    } catch (err) {
      console.error('Error syncing with Supabase:', err);
      return null;
    }
  }

  // --- Real-time Mutations with Supabase Sync ---

  static async saveStudentSync(student: Student) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('students').upsert({
          id: student.id,
          name: student.name,
          bimbel_type: student.bimbelType,
          parent_name: student.parentName,
          parent_phone: student.parentPhone,
          grade: student.grade,
          address: student.address,
          status: student.status,
          joined_at: student.joinedAt,
          notes: student.notes,
        });
      } catch (e) {
        console.error('Supabase save student error:', e);
      }
    }
  }

  static async deleteStudentSync(studentId: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('students').delete().eq('id', studentId);
      } catch (e) {
        console.error('Supabase delete student error:', e);
      }
    }
  }

  static async saveTutorSync(tutor: Tutor) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('tutors').upsert({
          id: tutor.id,
          name: tutor.name,
          phone: tutor.phone,
          subject: 'Pengajar',
          tunjangan_jabatan: tutor.tunjanganJabatan,
          default_bonus: tutor.transport,
          status: tutor.status,
          account_username: tutor.accountUsername,
        });
      } catch (e) {
        console.error('Supabase save tutor error:', e);
      }
    }
  }

  static async deleteTutorSync(tutorId: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('tutors').delete().eq('id', tutorId);
      } catch (e) {
        console.error('Supabase delete tutor error:', e);
      }
    }
  }

  static async saveScheduleSync(schedule: ScheduleItem) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const validId = ensureUUID(schedule.id);
        schedule.id = validId;
        const payload: any = {
          id: validId,
          day: schedule.day,
          session_id: schedule.sessionId,
          session_time: schedule.sessionTime,
          bimbel_type: schedule.bimbelType,
          tutor_id: schedule.tutorId,
          tutor_name: schedule.tutorName,
          student_ids: schedule.studentIds,
          student_names: schedule.studentNames,
        };
        await client.from('schedules').upsert(payload);
      } catch (e) {
        console.error('Supabase save schedule error:', e);
      }
    }
  }

  static async deleteScheduleSync(scheduleId: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        if (isUUID(scheduleId)) {
          await client.from('schedules').delete().eq('id', scheduleId);
        } else {
          // If legacy non-uuid ID, try deleting by id anyway or fallback
          await client.from('schedules').delete().filter('id', 'eq', scheduleId);
        }
      } catch (e) {
        console.error('Supabase delete schedule error:', e);
      }
    }
  }

  static async saveAttendanceSync(rec: AttendanceRecord) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const validId = ensureUUID(rec.id);
        rec.id = validId;
        const payload: any = {
          id: validId,
          date: rec.date,
          day: rec.day,
          session_id: rec.sessionId,
          session_time: rec.sessionTime,
          bimbel_type: rec.bimbelType,
          tutor_id: rec.tutorId,
          tutor_name: rec.tutorName,
          attended_student_ids: rec.attendedStudentIds,
          attended_student_names: rec.attendedStudentNames,
          absent_student_ids: rec.absentStudentIds,
          notes: rec.notes,
          honor_earned: rec.honorEarned,
          submitted_by: rec.submittedBy,
        };
        await client.from('attendance').upsert(payload);
      } catch (e) {
        console.error('Supabase save attendance error:', e);
      }
    }
  }

  static async deleteAttendanceSync(recId: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        if (isUUID(recId)) {
          await client.from('attendance').delete().eq('id', recId);
        } else {
          await client.from('attendance').delete().filter('id', 'eq', recId);
        }
      } catch (e) {
        console.error('Supabase delete attendance error:', e);
      }
    }
  }

  static async saveTransactionSync(trx: FinancialTransaction) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const validId = ensureUUID(trx.id);
        trx.id = validId;
        const payload: any = {
          id: validId,
          date: trx.date,
          type: trx.type,
          category: trx.category,
          amount: trx.amount,
          description: trx.description,
          payment_method: trx.paymentMethod,
          reference_id: trx.referenceId,
          created_by: trx.createdBy || 'admin',
        };
        await client.from('transactions').upsert(payload);
      } catch (e) {
        console.error('Supabase save transaction error:', e);
      }
    }
  }

  static async deleteTransactionSync(trxId: string, description?: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        if (isUUID(trxId)) {
          await client.from('transactions').delete().eq('id', trxId);
        } else if (description) {
          await client.from('transactions').delete().eq('description', description);
        } else {
          await client.from('transactions').delete().filter('id', 'eq', trxId);
        }
      } catch (e) {
        console.error('Supabase delete transaction error:', e);
      }
    }
  }

  static async saveBillSync(bill: StudentBill) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const validId = ensureUUID(bill.id);
        bill.id = validId;
        const payload: any = {
          id: validId,
          student_id: bill.studentId,
          student_name: bill.studentName,
          parent_name: bill.parentName,
          parent_phone: bill.parentPhone,
          bimbel_type: bill.bimbelType,
          week_period: bill.weekPeriod,
          due_date: bill.dueDate,
          attendance_count: bill.attendanceCount,
          rate_per_day: bill.ratePerDay,
          total_amount: bill.totalAmount,
          status: bill.status,
          paid_at: bill.paidAt,
          receipt_number: bill.receiptNumber,
          notes: bill.notes,
        };
        await client.from('student_bills').upsert(payload, { onConflict: 'receipt_number' });
      } catch (e) {
        console.error('Supabase save bill error:', e);
      }
    }
  }

  static async deleteBillSync(billId: string, receiptNumber?: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        if (isUUID(billId)) {
          await client.from('student_bills').delete().eq('id', billId);
        } else if (receiptNumber) {
          await client.from('student_bills').delete().eq('receipt_number', receiptNumber);
        } else {
          await client.from('student_bills').delete().filter('id', 'eq', billId);
        }
      } catch (e) {
        console.error('Supabase delete bill error:', e);
      }
    }
  }

  static async markBillPaidSync(billId: string, paymentMethod: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client
          .from('student_bills')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', billId);
      } catch (e) {
        console.error('Supabase mark bill paid error:', e);
      }
    }
  }

  static async saveSalarySlipSync(slip: SalarySlip) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const validId = ensureUUID(slip.id);
        slip.id = validId;
        const payload: any = {
          id: validId,
          tutor_id: slip.tutorId,
          tutor_name: slip.tutorName,
          month_period: slip.monthPeriod,
          start_date: slip.startDate,
          end_date: slip.endDate,
          total_sessions: slip.totalSessions,
          total_students_taught: slip.totalStudentsTaught,
          session_honor_total: slip.sessionHonorTotal,
          tunjangan_jabatan: slip.tunjanganJabatan,
          bonus: slip.transport,
          deductions: slip.deductions,
          total_salary: slip.totalSalary,
          status: slip.status,
          paid_at: slip.paidAt,
          notes: slip.notes,
          breakdown: slip.breakdown,
        };
        await client.from('salary_slips').upsert(payload);
      } catch (e) {
        console.error('Supabase save slip error:', e);
      }
    }
  }

  static async deleteSalarySlipSync(slipId: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        if (isUUID(slipId)) {
          await client.from('salary_slips').delete().eq('id', slipId);
        } else {
          await client.from('salary_slips').delete().filter('id', 'eq', slipId);
        }
      } catch (e) {
        console.error('Supabase delete salary slip error:', e);
      }
    }
  }

  static async markSalarySlipPaidSync(slipId: string, paidAt: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client
          .from('salary_slips')
          .update({
            status: 'paid',
            paid_at: paidAt,
          })
          .eq('id', slipId);
      } catch (e) {
        console.error('Supabase mark salary paid error:', e);
      }
    }
  }

  static async saveSettingsSync(settings: BimbelPricingSettings) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('bimbel_settings').upsert({
          id: 1,
          bimbel_name: settings.bimbelName,
          tagline: settings.tagline,
          address: settings.address,
          phone: settings.phone,
          kelompok_price: settings.kelompokPrice,
          privat3_price: settings.privat3Price,
          privat1_price: settings.privat1Price,
          home_visit_price: settings.homeVisitPrice,
          tutor_base_rate: settings.tutorBaseRate,
          tutor_increment_per_student: settings.tutorIncrementPerStudent,
        });
      } catch (e) {
        console.error('Supabase save settings error:', e);
      }
    }
  }

  // --- LocalStorage Read/Write ---

  static getSettings(): BimbelPricingSettings {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: BimbelPricingSettings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    BimbelService.saveSettingsSync(settings);
  }

  static getUsers(): UserAccount[] {
    const raw = localStorage.getItem(KEYS.USERS);
    if (!raw) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  }

  static saveUsers(users: UserAccount[]) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  static getActiveUser(): UserAccount | null {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setActiveUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }

  static getStudents(): Student[] {
    const raw = localStorage.getItem(KEYS.STUDENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveStudents(students: Student[]) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  }

  static getTutors(): Tutor[] {
    const raw = localStorage.getItem(KEYS.TUTORS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveTutors(tutors: Tutor[]) {
    localStorage.setItem(KEYS.TUTORS, JSON.stringify(tutors));
  }

  static getSchedules(): ScheduleItem[] {
    const raw = localStorage.getItem(KEYS.SCHEDULES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveSchedules(schedules: ScheduleItem[]) {
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
  }

  static getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(KEYS.ATTENDANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveAttendance(records: AttendanceRecord[]) {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  }

  static getTransactions(): FinancialTransaction[] {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveTransactions(transactions: FinancialTransaction[]) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static getBills(): StudentBill[] {
    const raw = localStorage.getItem(KEYS.BILLS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveBills(bills: StudentBill[]) {
    localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
  }

  static getSlips(): SalarySlip[] {
    const raw = localStorage.getItem(KEYS.SLIPS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveSlips(slips: SalarySlip[]) {
    localStorage.setItem(KEYS.SLIPS, JSON.stringify(slips));
  }

  static resetToDefault() {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(KEYS.TUTORS, JSON.stringify([]));
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify([]));
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.BILLS, JSON.stringify([]));
    localStorage.setItem(KEYS.SLIPS, JSON.stringify([]));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.removeItem(KEYS.CURRENT_USER);
  }

  static async testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'URL atau Anon Key Supabase belum diisi' };
    }
    try {
      const { error } = await client.from('students').select('id').limit(1);
      if (error) {
        return { success: false, message: `Koneksi gagal: ${error.message}` };
      }
      return { success: true, message: 'Tersambung ke Supabase! Database bimbel aktif & terhubung.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menghubungi server Supabase' };
    }
  }
}
