import React, { useState, useEffect } from 'react';
import {
  Student,
  Tutor,
  ScheduleItem,
  AttendanceRecord,
  FinancialTransaction,
  StudentBill,
  SalarySlip,
  BimbelPricingSettings,
  UserAccount,
  UserRole,
} from './types/bimbel';
import { BimbelService } from './services/bimbelStorage';
import { Navbar } from './components/Navbar';
import { Navigation, NavTabId } from './components/Navigation';
import { SupabaseModal } from './components/SupabaseModal';
import { LoginModal } from './components/LoginModal';
import { OverviewModule } from './components/modules/OverviewModule';
import { SiswaModule } from './components/modules/SiswaModule';
import { GuruModule } from './components/modules/GuruModule';
import { JadwalModule } from './components/modules/JadwalModule';
import { AbsensiModule } from './components/modules/AbsensiModule';
import { KeuanganModule } from './components/modules/KeuanganModule';
import { TagihanModule } from './components/modules/TagihanModule';
import { PenggajianModule } from './components/modules/PenggajianModule';
import { PengaturanModule } from './components/modules/PengaturanModule';
import { AlertCircle } from 'lucide-react';

// Strict Role-Based Tab Permission Helper
export const isTabAllowedForRole = (tab: NavTabId, role: UserRole): boolean => {
  if (role === 'super_admin') return true;
  if (role === 'admin') {
    return ['finance', 'billing', 'attendance', 'students', 'schedules'].includes(tab);
  }
  if (role === 'guru') {
    return ['attendance', 'schedules', 'payroll'].includes(tab);
  }
  return false;
};

// Default Home Tab for each user role
export const getDefaultTabForRole = (role: UserRole): NavTabId => {
  if (role === 'guru') return 'attendance';
  if (role === 'admin') return 'finance';
  return 'overview';
};

