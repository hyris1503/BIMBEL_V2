import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  User,
  Users,
  Search,
  Trash2,
  Calendar,
  Sparkles,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  AttendanceRecord,
  ScheduleItem,
  Student,
  Tutor,
  UserRole,
  DayOfWeek,
  BimbelType,
  SessionConfig,
} from '../../types/bimbel';
import {
  formatRupiah,
  formatDateIndo,
  getDayNameIndo,
} from '../../utils/formatters';
import {
  calculateTutorHonor,
  DEFAULT_SESSIONS,
} from '../../services/bimbelStorage';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface AbsensiModuleProps {
  attendanceRecords: AttendanceRecord[];
  schedules: ScheduleItem[];
  students: Student[];
  tutors: Tutor[];
  sessions?: SessionConfig[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  onDeleteAttendance?: (recordId: string) => void;
  userRole: UserRole;
  currentUsername: string;
  currentTutorId?: string;
}

export const AbsensiModule: React.FC<AbsensiModuleProps> = ({
  attendanceRecords,
  schedules,
  students,
  tutors,
  sessions,
  onSaveAttendance,
  onDeleteAttendance,
  userRole,
  currentUsername,
  currentTutorId,
}) => {
  const activeSessions = sessions && sessions.length > 0 ? sessions : DEFAULT_SESSIONS;
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'history'>(
    userRole === 'guru' ? 'input' : 'history'
  );

  // Notification message
  const [notification, setNotification] = useState<string | null>(null);
  const [recToDelete, setRecToDelete] = useState<AttendanceRecord | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState<string>(todayStr);

  // Resolve tutor
  const tutorFromUsername = tutors.find(
    (t) =>
      t.id === currentTutorId ||
      t.name.toLowerCase() === currentUsername.toLowerCase()
  );
  const initialTutorId =
    userRole === 'guru'
      ? (currentTutorId || tutorFromUsername?.id || tutors[0]?.id || '')
      : (tutors[0]?.id || '');

  const [formTutorId, setFormTutorId] = useState<string>(initialTutorId);
  const [formSessionId, setFormSessionId] = useState<number>(1);
  const [formBimbelType, setFormBimbelType] = useState<BimbelType>('Kelompok');
  const [formNotes, setFormNotes] = useState<string>('');
  const [presentStudentIds, setPresentStudentIds] = useState<string[]>([]);
  const [absentStudentIds, setAbsentStudentIds] = useState<string[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  // History Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tutorFilter, setTutorFilter] = useState('all');

  const effectiveTutorId = userRole === 'guru' ? initialTutorId : formTutorId;
  const selectedTutor =
    tutors.find((t) => t.id === effectiveTutorId) || tutors[0];
  const dayName = getDayNameIndo(formDate);

  // All schedules belonging strictly to this tutor
  const tutorSchedules = schedules.filter((s) => s.tutorId === effectiveTutorId);

  // Schedules matching selected day and tutor
  const matchingSchedules = tutorSchedules.filter((s) => s.day === dayName);

  // Determine active schedule:
  // 1. Explicitly selected schedule if it matches tutor
  // 2. Schedule matching day and session
  // 3. Fallback to first matching schedule of the day
  const activeSchedule =
    tutorSchedules.find((s) => s.id === selectedScheduleId) ||
    tutorSchedules.find((s) => s.day === dayName && s.sessionId === formSessionId) ||
    matchingSchedules[0] ||
    null;

  // Student IDs scheduled for this session
  const scheduledStudentIds = activeSchedule?.studentIds || [];

  // When activeSchedule changes or is determined, sync form states and students
  useEffect(() => {
    if (activeSchedule) {
      if (selectedScheduleId !== activeSchedule.id) {
        setSelectedScheduleId(activeSchedule.id);
      }
      setFormSessionId(activeSchedule.sessionId);
      setFormBimbelType(activeSchedule.bimbelType);

      // Only include students that are in this schedule
      const validPresent = presentStudentIds.filter((id) =>
        activeSchedule.studentIds.includes(id)
      );
      const validAbsent = absentStudentIds.filter((id) =>
        activeSchedule.studentIds.includes(id)
      );

      // If no students yet marked, default to marking all scheduled students as present
      if (validPresent.length === 0 && validAbsent.length === 0) {
        setPresentStudentIds(activeSchedule.studentIds);
        setAbsentStudentIds([]);
      } else {
        setPresentStudentIds(validPresent);
        setAbsentStudentIds(validAbsent);
      }
    } else {
      setSelectedScheduleId('');
      setPresentStudentIds([]);
      setAbsentStudentIds([]);
    }
  }, [activeSchedule?.id, formDate, effectiveTutorId]);

  // Load students from schedule when clicked
  const handleSelectSchedule = (sched: ScheduleItem) => {
    setSelectedScheduleId(sched.id);
    setFormSessionId(sched.sessionId);
    setFormBimbelType(sched.bimbelType);
    setFormTutorId(sched.tutorId);
    setPresentStudentIds(sched.studentIds);
    setAbsentStudentIds([]);
  };

  const toggleStudentAttendance = (studentId: string) => {
    if (presentStudentIds.includes(studentId)) {
      setPresentStudentIds(presentStudentIds.filter((id) => id !== studentId));
      if (!absentStudentIds.includes(studentId)) {
        setAbsentStudentIds([...absentStudentIds, studentId]);
      }
    } else {
      setPresentStudentIds([...presentStudentIds, studentId]);
      setAbsentStudentIds(absentStudentIds.filter((id) => id !== studentId));
    }
  };

  const handleMarkAllPresent = () => {
    setPresentStudentIds(scheduledStudentIds);
    setAbsentStudentIds([]);
  };

  const handleMarkAllAbsent = () => {
    setAbsentStudentIds(scheduledStudentIds);
    setPresentStudentIds([]);
  };

  // Strictly filter student list: ONLY students scheduled for this tutor & session
  const scheduledStudents = scheduledStudentIds.map((id) => {
    const found = students.find((s) => s.id === id);
    if (found) return found;
    const idx = activeSchedule?.studentIds.indexOf(id) ?? -1;
    const name =
      idx >= 0 && activeSchedule?.studentNames?.[idx]
        ? activeSchedule.studentNames[idx]
        : id;
    return {
      id,
      name,
      bimbelType: activeSchedule?.bimbelType || 'Kelompok',
      parentPhone: '-',
      grade: '-',
      registrationDate: '',
      status: 'active' as const,
    };
  });

  // Live honor calculation in background
  const calculatedHonor = calculateTutorHonor(presentStudentIds.length);

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSchedule) {
      setNotification('Pilih jadwal mengajar yang valid terlebih dahulu.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (scheduledStudents.length === 0) {
      setNotification('Jadwal ini belum memiliki siswa terdaftar.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (presentStudentIds.length === 0 && absentStudentIds.length === 0) {
      setNotification('Pilih minimal 1 siswa untuk dicatat absensinya.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const sessionObj = activeSessions.find((s) => s.id === formSessionId);
    const attendedNames = presentStudentIds
      .map((id) => {
        const found = scheduledStudents.find((s) => s.id === id);
        return found?.name || id;
      })
      .filter(Boolean);

    const absentNames = absentStudentIds
      .map((id) => {
        const found = scheduledStudents.find((s) => s.id === id);
        return found?.name || id;
      })
      .filter(Boolean);

    const record: AttendanceRecord = {
      id: `ATT-${Date.now().toString().slice(-5)}`,
      date: formDate,
      day: dayName as DayOfWeek,
      sessionId: formSessionId,
      sessionTime: sessionObj?.time || activeSchedule.sessionTime || '13:30 - 14:45',
      bimbelType: formBimbelType,
      tutorId: effectiveTutorId,
      tutorName: selectedTutor?.name || 'Guru Bimbel',
      attendedStudentIds: presentStudentIds,
      attendedStudentNames: attendedNames,
      absentStudentIds: absentStudentIds,
      notes: formNotes,
      honorEarned: calculatedHonor,
      submittedBy: currentUsername,
      createdAt: new Date().toISOString(),
    };

    onSaveAttendance(record);
    setFormNotes('');
    setNotification('Absensi berhasil disimpan!');
    setTimeout(() => {
      setNotification(null);
      setActiveSubTab('history');
    }, 1200);
  };

  // Filter history records
  let filteredHistory = attendanceRecords;
  if (userRole === 'guru' && effectiveTutorId) {
    filteredHistory = filteredHistory.filter((r) => r.tutorId === effectiveTutorId);
  } else if (tutorFilter !== 'all') {
    filteredHistory = filteredHistory.filter((r) => r.tutorId === tutorFilter);
  }

  if (dateFilter) {
    filteredHistory = filteredHistory.filter((r) => r.date === dateFilter);
  }

  if (searchFilter) {
    filteredHistory = filteredHistory.filter(
      (r) =>
        r.tutorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.attendedStudentNames.some((name) =>
          name.toLowerCase().includes(searchFilter.toLowerCase())
        ) ||
        r.notes?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Absensi Kehadiran Siswa
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
              {userRole === 'guru' ? selectedTutor?.name || 'Guru' : 'Sistem Otomatis'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'guru'
              ? 'Input kehadiran siswa sesuai jadwal mengajar Anda'
              : 'Pantau rekapitulasi kehadiran belajar siswa dan guru'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`py-1.5 px-3 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'input'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Absensi</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`py-1.5 px-3 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'history'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Riwayat ({filteredHistory.length})</span>
          </button>
        </div>
      </div>

      {/* INPUT ABSENSI TAB (Mobile-First) */}
      {activeSubTab === 'input' && (
        <form onSubmit={handleSubmitAttendance} className="space-y-4 max-w-2xl mx-auto">
          {/* Quick Schedule Selector: Only shows schedules assigned to this tutor */}
          {matchingSchedules.length > 0 && (
            <div className="bg-indigo-50/70 border border-indigo-200/80 p-3 sm:p-4 rounded-2xl">
              <p className="text-xs font-bold text-indigo-900 mb-2 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Jadwal {selectedTutor?.name} Hari Ini ({dayName}):</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingSchedules.map((sched) => {
                  const isSelected = activeSchedule?.id === sched.id;
                  return (
                    <button
                      key={sched.id}
                      type="button"
                      onClick={() => handleSelectSchedule(sched)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white hover:bg-indigo-50/50 text-slate-800 border-indigo-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">
                          Sesi {sched.sessionId} ({sched.sessionTime})
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isSelected
                              ? 'bg-indigo-700 text-white'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {sched.bimbelType}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-1 truncate ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        {sched.studentNames?.length
                          ? sched.studentNames.join(', ')
                          : `${sched.studentIds?.length || 0} Siswa`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Parameters */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  TANGGAL ABSENSI ({dayName})
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GURU PENGAJAR</label>
                <select
                  value={effectiveTutorId}
                  disabled={userRole === 'guru'}
                  onChange={(e) => {
                    setFormTutorId(e.target.value);
                    setSelectedScheduleId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-600"
                >
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SESI BIMBEL</label>
                <select
                  value={formSessionId}
                  onChange={(e) => {
                    const newSessionId = Number(e.target.value);
                    setFormSessionId(newSessionId);
                    // Find if tutor has schedule for this session
                    const matched = tutorSchedules.find(
                      (s) => s.day === dayName && s.sessionId === newSessionId
                    );
                    if (matched) {
                      handleSelectSchedule(matched);
                    } else {
                      setSelectedScheduleId('');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                >
                  {activeSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">JENIS KELAS</label>
                <input
                  type="text"
                  readOnly
                  value={activeSchedule?.bimbelType || formBimbelType}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Student Attendance Checklist: ONLY scheduled students for this tutor & session */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Siswa Terjadwal
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hanya menampilkan siswa yang dijadwalkan pada {selectedTutor?.name || 'Guru'}
                </p>
              </div>

              {scheduledStudents.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="text-[11px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                  >
                    Semua Hadir
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkAllAbsent}
                    className="text-[11px] font-bold px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Semua Tidak Hadir
                  </button>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {presentStudentIds.length}/{scheduledStudents.length} Hadir
                  </span>
                </div>
              )}
            </div>

            {/* If no schedule matches or schedule has no students */}
            {(!activeSchedule || scheduledStudents.length === 0) && (
              <div className="p-5 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Tidak ada siswa yang terjadwal
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedTutor?.name} tidak memiliki siswa yang dijadwalkan pada {dayName} (Sesi {formSessionId}).
                  </p>
                </div>

                {/* Show available schedules for this tutor */}
                {tutorSchedules.length > 0 ? (
                  <div className="pt-2 text-left">
                    <p className="text-[11px] font-semibold text-slate-700 mb-2">
                      Pilih dari jadwal mengajar {selectedTutor?.name} yang tersedia:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tutorSchedules.map((sched) => (
                        <button
                          key={sched.id}
                          type="button"
                          onClick={() => handleSelectSchedule(sched)}
                          className="p-2.5 text-left bg-white border border-slate-200 hover:border-indigo-400 rounded-xl transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {sched.day} • Sesi {sched.sessionId}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                              {sched.bimbelType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {sched.studentNames?.length
                              ? sched.studentNames.join(', ')
                              : `${sched.studentIds?.length || 0} Siswa`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Belum ada jadwal yang diatur untuk {selectedTutor?.name}. Atur jadwal di menu 'Jadwal'.
                  </p>
                )}
              </div>
            )}

            {/* Scheduled Students List: Toggles Presence with 1-Tap */}
            {scheduledStudents.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {scheduledStudents.map((student) => {
                  const isPresent = presentStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudentAttendance(student.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                        isPresent
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isPresent ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900">
                            {student.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {student.id} • {student.grade !== '-' ? student.grade : student.bimbelType}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          isPresent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isPresent ? 'HADIR' : 'TIDAK HADIR'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes / Material */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MATERI PEMBAHASAN & CATATAN SESI
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Latihan Bab 3 Persamaan Kuadrat, seluruh siswa tuntas..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!activeSchedule || scheduledStudents.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Catat Absensi</span>
            </button>
          </div>
        </form>
      )}

      {/* RIWAYAT ABSENSI TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-3.5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama guru, nama siswa hadir, atau materi..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-none"
              />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 outline-none"
            />

            {userRole !== 'guru' && (
              <select
                value={tutorFilter}
                onChange={(e) => setTutorFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:border-indigo-500 outline-none"
              >
                <option value="all">Semua Guru</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredHistory.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      S{rec.sessionId}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {rec.tutorName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {rec.day}, {formatDateIndo(rec.date)} • {rec.sessionTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {rec.bimbelType}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Honor: {formatRupiah(rec.honorEarned)}
                    </span>
                    {userRole === 'super_admin' && onDeleteAttendance && (
                      <button
                        onClick={() => setRecToDelete(rec)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Attended Students */}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Siswa Hadir ({rec.attendedStudentNames.length} anak):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.attendedStudentNames.map((name, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium"
                      >
                        ✓ {name}
                      </span>
                    ))}
                    {rec.attendedStudentNames.length === 0 && (
                      <span className="text-xs text-rose-500 italic">Tidak ada siswa hadir</span>
                    )}
                  </div>
                </div>

                {rec.notes && (
                  <p className="mt-2.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    "{rec.notes}"
                  </p>
                )}
              </div>
            ))}

            {filteredHistory.length === 0 && (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                <CalendarCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Belum ada data absensi</p>
                <p className="mt-0.5">Silakan pilih tab 'Input Absensi' untuk memasukkan presensi baru</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Absensi */}
      <ConfirmDeleteModal
        isOpen={!!recToDelete}
        title="Hapus Riwayat Absensi"
        message="Riwayat absensi ini akan dihapus secara permanen dari sistem dan database Supabase."
        itemName={
          recToDelete
            ? `${recToDelete.day}, ${formatDateIndo(recToDelete.date)} • Sesi ${recToDelete.sessionId} (${recToDelete.tutorName})`
            : ''
        }
        onConfirm={() => {
          if (recToDelete && onDeleteAttendance) {
            onDeleteAttendance(recToDelete.id);
            setRecToDelete(null);
          }
        }}
        onCancel={() => setRecToDelete(null)}
      />
    </div>
  );
};
