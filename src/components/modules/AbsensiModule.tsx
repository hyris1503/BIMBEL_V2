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
  Home,
  DollarSign,
  Info,
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

  // Mode: Reguler vs Jadwal Khusus Home Visit
  const [attendanceMode, setAttendanceMode] = useState<'reguler' | 'home_visit'>('reguler');
  const [homeVisitStudentId, setHomeVisitStudentId] = useState<string>('');
  const [editingHomeVisitRecord, setEditingHomeVisitRecord] = useState<AttendanceRecord | null>(null);
  const [manualHonorInput, setManualHonorInput] = useState<string>('50000');

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

  // Home Visit schedules & candidates
  const homeVisitSchedules = tutorSchedules.filter((s) => s.bimbelType === 'Home Visit');
  const homeVisitStudents = students.filter((s) => s.bimbelType === 'Home Visit');
  const eligibleHomeVisitStudents = homeVisitStudents.length > 0 ? homeVisitStudents : students;

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

  const isHomeVisitMode = attendanceMode === 'home_visit';

  // Active student for Home Visit mode
  const activeHomeVisitStudent = isHomeVisitMode
    ? (homeVisitStudentId
        ? students.find((s) => s.id === homeVisitStudentId)
        : (activeSchedule && activeSchedule.studentIds.length > 0
            ? students.find((s) => s.id === activeSchedule.studentIds[0])
            : eligibleHomeVisitStudents[0])) || null
    : null;

  // Student IDs scheduled for this session
  const scheduledStudentIds = isHomeVisitMode
    ? (activeHomeVisitStudent ? [activeHomeVisitStudent.id] : [])
    : (activeSchedule?.studentIds || []);

  // When activeSchedule changes or mode changes, sync form states and students
  useEffect(() => {
    if (isHomeVisitMode) {
      setFormBimbelType('Home Visit');
      if (activeHomeVisitStudent) {
        setPresentStudentIds([activeHomeVisitStudent.id]);
        setAbsentStudentIds([]);
      }
    } else if (activeSchedule) {
      if (selectedScheduleId !== activeSchedule.id) {
        setSelectedScheduleId(activeSchedule.id);
      }
      setFormSessionId(activeSchedule.sessionId);
      setFormBimbelType(activeSchedule.bimbelType);

      const validPresent = presentStudentIds.filter((id) =>
        activeSchedule.studentIds.includes(id)
      );
      const validAbsent = absentStudentIds.filter((id) =>
        activeSchedule.studentIds.includes(id)
      );

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
  }, [activeSchedule?.id, formDate, effectiveTutorId, attendanceMode, homeVisitStudentId]);

  // Load students from schedule when clicked
  const handleSelectSchedule = (sched: ScheduleItem) => {
    setSelectedScheduleId(sched.id);
    setFormSessionId(sched.sessionId);
    setFormBimbelType(sched.bimbelType);
    setFormTutorId(sched.tutorId);
    setPresentStudentIds(sched.studentIds);
    setAbsentStudentIds([]);
    if (sched.bimbelType === 'Home Visit') {
      setAttendanceMode('home_visit');
      if (sched.studentIds.length > 0) {
        setHomeVisitStudentId(sched.studentIds[0]);
      }
    }
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
  const scheduledStudents = isHomeVisitMode
    ? (activeHomeVisitStudent ? [activeHomeVisitStudent] : [])
    : scheduledStudentIds.map((id) => {
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

  // Live honor calculation: Home Visit is 0/manual by admin, regular classes use standard formula
  const calculatedHonor = isHomeVisitMode ? 0 : calculateTutorHonor(presentStudentIds.length);

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();

    const sessionObj = activeSessions.find((s) => s.id === formSessionId);
    let finalAttendedIds = presentStudentIds;
    let finalAttendedNames: string[] = [];
    let finalAbsentIds = absentStudentIds;

    if (isHomeVisitMode) {
      if (!activeHomeVisitStudent) {
        setNotification('Pilih siswa untuk sesi Home Visit terlebih dahulu.');
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      const isPresent = presentStudentIds.includes(activeHomeVisitStudent.id);
      finalAttendedIds = isPresent ? [activeHomeVisitStudent.id] : [];
      finalAttendedNames = isPresent ? [activeHomeVisitStudent.name] : [];
      finalAbsentIds = isPresent ? [] : [activeHomeVisitStudent.id];
    } else {
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

      finalAttendedNames = presentStudentIds
        .map((id) => {
          const found = scheduledStudents.find((s) => s.id === id);
          return found?.name || id;
        })
        .filter(Boolean);

      finalAbsentIds = absentStudentIds;
    }

    const record: AttendanceRecord = {
      id: `ATT-${Date.now().toString().slice(-5)}`,
      date: formDate,
      day: dayName as DayOfWeek,
      sessionId: formSessionId,
      sessionTime: sessionObj?.time || activeSchedule?.sessionTime || '13:30 - 14:45',
      bimbelType: isHomeVisitMode ? 'Home Visit' : formBimbelType,
      tutorId: effectiveTutorId,
      tutorName: selectedTutor?.name || 'Guru Bimbel',
      attendedStudentIds: finalAttendedIds,
      attendedStudentNames: finalAttendedNames,
      absentStudentIds: finalAbsentIds,
      notes: formNotes || (isHomeVisitMode ? 'Kunjungan Home Visit selesai dilaksanakan' : ''),
      honorEarned: isHomeVisitMode ? 0 : calculatedHonor, // Home Visit diinput manual oleh Admin pada saat penggajian
      submittedBy: currentUsername,
      createdAt: new Date().toISOString(),
    };

    onSaveAttendance(record);
    setFormNotes('');
    setNotification(
      isHomeVisitMode
        ? 'Absensi Home Visit berhasil disimpan! Honor sesi akan diinput manual oleh Admin saat pembuatan slip gaji.'
        : 'Absensi berhasil disimpan!'
    );
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
          {/* Mode Switcher: Reguler vs Jadwal Khusus Home Visit */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAttendanceMode('reguler');
                setFormBimbelType('Kelompok');
                setSelectedScheduleId('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                attendanceMode === 'reguler'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sesi Kelas Reguler</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAttendanceMode('home_visit');
                setFormBimbelType('Home Visit');
                setSelectedScheduleId('');
                if (homeVisitSchedules.length > 0) {
                  handleSelectSchedule(homeVisitSchedules[0]);
                } else if (eligibleHomeVisitStudents.length > 0) {
                  const firstId = eligibleHomeVisitStudents[0].id;
                  setHomeVisitStudentId(firstId);
                  setPresentStudentIds([firstId]);
                  setAbsentStudentIds([]);
                }
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                attendanceMode === 'home_visit'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Jadwal Khusus Home Visit</span>
            </button>
          </div>

          {/* DEDICATED HOME VISIT CARD */}
          {attendanceMode === 'home_visit' && (
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs sm:text-sm">
                  <Home className="w-4 h-4 text-emerald-700" />
                  <span>Jadwal Khusus Home Visit (Kunjungan Rumah)</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  Maks. 1 Siswa
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Catat presensi setelah kunjungan belajar ke rumah siswa selesai dilakukan oleh guru pengajar.
              </p>

              {/* If tutor has registered Home Visit schedules */}
              {homeVisitSchedules.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60">
                  <p className="text-[11px] font-bold text-emerald-900 mb-1.5">
                    Pilih Dari Jadwal Home Visit Terdaftar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {homeVisitSchedules.map((sched) => {
                      const isSel = selectedScheduleId === sched.id;
                      return (
                        <button
                          key={sched.id}
                          type="button"
                          onClick={() => handleSelectSchedule(sched)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSel
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-white hover:bg-emerald-100/50 text-slate-800 border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span>{sched.day} ({sched.sessionTime})</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSel ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                              Sesi {sched.sessionId}
                            </span>
                          </div>
                          <p className={`text-[11px] mt-0.5 truncate ${isSel ? 'text-emerald-100' : 'text-slate-600'}`}>
                            Siswa: {sched.studentNames?.join(', ') || '1 Siswa'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Regular Schedules (Only for reguler mode) */}
          {attendanceMode === 'reguler' && matchingSchedules.length > 0 && (
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
                    if (!isHomeVisitMode) {
                      const matched = tutorSchedules.find(
                        (s) => s.day === dayName && s.sessionId === newSessionId
                      );
                      if (matched) {
                        handleSelectSchedule(matched);
                      } else {
                        setSelectedScheduleId('');
                      }
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
                  value={
                    attendanceMode === 'home_visit'
                      ? '🏠 Home Visit (Kunjungan Rumah)'
                      : (activeSchedule?.bimbelType || formBimbelType)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none font-semibold"
                />
              </div>

              {/* Student Picker for Home Visit Mode */}
              {attendanceMode === 'home_visit' && (
                <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                  <label className="block font-semibold text-slate-700 mb-1">
                    PILIH SISWA YANG DIKUNJUNGI (HOME VISIT)
                  </label>
                  <select
                    value={activeHomeVisitStudent?.id || ''}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setHomeVisitStudentId(sid);
                      setPresentStudentIds([sid]);
                      setAbsentStudentIds([]);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-emerald-500 outline-none"
                  >
                    {students.filter((s) => s.bimbelType === 'Home Visit').length > 0 && (
                      <optgroup label="Siswa Terdaftar Home Visit">
                        {students
                          .filter((s) => s.bimbelType === 'Home Visit')
                          .map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.id}) - Kelas {st.grade}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <optgroup
                      label={
                        students.filter((s) => s.bimbelType === 'Home Visit').length > 0
                          ? 'Siswa Lainnya'
                          : 'Daftar Siswa'
                      }
                    >
                      {students
                        .filter((s) => s.bimbelType !== 'Home Visit')
                        .map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.id}) - {st.bimbelType}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Student Attendance Checklist: ONLY scheduled students for this tutor & session */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {attendanceMode === 'home_visit' ? 'Presensi Siswa Home Visit' : 'Daftar Siswa Terjadwal'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {attendanceMode === 'home_visit'
                    ? 'Konfirmasi kehadiran 1 siswa pada kunjungan rumah ini'
                    : `Hanya menampilkan siswa yang dijadwalkan pada ${selectedTutor?.name || 'Guru'}`}
                </p>
              </div>

              {scheduledStudents.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="text-[11px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                  >
                    Hadir
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkAllAbsent}
                    className="text-[11px] font-bold px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Tidak Hadir
                  </button>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {presentStudentIds.length}/{scheduledStudents.length} Hadir
                  </span>
                </div>
              )}
            </div>

            {/* If regular mode and no schedule matches */}
            {attendanceMode === 'reguler' && (!activeSchedule || scheduledStudents.length === 0) && (
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
                    Belum ada jadwal yang diatur untuk {selectedTutor?.name}. Atur jadwal di menu 'Jadwal' atau gunakan 'Jadwal Khusus Home Visit'.
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
                        {isPresent ? (attendanceMode === 'home_visit' ? 'HADIR (DIKUNJUNGI)' : 'HADIR') : 'TIDAK HADIR'}
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
                placeholder={
                  attendanceMode === 'home_visit'
                    ? 'Contoh: Kunjungan rumah selesai, pembahasan materi IPA Bab 2 tuntas...'
                    : 'Contoh: Latihan Bab 3 Persamaan Kuadrat, seluruh siswa tuntas...'
                }
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            {/* Honor Information Preview */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                attendanceMode === 'home_visit'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-indigo-50/60 border-indigo-100 text-indigo-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                {attendanceMode === 'home_visit' ? (
                  <Home className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
                <span>
                  {attendanceMode === 'home_visit' ? (
                    <>
                      Honor Sesi Home Visit:{' '}
                      <strong>Ditetapkan Manual oleh Admin</strong> (diinput saat pembuatan slip gaji)
                    </>
                  ) : (
                    <>
                      Estimasi Honor Sesi Guru: <strong>{formatRupiah(calculatedHonor)}</strong> ({presentStudentIds.length} Siswa)
                    </>
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                attendanceMode === 'home_visit'
                  ? !activeHomeVisitStudent || presentStudentIds.length === 0
                  : !activeSchedule || scheduledStudents.length === 0
              }
              className={`w-full py-3 ${
                attendanceMode === 'home_visit'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              } active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {attendanceMode === 'home_visit'
                  ? 'Simpan Presensi Home Visit'
                  : 'Simpan & Catat Absensi'}
              </span>
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

                  <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.bimbelType === 'Home Visit'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.bimbelType === 'Home Visit' ? '🏠 Home Visit' : rec.bimbelType}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        rec.bimbelType === 'Home Visit'
                          ? rec.honorEarned > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {rec.bimbelType === 'Home Visit'
                        ? rec.honorEarned > 0
                          ? `Honor: ${formatRupiah(rec.honorEarned)} (Manual Admin)`
                          : 'Honor: Menunggu Admin'
                        : `Honor: ${formatRupiah(rec.honorEarned)}`}
                    </span>
                    {(userRole === 'super_admin' || userRole === 'admin') &&
                      rec.bimbelType === 'Home Visit' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHomeVisitRecord(rec);
                            setManualHonorInput(
                              rec.honorEarned > 0 ? String(rec.honorEarned) : '50000'
                            );
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1"
                          title="Input atau ubah honor manual untuk kunjungan Home Visit ini"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{rec.honorEarned > 0 ? 'Edit Honor' : 'Input Honor'}</span>
                        </button>
                      )}
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

      {/* MODAL INPUT / EDIT HONOR HOME VISIT (KHUSUS ADMIN) */}
      {editingHomeVisitRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs sm:text-sm text-slate-800">
                  Input / Edit Honor Sesi Home Visit
                </span>
              </div>
              <button
                onClick={() => setEditingHomeVisitRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const clean = Number(manualHonorInput.replace(/\D/g, ''));
                if (clean < 0) {
                  alert('Nominal honor tidak boleh negatif');
                  return;
                }
                const updated: AttendanceRecord = {
                  ...editingHomeVisitRecord,
                  honorEarned: clean,
                };
                onSaveAttendance(updated);
                setEditingHomeVisitRecord(null);
                setNotification(
                  `Honor Home Visit untuk ${editingHomeVisitRecord.tutorName} berhasil disimpan: ${formatRupiah(clean)}`
                );
                setTimeout(() => setNotification(null), 3500);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                <p className="font-bold text-emerald-950">
                  {editingHomeVisitRecord.tutorName}
                </p>
                <p className="text-[11px] text-emerald-800">
                  {editingHomeVisitRecord.day}, {formatDateIndo(editingHomeVisitRecord.date)} • {editingHomeVisitRecord.sessionTime}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Siswa yang dikunjungi:{' '}
                  <strong>{editingHomeVisitRecord.attendedStudentNames.join(', ') || '1 Siswa'}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NOMINAL HONOR GURU UNTUK SESI INI (RP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 75000"
                    required
                    value={manualHonorInput}
                    onChange={(e) => setManualHonorInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                {manualHonorInput && Number(manualHonorInput) > 0 && (
                  <p className="text-xs font-mono font-bold text-emerald-700 mt-1">
                    {formatRupiah(Number(manualHonorInput))}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Honor ini otomatis masuk ke perhitungan pembuatan slip gaji bulanan guru yang bersangkutan.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingHomeVisitRecord(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all"
                >
                  Simpan Honor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