export default function App() {
  // Authentication & User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // App Data State
  const [settings, setSettings] = useState<BimbelPricingSettings>(BimbelService.getSettings());
  const [students, setStudents] = useState<Student[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [bills, setBills] = useState<StudentBill[]>([]);
  const [slips, setSlips] = useState<SalarySlip[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');

  // Loading state for on-demand module fetch
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

  // Theme state (Mode Gelap): defaults to true per user request
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('bimbel_theme');
    if (saved !== null) return saved === 'dark';
    return true; // default to dark mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bimbel_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bimbel_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Load initial local data and verify auth
  useEffect(() => {
    const loadedUser = BimbelService.getActiveUser();
    const loadedUsers = BimbelService.getUsers();
    setCurrentUser(loadedUser);
    setUsers(loadedUsers);

    setSettings(BimbelService.getSettings());
    setStudents(BimbelService.getStudents());
    setTutors(BimbelService.getTutors());
    setSchedules(BimbelService.getSchedules());
    setAttendanceRecords(BimbelService.getAttendance());
    setTransactions(BimbelService.getTransactions());
    setBills(BimbelService.getBills());
    setSlips(BimbelService.getSlips());

    if (!loadedUser) {
      setIsLoginModalOpen(true);
    } else {
      setActiveTab(getDefaultTabForRole(loadedUser.role));
    }

    // Connect to Supabase - only fetch settings initially, not all tables
    BimbelService.testSupabaseConnection().then(async (res) => {
      setSupabaseConnected(res.success);
      if (res.success) {
        const syncedSettings = await BimbelService.fetchSettingsFromSupabase();
        if (syncedSettings) setSettings(syncedSettings);
      }
    });
  }, []);

  // On-demand fetch strictly for the active module when tab changes (only if role is authorized)
  useEffect(() => {
    if (!supabaseConnected) return;
    const currentRole = currentUser?.role || 'super_admin';
    if (!isTabAllowedForRole(activeTab, currentRole)) return;

    let isMounted = true;
    const fetchCurrentModule = async () => {
      setLoadingModule(activeTab);
      try {
        switch (activeTab) {
          case 'overview': {
            // Summary for overview only
            const [trxData, stData, tutData] = await Promise.all([
              BimbelService.fetchTransactionsFromSupabase(),
              BimbelService.fetchStudentsFromSupabase(),
              BimbelService.fetchTutorsFromSupabase(),
            ]);
            if (!isMounted) return;
            if (trxData) setTransactions(trxData);
            if (stData) setStudents(stData);
            if (tutData) setTutors(tutData);
            break;
          }
          case 'students': {
            const stData = await BimbelService.fetchStudentsFromSupabase();
            if (!isMounted) return;
            if (stData) setStudents(stData);
            break;
          }
          case 'tutors': {
            const tutData = await BimbelService.fetchTutorsFromSupabase();
            if (!isMounted) return;
            if (tutData) setTutors(tutData);
            break;
          }
          case 'schedules': {
            const [scData, tutData, stData] = await Promise.all([
              BimbelService.fetchSchedulesFromSupabase(),
              BimbelService.fetchTutorsFromSupabase(),
              BimbelService.fetchStudentsFromSupabase(),
            ]);
            if (!isMounted) return;
            if (scData) setSchedules(scData);
            if (tutData) setTutors(tutData);
            if (stData) setStudents(stData);
            break;
          }
          case 'attendance': {
            const [attData, scData, tutData, stData] = await Promise.all([
              BimbelService.fetchAttendanceFromSupabase(),
              BimbelService.fetchSchedulesFromSupabase(),
              BimbelService.fetchTutorsFromSupabase(),
              BimbelService.fetchStudentsFromSupabase(),
            ]);
            if (!isMounted) return;
            if (attData) setAttendanceRecords(attData);
            if (scData) setSchedules(scData);
            if (tutData) setTutors(tutData);
            if (stData) setStudents(stData);
            break;
          }
          case 'finance': {
            const trxData = await BimbelService.fetchTransactionsFromSupabase();
            if (!isMounted) return;
            if (trxData) setTransactions(trxData);
            break;
          }
          case 'billing': {
            const [billsData, stData, attData] = await Promise.all([
              BimbelService.fetchBillsFromSupabase(),
              BimbelService.fetchStudentsFromSupabase(),
              BimbelService.fetchAttendanceFromSupabase(),
            ]);
            if (!isMounted) return;
            if (billsData) setBills(billsData);
            if (stData) setStudents(stData);
            if (attData) setAttendanceRecords(attData);
            break;
          }
          case 'payroll': {
            const [slipsData, tutData, attData] = await Promise.all([
              BimbelService.fetchSlipsFromSupabase(),
              BimbelService.fetchTutorsFromSupabase(),
              BimbelService.fetchAttendanceFromSupabase(),
            ]);
            if (!isMounted) return;
            if (slipsData) setSlips(slipsData);
            if (tutData) setTutors(tutData);
            if (attData) setAttendanceRecords(attData);
            break;
          }
          case 'settings': {
            const settData = await BimbelService.fetchSettingsFromSupabase();
            if (!isMounted) return;
            if (settData) setSettings(settData);
            break;
          }
        }
      } catch (err) {
        console.error(`Error loading data for module ${activeTab}:`, err);
      } finally {
        if (isMounted) setLoadingModule(null);
      }
    };

    fetchCurrentModule();
    return () => {
      isMounted = false;
    };
  }, [activeTab, supabaseConnected, currentUser?.role]);

  // Role switch handler
  const handleSelectUser = (user: UserAccount) => {
    setCurrentUser(user);
    BimbelService.setActiveUser(user);
    setActiveTab(getDefaultTabForRole(user.role));
  };

  const handleLogout = () => {
    BimbelService.setActiveUser(null);
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  // CRUD Handlers with Live Supabase sync
  const handleSaveStudent = (student: Student) => {
    const exists = students.some((s) => s.id === student.id);
    let updated: Student[];
    if (exists) {
      updated = students.map((s) => (s.id === student.id ? student : s));
    } else {
      updated = [student, ...students];
    }
    setStudents(updated);
    BimbelService.saveStudents(updated);
    BimbelService.saveStudentSync(student);
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    BimbelService.saveStudents(updated);
    BimbelService.deleteStudentSync(studentId);
  };

  const handleSaveTutor = (tutor: Tutor) => {
    const exists = tutors.some((t) => t.id === tutor.id);
    let updated: Tutor[];
    if (exists) {
      updated = tutors.map((t) => (t.id === tutor.id ? tutor : t));
    } else {
      updated = [...tutors, tutor];
    }
    setTutors(updated);
    BimbelService.saveTutors(updated);
    BimbelService.saveTutorSync(tutor);
  };

  const handleDeleteTutor = (tutorId: string) => {
    const updated = tutors.filter((t) => t.id !== tutorId);
    setTutors(updated);
    BimbelService.saveTutors(updated);
    BimbelService.deleteTutorSync(tutorId);
  };

  const handleSaveSchedule = (schedule: ScheduleItem) => {
    const exists = schedules.some((s) => s.id === schedule.id);
    let updated: ScheduleItem[];
    if (exists) {
      updated = schedules.map((s) => (s.id === schedule.id ? schedule : s));
    } else {
      updated = [schedule, ...schedules];
    }
    setSchedules(updated);
    BimbelService.saveSchedules(updated);
    BimbelService.saveScheduleSync(schedule);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const updated = schedules.filter((s) => s.id !== scheduleId);
    setSchedules(updated);
    BimbelService.saveSchedules(updated);
    BimbelService.deleteScheduleSync(scheduleId);
  };

  const handleSaveAttendance = (record: AttendanceRecord) => {
    const exists = attendanceRecords.some((a) => a.id === record.id);
    let updated: AttendanceRecord[];
    if (exists) {
      updated = attendanceRecords.map((a) => (a.id === record.id ? record : a));
    } else {
      updated = [record, ...attendanceRecords];
    }
    setAttendanceRecords(updated);
    BimbelService.saveAttendance(updated);
    BimbelService.saveAttendanceSync(record);
  };

  const handleDeleteAttendance = (recordId: string) => {
    const updated = attendanceRecords.filter((a) => a.id !== recordId);
    setAttendanceRecords(updated);
    BimbelService.saveAttendance(updated);
    BimbelService.deleteAttendanceSync(recordId);
  };

  const handleSaveTransaction = (trx: FinancialTransaction) => {
    const updated = [trx, ...transactions];
    setTransactions(updated);
    BimbelService.saveTransactions(updated);
    BimbelService.saveTransactionSync(trx);
  };

  const handleDeleteTransaction = (trxId: string) => {
    const updated = transactions.filter((t) => t.id !== trxId);
    setTransactions(updated);
    BimbelService.saveTransactions(updated);
    BimbelService.deleteTransactionSync(trxId);
  };

  const handleSaveBill = (bill: StudentBill) => {
    const exists = bills.some((b) => b.id === bill.id);
    let updated: StudentBill[];
    if (exists) {
      updated = bills.map((b) => (b.id === bill.id ? bill : b));
    } else {
      updated = [bill, ...bills];
    }
    setBills(updated);
    BimbelService.saveBills(updated);
    BimbelService.saveBillSync(bill);
  };

  const handleMarkBillPaid = (billId: string, paymentMethod: string) => {
    const target = bills.find((b) => b.id === billId);
    if (!target) return;

    const paidAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedBills = bills.map((b) =>
      b.id === billId
        ? {
            ...b,
            status: 'paid' as const,
            paidAt,
            paymentMethod,
          }
        : b
    );
    setBills(updatedBills);
    BimbelService.saveBills(updatedBills);
    BimbelService.markBillPaidSync(billId, paymentMethod);

    // Automatically record income transaction
    const newTrx: FinancialTransaction = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'pemasukan',
      category: 'Tagihan Bimbel',
      amount: target.totalAmount,
      description: `Pelunasan Tagihan: ${target.studentName} (${target.receiptNumber})`,
      paymentMethod: paymentMethod as any,
      referenceId: target.id,
      createdBy: currentUser?.username || 'admin',
    };
    handleSaveTransaction(newTrx);
  };

  const handleDeleteBill = (billId: string) => {
    const updated = bills.filter((b) => b.id !== billId);
    setBills(updated);
    BimbelService.saveBills(updated);
    BimbelService.deleteBillSync(billId);
  };

  const handleSaveSlip = (slip: SalarySlip) => {
    const exists = slips.some((s) => s.id === slip.id);
    let updated: SalarySlip[];
    if (exists) {
      updated = slips.map((s) => (s.id === slip.id ? slip : s));
    } else {
      updated = [slip, ...slips];
    }
    setSlips(updated);
    BimbelService.saveSlips(updated);
    BimbelService.saveSalarySlipSync(slip);
  };

  const handleDeleteSlip = (slipId: string) => {
    const updated = slips.filter((s) => s.id !== slipId);
    setSlips(updated);
    BimbelService.saveSlips(updated);
    BimbelService.deleteSalarySlipSync(slipId);
  };

  const handlePaySalary = (slipId: string) => {
    const target = slips.find((s) => s.id === slipId);
    if (!target) return;

    const paidAt = new Date().toISOString().split('T')[0];
    const updatedSlips = slips.map((s) =>
      s.id === slipId
        ? {
            ...s,
            status: 'paid' as const,
            paidAt,
          }
        : s
    );
    setSlips(updatedSlips);
    BimbelService.saveSlips(updatedSlips);
    BimbelService.markSalarySlipPaidSync(slipId, paidAt);

    // Automatically record expense transaction
    const newTrx: FinancialTransaction = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: paidAt,
      type: 'pengeluaran',
      category: 'Gaji Guru',
      amount: target.totalSalary,
      description: `Pencairan Gaji Guru: ${target.tutorName} (${target.monthPeriod})`,
      paymentMethod: 'Transfer Bank',
      referenceId: target.id,
      createdBy: currentUser?.username || 'superadmin',
    };
    handleSaveTransaction(newTrx);
  };

  const handleSaveSettings = (newSettings: BimbelPricingSettings) => {
    setSettings(newSettings);
    BimbelService.saveSettings(newSettings);
    BimbelService.saveSettingsSync(newSettings);
  };

  const role = currentUser?.role || 'super_admin';

  // Guard activeTab against unauthorized access per role
  useEffect(() => {
    if (!isTabAllowedForRole(activeTab, role)) {
      setActiveTab(getDefaultTabForRole(role));
    }
  }, [activeTab, role]);

  // Identify current tutor record for guru account
  const currentTutor = tutors.find(
    (t) =>
      (currentUser?.tutorId && t.id === currentUser.tutorId) ||
      (t.accountUsername &&
        currentUser?.username &&
        t.accountUsername.toLowerCase() === currentUser.username.toLowerCase()) ||
      t.name.toLowerCase() === currentUser?.name?.toLowerCase() ||
      t.name.toLowerCase() === currentUser?.username?.toLowerCase()
  );
  const currentTutorId = currentUser?.tutorId || currentTutor?.id;
  const currentTutorName = currentTutor?.name || currentUser?.name || currentUser?.username;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-20 md:pb-8">
      {/* Navbar with brand, role switcher, dark mode toggle, and database status */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onLogoClick={() => setActiveTab(getDefaultTabForRole(role))}
        supabaseConnected={supabaseConnected}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Navigation (Tabs for Desktop, Bottom Bar for Mobile) */}
      <Navigation
        currentRole={role}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (isTabAllowedForRole(tab, role)) {
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Module Router based on activeTab and Strict Role Access */}
        {activeTab === 'overview' && role === 'super_admin' && (
          <OverviewModule
            currentUser={currentUser}
            students={students}
            tutors={tutors}
            attendanceRecords={attendanceRecords}
            transactions={transactions}
            bills={bills}
            schedules={schedules}
            onNavigateTab={(tab) => {
              if (isTabAllowedForRole(tab, role)) {
                setActiveTab(tab);
              }
            }}
          />
        )}

        {activeTab === 'students' && (role === 'super_admin' || role === 'admin') && (
          <SiswaModule
            students={students}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            userRole={role}
          />
        )}

        {activeTab === 'tutors' && role === 'super_admin' && (
          <GuruModule
            tutors={tutors}
            onSaveTutor={handleSaveTutor}
            onDeleteTutor={handleDeleteTutor}
            userRole={role}
          />
        )}

        {activeTab === 'schedules' && isTabAllowedForRole('schedules', role) && (
          <JadwalModule
            schedules={
              role === 'guru'
                ? schedules.filter(
                    (s) =>
                      (currentTutorId && s.tutorId === currentTutorId) ||
                      (currentTutorName &&
                        s.tutorName?.toLowerCase() === currentTutorName.toLowerCase())
                  )
                : schedules
            }
            students={students}
            tutors={tutors}
            sessions={settings.sessions}
            onSaveSchedule={handleSaveSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            userRole={role}
            currentTutorId={currentTutorId}
            currentTutorName={currentTutorName}
          />
        )}

        {activeTab === 'attendance' && isTabAllowedForRole('attendance', role) && (
          <AbsensiModule
            attendanceRecords={
              role === 'guru'
                ? attendanceRecords.filter(
                    (r) =>
                      (currentTutorId && r.tutorId === currentTutorId) ||
                      (currentTutorName &&
                        r.tutorName?.toLowerCase() === currentTutorName.toLowerCase())
                  )
                : attendanceRecords
            }
            schedules={
              role === 'guru'
                ? schedules.filter(
                    (s) =>
                      (currentTutorId && s.tutorId === currentTutorId) ||
                      (currentTutorName &&
                        s.tutorName?.toLowerCase() === currentTutorName.toLowerCase())
                  )
                : schedules
            }
            students={students}
            tutors={tutors}
            sessions={settings.sessions}
            onSaveAttendance={handleSaveAttendance}
            onDeleteAttendance={handleDeleteAttendance}
            userRole={role}
            currentUsername={currentUser?.username || 'guru'}
            currentTutorId={currentTutorId}
            currentTutorName={currentTutorName}
          />
        )}

        {activeTab === 'finance' && (role === 'super_admin' || role === 'admin') && (
          <KeuanganModule
            transactions={transactions}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            userRole={role}
            currentUsername={currentUser?.username || 'admin'}
          />
        )}

        {activeTab === 'billing' && (role === 'super_admin' || role === 'admin') && (
          <TagihanModule
            bills={bills}
            students={students}
            attendanceRecords={attendanceRecords}
            settings={settings}
            onSaveBill={handleSaveBill}
            onMarkPaid={handleMarkBillPaid}
            onDeleteBill={handleDeleteBill}
            userRole={role}
          />
        )}

        {activeTab === 'payroll' && (role === 'super_admin' || role === 'guru') && (
          <PenggajianModule
            slips={
              role === 'guru'
                ? slips.filter(
                    (s) =>
                      (currentTutorId && s.tutorId === currentTutorId) ||
                      (currentTutorName &&
                        s.tutorName?.toLowerCase() === currentTutorName.toLowerCase())
                  )
                : slips
            }
            tutors={tutors}
            attendanceRecords={
              role === 'guru'
                ? attendanceRecords.filter(
                    (r) =>
                      (currentTutorId && r.tutorId === currentTutorId) ||
                      (currentTutorName &&
                        r.tutorName?.toLowerCase() === currentTutorName.toLowerCase())
                  )
                : attendanceRecords
            }
            settings={settings}
            onSaveSlip={handleSaveSlip}
            onPaySalary={handlePaySalary}
            onDeleteSlip={handleDeleteSlip}
            onUpdateAttendance={handleSaveAttendance}
            userRole={role}
            currentTutorId={currentTutorId}
            currentTutorName={currentTutorName}
          />
        )}

        {activeTab === 'settings' && role === 'super_admin' && (
          <PengaturanModule
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onOpenSupabase={() => setIsSupabaseModalOpen(true)}
            userRole={role}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}

        {/* Fallback if user lands on unauthorized tab */}
        {!isTabAllowedForRole(activeTab, role) && (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Akses Dibatasi</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Halaman ini hanya dapat diakses oleh role yang berwenang. Anda dialihkan ke beranda akun Anda.
            </p>
            <button
              onClick={() => setActiveTab(getDefaultTabForRole(role))}
              className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Kembali ke Beranda
            </button>
          </div>
        )}
      </main>

      {/* Floating on-demand module sync indicator */}
      {loadingModule && (
        <div className="fixed bottom-16 md:bottom-5 right-4 z-40 bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-3.5 py-2 rounded-full shadow-xl flex items-center space-x-2 border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium">Memuat data modul {loadingModule}...</span>
        </div>
      )}

      {/* Supabase Connection & SQL Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChange={(conn) => setSupabaseConnected(conn)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={(user) => {
          handleSelectUser(user);
          setIsLoginModalOpen(false);
        }}
        users={users}
      />
    </div>
  );
}
