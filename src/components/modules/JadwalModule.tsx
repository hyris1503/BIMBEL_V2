import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Users,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import {
  ScheduleItem,
  DayOfWeek,
  BimbelType,
  UserRole,
  Student,
  Tutor,
  SessionConfig,
} from '../../types/bimbel';
import { DEFAULT_SESSIONS } from '../../services/bimbelStorage';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface JadwalModuleProps {
  schedules: ScheduleItem[];
  students: Student[];
  tutors: Tutor[];
  sessions?: SessionConfig[];
  onSaveSchedule: (schedule: ScheduleItem) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  userRole: UserRole;
  currentTutorId?: string;
  currentTutorName?: string;
}

export const JadwalModule: React.FC<JadwalModuleProps> = ({
  schedules,
  students,
  tutors,
  sessions,
  onSaveSchedule,
  onDeleteSchedule,
  userRole,
  currentTutorId,
  currentTutorName,
}) => {
  const activeSessions = sessions && sessions.length > 0 ? sessions : DEFAULT_SESSIONS;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleItem | null>(null);

  // Form State
  const [formDay, setFormDay] = useState<DayOfWeek>('Senin');
  const [formSessionId, setFormSessionId] = useState<number>(1);
  const [formBimbelType, setFormBimbelType] = useState<BimbelType>('Kelompok');
  const [formTutorId, setFormTutorId] = useState<string>('');
  const [formSelectedStudentIds, setFormSelectedStudentIds] = useState<string[]>([]);

  const canEdit = userRole === 'super_admin' || userRole === 'admin';

  // Capacity limits
  const getMaxStudents = (type: BimbelType): number => {
    switch (type) {
      case 'Kelompok':
        return 6;
      case 'Privat 3':
        return 3;
      case 'Privat 1':
        return 1;
      case 'Home Visit':
        return 1;
      default:
        return 6;
    }
  };

  const days: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis'];

  const handleOpenAdd = (day?: DayOfWeek, sessionId?: number) => {
    setEditingSchedule(null);
    setFormDay(day || selectedDay);
    setFormSessionId(sessionId || 1);
    setFormBimbelType('Kelompok');
    setFormTutorId(tutors[0]?.id || '');
    setFormSelectedStudentIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sched: ScheduleItem) => {
    setEditingSchedule(sched);
    setFormDay(sched.day);
    setFormSessionId(sched.sessionId);
    setFormBimbelType(sched.bimbelType);
    setFormTutorId(sched.tutorId);
    setFormSelectedStudentIds(sched.studentIds);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionObj = activeSessions.find((s) => s.id === formSessionId);
    const tutorObj = tutors.find((t) => t.id === formTutorId);
    const maxAllowed = getMaxStudents(formBimbelType);

    if (formSelectedStudentIds.length > maxAllowed) {
      alert(`Maksimal siswa untuk tipe ${formBimbelType} adalah ${maxAllowed} orang.`);
      return;
    }

    const studentNames = formSelectedStudentIds
      .map((id) => students.find((s) => s.id === id)?.name || id)
      .filter(Boolean);

    const payload: ScheduleItem = {
      id: editingSchedule?.id || `SCH-${Date.now().toString().slice(-4)}`,
      day: formDay,
      sessionId: formSessionId,
      sessionTime: sessionObj?.time || '13:30 - 14:45',
      bimbelType: formBimbelType,
      tutorId: formTutorId,
      tutorName: tutorObj?.name || 'Guru Bimbel',
      studentIds: formSelectedStudentIds,
      studentNames,
    };

    onSaveSchedule(payload);
    setIsModalOpen(false);
  };

  const toggleStudentSelection = (studentId: string) => {
    const maxAllowed = getMaxStudents(formBimbelType);
    if (formSelectedStudentIds.includes(studentId)) {
      setFormSelectedStudentIds(formSelectedStudentIds.filter((id) => id !== studentId));
    } else {
      if (formSelectedStudentIds.length >= maxAllowed) {
        alert(`Batas maksimal kelas ${formBimbelType} adalah ${maxAllowed} anak`);
        return;
      }
      setFormSelectedStudentIds([...formSelectedStudentIds, studentId]);
    }
  };

  // Filter schedules based on role and tutor identity
  const userSchedules = userRole === 'guru'
    ? schedules.filter(
        (s) =>
          (currentTutorId && s.tutorId === currentTutorId) ||
          (currentTutorName && s.tutorName?.toLowerCase() === currentTutorName.toLowerCase())
      )
    : schedules;

  const filteredSchedules = userSchedules.filter((s) => s.day === selectedDay);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Role Notice Banner for Guru */}
      {userRole === 'guru' && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[10px]">
              AKUN GURU
            </span>
            <span>
              Menampilkan jadwal mengajar pribadi untuk <strong>{currentTutorName || 'Guru Pengajar'}</strong>
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold">
            Hubungi Admin jika terdapat perubahan jadwal
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {userRole === 'guru' ? 'Jadwal Mengajar Saya (Senin - Kamis)' : 'Jadwal Sesi Bimbel (Senin - Kamis)'}
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full">
              4 Hari • {activeSessions.length} Sesi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'guru'
              ? 'Daftar sesi belajar mengajar dan siswa yang ditugaskan kepada Anda'
              : `Jadwal kegiatan belajar mengajar rutin ${activeSessions.length} sesi harian untuk semua kelas`}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Baru</span>
          </button>
        )}
      </div>

      {/* Day Selector Tabs (Senin - Kamis) */}
      <div className="grid grid-cols-4 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
        {days.map((day) => {
          const count = userSchedules.filter((s) => s.day === day).length;
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center sm:space-x-2 ${
                isSelected
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {count} sesi
              </span>
            </button>
          );
        })}
      </div>

      {/* Sessions View for Selected Day */}
      <div className="space-y-3.5">
        {activeSessions.map((session) => {
          const sessionSchedules = filteredSchedules.filter((s) => s.sessionId === session.id);

          return (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs"
            >
              {/* Session Header Bar */}
              <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {session.id}
                  </span>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {session.name}
                    </span>
                    <span className="text-slate-400 text-xs ml-2 font-mono">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                      {session.time}
                    </span>
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleOpenAdd(selectedDay, session.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-1 px-2.5 rounded-lg hover:bg-indigo-50 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tambah Kelas</span>
                  </button>
                )}
              </div>

              {/* Schedules within this session */}
              <div className="p-3 sm:p-4">
                {sessionSchedules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sessionSchedules.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span
                              className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${
                                item.bimbelType === 'Kelompok'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : item.bimbelType === 'Privat 3'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : item.bimbelType === 'Privat 1'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {item.bimbelType}
                            </span>
                          </div>

                          <div className="mt-2.5">
                            <p className="text-xs text-slate-500 font-medium">Guru Pengajar:</p>
                            <p className="font-bold text-slate-800 text-sm">{item.tutorName}</p>
                          </div>

                          <div className="mt-2.5">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Daftar Siswa ({item.studentNames.length} anak):</span>
                              <span className="text-[10px] font-mono">
                                Maks {getMaxStudents(item.bimbelType)} anak
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {item.studentNames.map((name, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium"
                                >
                                  {name}
                                </span>
                              ))}
                              {item.studentNames.length === 0 && (
                                <span className="text-xs text-slate-400 italic">
                                  Belum ada siswa dipilih
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {canEdit && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="text-xs text-slate-600 hover:text-indigo-600 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setScheduleToDelete(item)}
                              className="text-xs text-slate-400 hover:text-rose-600 flex items-center space-x-1 px-2 py-1 rounded hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                    Belum ada kelas yang dijadwalkan pada {session.name} ({session.time})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Schedule (Without Ruangan) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingSchedule ? 'Edit Jadwal Sesi' : 'Tambah Jadwal Sesi Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HARI BIMBEL</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SESI & WAKTU</label>
                  <select
                    value={formSessionId}
                    onChange={(e) => setFormSessionId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    {activeSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">JENIS BIMBEL</label>
                  <select
                    value={formBimbelType}
                    onChange={(e) => {
                      const newType = e.target.value as BimbelType;
                      setFormBimbelType(newType);
                      const limit = getMaxStudents(newType);
                      if (formSelectedStudentIds.length > limit) {
                        setFormSelectedStudentIds(formSelectedStudentIds.slice(0, limit));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    <option value="Kelompok">Kelompok (Maks 6)</option>
                    <option value="Privat 3">Privat 3 (Maks 3)</option>
                    <option value="Privat 1">Privat 1</option>
                    <option value="Home Visit">Home Visit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GURU PENGAJAR</label>
                  <select
                    value={formTutorId}
                    onChange={(e) => setFormTutorId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    <option value="">Pilih Guru...</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Selection with Capacity Alert */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    PILIH SISWA ({formSelectedStudentIds.length} / {getMaxStudents(formBimbelType)}{' '}
                    anak)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Klik nama siswa untuk menambahkan
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  {students.map((student) => {
                    const isSelected = formSelectedStudentIds.includes(student.id);
                    return (
                      <button
                        type="button"
                        key={student.id}
                        onClick={() => toggleStudentSelection(student.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] opacity-80">{student.id}</span>
                          <span className="text-xs">{student.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded ${
                              isSelected ? 'bg-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {student.bimbelType}
                          </span>
                        </div>
                        <span className="text-[10px]">{isSelected ? '✓ Terpilih' : '+ Pilih'}</span>
                      </button>
                    );
                  })}
                  {students.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      Belum ada siswa terdaftar. Tambahkan siswa terlebih dahulu di modul Siswa.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Jadwal */}
      <ConfirmDeleteModal
        isOpen={!!scheduleToDelete}
        title="Hapus Jadwal Mengajar"
        message="Jadwal mengajar ini akan dihapus secara permanen dari sistem dan database Supabase."
        itemName={
          scheduleToDelete
            ? `${scheduleToDelete.day} • Sesi ${scheduleToDelete.sessionId} (${scheduleToDelete.tutorName} - ${scheduleToDelete.bimbelType})`
            : ''
        }
        onConfirm={() => {
          if (scheduleToDelete) {
            onDeleteSchedule(scheduleToDelete.id);
            setScheduleToDelete(null);
          }
        }}
        onCancel={() => setScheduleToDelete(null)}
      />
    </div>
  );
};
