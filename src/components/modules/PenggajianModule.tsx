import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle,
  Clock,
  Printer,
  MessageCircle,
  Sparkles,
  Award,
  X,
  Trash2,
  Edit2,
  AlertCircle,
  Home,
  Info,
} from 'lucide-react';
import {
  SalarySlip,
  Tutor,
  AttendanceRecord,
  BimbelPricingSettings,
  UserRole,
} from '../../types/bimbel';
import {
  formatRupiah,
  formatDateIndo,
  createWhatsAppLink,
} from '../../utils/formatters';
import confetti from 'canvas-confetti';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface PenggajianModuleProps {
  slips: SalarySlip[];
  tutors: Tutor[];
  attendanceRecords: AttendanceRecord[];
  settings: BimbelPricingSettings;
  onSaveSlip: (slip: SalarySlip) => void;
  onPaySalary: (slipId: string) => void;
  onDeleteSlip?: (slipId: string) => void;
  onUpdateAttendance?: (record: AttendanceRecord) => void;
  userRole: UserRole;
  currentTutorId?: string;
}

const MONTHS_LIST = [
  { value: '01', name: 'Januari' },
  { value: '02', name: 'Februari' },
  { value: '03', name: 'Maret' },
  { value: '04', name: 'April' },
  { value: '05', name: 'Mei' },
  { value: '06', name: 'Juni' },
  { value: '07', name: 'Juli' },
  { value: '08', name: 'Agustus' },
  { value: '09', name: 'September' },
  { value: '10', name: 'Oktober' },
  { value: '11', name: 'November' },
  { value: '12', name: 'Desember' },
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const PenggajianModule: React.FC<PenggajianModuleProps> = ({
  slips,
  tutors,
  attendanceRecords,
  settings,
  onSaveSlip,
  onPaySalary,
  onDeleteSlip,
  onUpdateAttendance,
  userRole,
  currentTutorId,
}) => {
  const [activeSlip, setActiveSlip] = useState<SalarySlip | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [slipToDelete, setSlipToDelete] = useState<SalarySlip | null>(null);

  // Edit Slip Status modal state
  const [slipToEdit, setSlipToEdit] = useState<SalarySlip | null>(null);
  const [editSlipStatus, setEditSlipStatus] = useState<'draft' | 'paid'>('draft');
  const [editSlipPaidDate, setEditSlipPaidDate] = useState<string>('');
  const [editSlipNotes, setEditSlipNotes] = useState<string>('');
  const [editSlipTotalSalary, setEditSlipTotalSalary] = useState<number>(0);

  // Generator form
  const [selectedTutorId, setSelectedTutorId] = useState<string>(tutors[0]?.id || '');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<string>('10'); // '10' for Oktober
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [customTunjanganJabatan, setCustomTunjanganJabatan] = useState<number>(0);
  const [customTunjanganKehadiran, setCustomTunjanganKehadiran] = useState<number>(0);
  const [customTransport, setCustomTransport] = useState<number>(0);
  const [customDeduction, setCustomDeduction] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Manual Home Visit honor map per record ID: recordId -> amount
  const [homeVisitManualHonors, setHomeVisitManualHonors] = useState<Record<string, number>>({});

  const canManage = userRole === 'super_admin' || userRole === 'admin';

  // Derived selected period string (e.g. "Oktober 2026" or "Mei 2026")
  const selectedMonthName =
    MONTHS_LIST.find((m) => m.value === selectedMonthIndex)?.name || 'Oktober';
  const selectedPeriod = `${selectedMonthName} ${selectedYear}`;

  // Filter attendance records specifically for selected tutor in selected month and year
  const tutorMonthlyRecords = attendanceRecords.filter((a) => {
    if (a.tutorId !== selectedTutorId) return false;
    if (!a.date) return false;
    const parts = a.date.split('-');
    if (parts.length >= 2) {
      const yr = Number(parts[0]);
      const mo = parts[1];
      return yr === selectedYear && mo === selectedMonthIndex;
    }
    const d = new Date(a.date);
    return (
      d.getFullYear() === selectedYear &&
      String(d.getMonth() + 1).padStart(2, '0') === selectedMonthIndex
    );
  });

  const homeVisitMonthlyRecords = tutorMonthlyRecords.filter((a) => a.bimbelType === 'Home Visit');
  const regularMonthlyRecords = tutorMonthlyRecords.filter((a) => a.bimbelType !== 'Home Visit');

  const getHonorForRecord = (rec: AttendanceRecord) => {
    if (rec.bimbelType === 'Home Visit') {
      if (homeVisitManualHonors[rec.id] !== undefined) {
        return homeVisitManualHonors[rec.id];
      }
      return rec.honorEarned > 0 ? rec.honorEarned : 50000;
    }
    return rec.honorEarned;
  };

  const totalHomeVisitHonor = homeVisitMonthlyRecords.reduce((sum, rec) => sum + getHonorForRecord(rec), 0);
  const totalRegularHonor = regularMonthlyRecords.reduce((sum, rec) => sum + rec.honorEarned, 0);
  const computedSessionHonorTotal = totalRegularHonor + totalHomeVisitHonor;

  const hasTaughtThisPeriod = tutorMonthlyRecords.length > 0;

  // Check if slip for selected tutor and period is ALREADY paid
  const alreadyPaidSlip = slips.find(
    (s) =>
      s.tutorId === selectedTutorId &&
      s.monthPeriod === selectedPeriod &&
      s.status === 'paid'
  );

  let displaySlips = slips;
  if (userRole === 'guru' && currentTutorId) {
    displaySlips = slips.filter((s) => s.tutorId === currentTutorId);
  }

  const handleOpenGenerator = (tutorId?: string) => {
    const targetTutor = tutors.find((t) => t.id === (tutorId || selectedTutorId)) || tutors[0];
    setSelectedTutorId(targetTutor?.id || '');
    setCustomTunjanganJabatan(targetTutor?.tunjanganJabatan || 0);
    setCustomTunjanganKehadiran(targetTutor?.tunjanganKehadiran || 0);
    setCustomTransport(targetTutor?.transport || 0);
    setCustomDeduction(0);
    setNotes('Gaji bulanan');

    // Populate initial manual honor values for Home Visit records
    const initialHV: Record<string, number> = {};
    attendanceRecords.forEach((a) => {
      if (a.bimbelType === 'Home Visit') {
        initialHV[a.id] = a.honorEarned > 0 ? a.honorEarned : 50000;
      }
    });
    setHomeVisitManualHonors(initialHV);

    setIsGeneratorModalOpen(true);
  };

  const handleOpenEditSlip = (slip: SalarySlip) => {
    setSlipToEdit(slip);
    setEditSlipStatus(slip.status);
    setEditSlipPaidDate(slip.paidAt ? slip.paidAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditSlipNotes(slip.notes || '');
    setEditSlipTotalSalary(slip.totalSalary);
  };

  const handleSaveEditSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipToEdit) return;

    const updated: SalarySlip = {
      ...slipToEdit,
      status: editSlipStatus,
      paidAt: editSlipStatus === 'paid' ? (editSlipPaidDate || new Date().toISOString().split('T')[0]) : undefined,
      notes: editSlipNotes,
      totalSalary: editSlipTotalSalary,
    };

    onSaveSlip(updated);
    setSlipToEdit(null);
    setSuccessMessage(`Status slip gaji ${slipToEdit.tutorName} berhasil diperbarui.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleGenerateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const tutor = tutors.find((t) => t.id === selectedTutorId);
    if (!tutor) {
      alert('Pilih guru terlebih dahulu');
      return;
    }

    // Logic Bimbel: Guru HANYA bisa dibuatkan slip jika mengajar pada bulan tersebut
    if (!hasTaughtThisPeriod || tutorMonthlyRecords.length === 0) {
      alert(
        `Guru ${tutor.name} belum memiliki riwayat presensi mengajar pada periode ${selectedPeriod}. Slip gaji tidak dapat dihitung atau dibuat karena guru belum/tidak mengajar pada bulan tersebut.`
      );
      return;
    }

    // Duplicate check: if period is already paid, strictly prevent duplicate!
    const existingPaid = slips.find(
      (s) => s.tutorId === tutor.id && s.monthPeriod === selectedPeriod && s.status === 'paid'
    );
    if (existingPaid) {
      alert(
        `Slip gaji untuk ${tutor.name} pada periode ${selectedPeriod} SUDAH DICAIRKAN (Lunas) dengan ID ${existingPaid.id}. Tidak dapat membuat slip gaji ulang untuk periode yang telah dibayar!`
      );
      return;
    }

    // Sync manual honor for Home Visit attendance records
    homeVisitMonthlyRecords.forEach((rec) => {
      const manualHonor = getHonorForRecord(rec);
      if (onUpdateAttendance) {
        onUpdateAttendance({
          ...rec,
          honorEarned: manualHonor,
          notes: rec.notes
            ? (rec.notes.includes('Honor Home Visit:') ? rec.notes : `${rec.notes} | Honor Home Visit: Rp ${manualHonor.toLocaleString('id-ID')}`)
            : `Honor Home Visit: Rp ${manualHonor.toLocaleString('id-ID')}`,
        });
      }
    });

    const breakdown = tutorMonthlyRecords.map((rec) => {
      const isHV = rec.bimbelType === 'Home Visit';
      const honor = getHonorForRecord(rec);
      return {
        date: rec.date,
        day: rec.day,
        sessionId: rec.sessionId,
        studentCount: rec.attendedStudentIds.length,
        honor,
        bimbelType: rec.bimbelType || 'Reguler',
        notes: isHV ? 'Home Visit (Honor Manual Admin)' : undefined,
      };
    });

    const sessionHonorTotal = breakdown.reduce((sum, item) => sum + item.honor, 0);
    const totalStudentsTaught = breakdown.reduce((sum, item) => sum + item.studentCount, 0);
    const totalSalary =
      sessionHonorTotal +
      customTunjanganJabatan +
      customTunjanganKehadiran +
      customTransport -
      customDeduction;

    const startDate = `${selectedYear}-${selectedMonthIndex}-01`;
    const lastDayNum = new Date(selectedYear, Number(selectedMonthIndex), 0).getDate();
    const endDate = `${selectedYear}-${selectedMonthIndex}-${String(lastDayNum).padStart(2, '0')}`;

    const newSlip: SalarySlip = {
      id: `SLIP-${Date.now().toString().slice(-6)}`,
      tutorId: tutor.id,
      tutorName: tutor.name,
      monthPeriod: selectedPeriod,
      startDate,
      endDate,
      totalSessions: breakdown.length,
      totalStudentsTaught,
      sessionHonorTotal,
      tunjanganJabatan: customTunjanganJabatan,
      tunjanganKehadiran: customTunjanganKehadiran,
      transport: customTransport,
      deductions: customDeduction,
      totalSalary,
      status: 'draft',
      notes,
      breakdown,
    };

    onSaveSlip(newSlip);
    setIsGeneratorModalOpen(false);
    setSuccessMessage(`Slip gaji untuk ${tutor.name} periode ${selectedPeriod} berhasil dibuat! (${breakdown.length} sesi mengajar, total: ${formatRupiah(totalSalary)})`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handlePay = (slipId: string) => {
    onPaySalary(slipId);
    if (activeSlip && activeSlip.id === slipId) {
      setActiveSlip({
        ...activeSlip,
        status: 'paid',
        paidAt: new Date().toISOString().split('T')[0],
      });
    }
    setSuccessMessage('Gaji berhasil dicairkan! Status berubah menjadi Sudah Dicairkan dan transaksi pengeluaran otomatis tercatat.');
    setTimeout(() => setSuccessMessage(''), 4000);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Notification banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="p-1 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Penggajian Guru & Slip Gaji
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem penggajian bulanan otomatis dihitung dari presensi sesi mengajar
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => handleOpenGenerator()}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Hitung & Buat Slip Gaji</span>
          </button>
        )}
      </div>

      {/* Slip Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {displaySlips.map((slip) => {
          const isPaid = slip.status === 'paid';
          return (
            <div
              key={slip.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {slip.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{slip.tutorName}</h3>
                    <p className="text-xs text-indigo-600 font-semibold">{slip.monthPeriod}</p>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isPaid ? '✓ DICAIRKAN' : 'DRAFT GAJI'}
                  </span>
                </div>

                {/* Salary Breakdown overview */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Sesi Mengajar:</span>
                    <span className="text-slate-800 font-semibold">{slip.totalSessions} Sesi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Honor Presensi Sesi:</span>
                    <span className="font-mono text-slate-800">
                      {formatRupiah(slip.sessionHonorTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tunjangan Jabatan:</span>
                    <span className="font-mono text-slate-800">
                      {formatRupiah(slip.tunjanganJabatan)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tunjangan Kehadiran:</span>
                    <span className="font-mono text-slate-800">
                      {formatRupiah(slip.tunjanganKehadiran || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uang Transport:</span>
                    <span className="font-mono text-slate-800">
                      {formatRupiah(slip.transport || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-800">Gaji Bersih Diterima:</span>
                    <span className="font-mono font-extrabold text-emerald-600 text-base">
                      {formatRupiah(slip.totalSalary)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setActiveSlip(slip)}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs border border-slate-200 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Lihat Slip</span>
                </button>

                {/* WhatsApp Share to Guru */}
                <a
                  href={createWhatsAppLink(
                    tutors.find((t) => t.id === slip.tutorId)?.phone || '08123456789',
                    `Halo ${slip.tutorName}, berikut rincian slip gaji bimbel untuk periode ${slip.monthPeriod}. Total gaji diterima: ${formatRupiah(slip.totalSalary)}. Status: ${isPaid ? 'Sudah dicairkan' : 'Proses pencairan'}. Terima kasih - BimbelSmart.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all"
                  title="Kirim ke WhatsApp Guru"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                {/* Edit Slip Status Button */}
                {canManage && (
                  <button
                    onClick={() => handleOpenEditSlip(slip)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Edit Status & Data Slip Gaji"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {/* Delete button */}
                {canManage && onDeleteSlip && (
                  <button
                    onClick={() => setSlipToDelete(slip)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Hapus Slip Gaji"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {canManage && !isPaid && (
                  <button
                    onClick={() => handlePay(slip.id)}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Cairkan Gaji</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {displaySlips.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <Banknote className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Belum ada slip gaji</p>
            <p className="mt-0.5">Klik 'Hitung & Buat Slip Gaji' untuk membuat slip gaji guru</p>
          </div>
        )}
      </div>

      {/* GENERATOR SLIP MODAL */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Hitung & Buat Slip Gaji Guru
              </h3>
              <button
                onClick={() => setIsGeneratorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSlip} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PILIH GURU</label>
                <select
                  value={selectedTutorId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setSelectedTutorId(tid);
                    const target = tutors.find((t) => t.id === tid);
                    if (target) {
                      setCustomTunjanganJabatan(target.tunjanganJabatan || 0);
                      setCustomTunjanganKehadiran(target.tunjanganKehadiran || 0);
                      setCustomTransport(target.transport || 0);
                    }
                  }}
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

              {/* Dropdown Bulan dan Dropdown Tahun */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PERIODE BULAN</label>
                  <select
                    value={selectedMonthIndex}
                    onChange={(e) => setSelectedMonthIndex(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TAHUN</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    {YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Riwayat Mengajar Guru pada Bulan & Tahun Terpilih */}
              {hasTaughtThisPeriod ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ditemukan Riwayat Mengajar ({selectedPeriod})</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 pl-5.5">
                    Total: <strong>{tutorMonthlyRecords.length} sesi</strong> mengajar (
                    {regularMonthlyRecords.length} sesi reguler + {homeVisitMonthlyRecords.length} sesi Home Visit) • Estimasi Total Honor Sesi:{' '}
                    <strong className="text-emerald-900 font-bold">
                      {formatRupiah(computedSessionHonorTotal)}
                    </strong>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Belum Ada Sesi Mengajar ({selectedPeriod})</span>
                  </div>
                  <p className="text-[11px] text-amber-800 pl-5.5">
                    Guru <strong>{tutors.find((t) => t.id === selectedTutorId)?.name || 'ini'}</strong> belum mengajar pada bulan{' '}
                    <strong>{selectedPeriod}</strong>. Slip gaji <strong>tidak dapat dihitung</strong> karena tidak ada riwayat presensi mengajar pada bulan tersebut.
                  </p>
                </div>
              )}

              {/* Input Manual Honor Khusus Home Visit */}
              {hasTaughtThisPeriod && homeVisitMonthlyRecords.length > 0 && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-950 text-xs">
                      <Home className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Input Manual Honor Sesi Home Visit ({homeVisitMonthlyRecords.length} Kunjungan)</span>
                    </div>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Khusus Home Visit
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-850 leading-relaxed">
                    Sesuai instruksi operasional, honor Home Visit tidak menggunakan tarif flat kelas reguler. Admin menginput nominal honor secara manual untuk setiap sesi kunjungan yang telah selesai:
                  </p>

                  <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {homeVisitMonthlyRecords.map((hv, idx) => {
                      const currentVal = getHonorForRecord(hv);
                      return (
                        <div
                          key={hv.id}
                          className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="text-[11px]">
                            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                Home Visit #{idx + 1}
                              </span>
                              <span>{formatDateIndo(hv.date)} ({hv.day})</span>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-0.5">
                              Sesi: {hv.sessionId} • Siswa ID: {hv.attendedStudentIds.join(', ') || '1 Siswa'}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-500 font-semibold shrink-0">Honor:</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={currentVal === 0 ? '' : currentVal.toLocaleString('id-ID')}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '');
                                  const num = raw === '' ? 0 : parseInt(raw, 10);
                                  setHomeVisitManualHonors((prev) => ({
                                    ...prev,
                                    [hv.id]: num,
                                  }));
                                }}
                                placeholder="0"
                                className="w-32 pl-8 pr-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 text-right focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-amber-50/20"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[11px] font-bold text-amber-900 flex justify-between pt-1 border-t border-amber-200">
                    <span>Subtotal Honor Home Visit:</span>
                    <span>{formatRupiah(totalHomeVisitHonor)}</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <p className="font-bold text-slate-800 text-[11px] flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Komponen Tunjangan & Transport</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">TUNJANGAN JABATAN</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={customTunjanganJabatan}
                      onChange={(e) => setCustomTunjanganJabatan(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">TUNJANGAN KEHADIRAN</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={customTunjanganKehadiran}
                      onChange={(e) => setCustomTunjanganKehadiran(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UANG TRANSPORT</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={customTransport}
                      onChange={(e) => setCustomTransport(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono font-medium outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CATATAN KHUSUS</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Warning if slip for this period was ALREADY paid */}
              {alreadyPaidSlip && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-900">Gaji Periode Ini Sudah Lunas</strong>
                    <span>
                      Gaji {tutors.find((t) => t.id === selectedTutorId)?.name || 'guru ini'} periode {selectedPeriod} sudah lunas dicairkan (Slip: {alreadyPaidSlip.id}). Sistem memblokir pembuatan slip baru agar tidak terjadi pembayaran ganda.
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!hasTaughtThisPeriod || !!alreadyPaidSlip}
                  className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${
                    !hasTaughtThisPeriod || !!alreadyPaidSlip
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  }`}
                  title={
                    !hasTaughtThisPeriod
                      ? 'Guru belum mengajar pada periode ini, tidak ada slip gaji yang bisa dihitung'
                      : alreadyPaidSlip
                      ? 'Gaji periode ini sudah lunas, tidak dapat digenerate ulang!'
                      : 'Hitung & Buat Slip Gaji'
                  }
                >
                  {!hasTaughtThisPeriod
                    ? 'Belum Mengajar pada Bulan Ini'
                    : alreadyPaidSlip
                    ? 'Periode Sudah Dibayar'
                    : 'Hitung & Buat Slip Gaji'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE SLIP GAJI GURU MODAL */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal actions bar */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-700">Pratinjau Slip Gaji Guru</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setActiveSlip(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Salary Slip Card */}
            <div className="p-6 printable-card bg-white text-slate-900 space-y-4 font-sans">
              {/* Slip Header */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight uppercase text-indigo-900">
                    {settings.bimbelName}
                  </h2>
                  <p className="text-[11px] text-slate-500">{settings.tagline}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{settings.address} • Telp: {settings.phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 rounded border border-slate-200">
                    {activeSlip.id}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Periode: {activeSlip.monthPeriod}
                  </p>
                </div>
              </div>

              {/* Title & Print Timestamp */}
              <div className="text-center py-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  SLIP GAJI GURU / TENAGA PENGAJAR
                </h3>
                <div className="mt-1.5 inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100/90 rounded-full text-[10px] text-slate-600 border border-slate-200/80 shadow-2xs">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span>
                    Tanggal Cetak Slip: <strong className="text-slate-800">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> pukul <strong className="text-slate-800">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
                  </span>
                </div>
              </div>

              {/* Tutor Info */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama Guru:</span>
                  <strong className="text-slate-900">{activeSlip.tutorName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ID Guru:</span>
                  <strong className="text-slate-900 font-mono">{activeSlip.tutorId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Sesi Diajar:</span>
                  <strong className="text-slate-900">{activeSlip.totalSessions} Sesi Pembelajaran</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status Pembayaran:</span>
                  <strong
                    className={activeSlip.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}
                  >
                    {activeSlip.status === 'paid' ? 'SUDAH DICAIRKAN' : 'DRAFT / MENUNGGU'}
                  </strong>
                </div>
              </div>

              {/* Salary Components Table */}
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Komponen Penghasilan</th>
                    <th className="py-2 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const hvBreakdown = activeSlip.breakdown?.filter((b: any) => b.bimbelType === 'Home Visit');
                    const regBreakdown = activeSlip.breakdown?.filter((b: any) => b.bimbelType !== 'Home Visit');
                    const hvTotal = hvBreakdown?.reduce((s, b) => s + b.honor, 0) || 0;
                    const regTotal = regBreakdown?.reduce((s, b) => s + b.honor, 0) || 0;

                    if (hvBreakdown && hvBreakdown.length > 0) {
                      return (
                        <>
                          <tr>
                            <td className="py-2 px-3">
                              Honor Kelas Reguler ({regBreakdown?.length || 0} Sesi)
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium">
                              {formatRupiah(regTotal)}
                            </td>
                          </tr>
                          <tr className="bg-amber-50/60">
                            <td className="py-2 px-3 text-amber-900 font-semibold flex items-center space-x-1.5">
                              <Home className="w-3.5 h-3.5 text-amber-600 shrink-0 inline" />
                              <span>Honor Home Visit ({hvBreakdown.length} Sesi - Manual Admin)</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                              {formatRupiah(hvTotal)}
                            </td>
                          </tr>
                        </>
                      );
                    }

                    return (
                      <tr>
                        <td className="py-2 px-3">Honor Presensi Sesi Mengajar</td>
                        <td className="py-2 px-3 text-right font-mono font-medium">
                          {formatRupiah(activeSlip.sessionHonorTotal)}
                        </td>
                      </tr>
                    );
                  })()}
                  <tr>
                    <td className="py-2 px-3">Tunjangan Jabatan</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      {formatRupiah(activeSlip.tunjanganJabatan)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Tunjangan Kehadiran</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      {formatRupiah(activeSlip.tunjanganKehadiran || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Uang Transport</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      {formatRupiah(activeSlip.transport || 0)}
                    </td>
                  </tr>
                  {activeSlip.deductions > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-rose-600">Potongan</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-rose-600">
                        -{formatRupiah(activeSlip.deductions)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 text-slate-900 uppercase">
                      TOTAL GAJI BERSIH DITERIMA:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm">
                      {formatRupiah(activeSlip.totalSalary)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="pt-4 flex items-center justify-between text-xs">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">Guru Penerima</p>
                  <div className="h-12" />
                  <p className="font-bold border-t border-slate-300 pt-1">
                    ( {activeSlip.tutorName} )
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-slate-400">Administrasi Bimbel</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 border-2 border-indigo-600 rounded px-1.5 py-0.5 rotate-[-8deg]">
                      {activeSlip.status === 'paid' ? 'LUNAS DITRANSFER' : 'VERIFIKASI BIMBEL'}
                    </span>
                  </div>
                  <p className="font-bold border-t border-slate-300 pt-1">
                    ( Administrasi Bimbel )
                  </p>
                </div>
              </div>

              {/* Action buttons at the bottom of the slip */}
              <div className="pt-4 mt-2 border-t border-slate-100 space-y-2 no-print pb-16 md:pb-0">
                {canManage && activeSlip.status !== 'paid' && (
                  <button
                    onClick={() => handlePay(activeSlip.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Cairkan Gaji Sekarang ({formatRupiah(activeSlip.totalSalary)})</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveSlip(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Keluar dari Slip Gaji</span>
                </button>
              </div>
            </div>

            {/* Mobile Fixed Bottom Exit & Action Bar */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center gap-2 no-print shadow-xl">
              <button
                onClick={() => setActiveSlip(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-300"
              >
                <X className="w-4 h-4 text-slate-600" />
                <span>Keluar</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
              {canManage && activeSlip.status !== 'paid' && (
                <button
                  onClick={() => handlePay(activeSlip.id)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Cairkan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT STATUS SLIP GAJI */}
      {slipToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Edit Status Slip Gaji Guru
                </h3>
                <p className="text-[11px] text-slate-500">{slipToEdit.tutorName} • {slipToEdit.monthPeriod}</p>
              </div>
              <button
                onClick={() => setSlipToEdit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSlip} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">STATUS PEMBAYARAN GAJI</label>
                <select
                  value={editSlipStatus}
                  onChange={(e) => setEditSlipStatus(e.target.value as 'draft' | 'paid')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="draft">Draft Gaji (Menunggu Pencairan)</option>
                  <option value="paid">Sudah Dicairkan (Lunas)</option>
                </select>
              </div>

              {editSlipStatus === 'paid' && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-2">
                  <label className="block font-semibold text-emerald-800">TANGGAL PENCAIRAN GAJI</label>
                  <input
                    type="date"
                    value={editSlipPaidDate}
                    onChange={(e) => setEditSlipPaidDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 bg-white text-slate-800 font-medium outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">TOTAL NOMINAL GAJI (RP)</label>
                <input
                  type="number"
                  value={editSlipTotalSalary}
                  onChange={(e) => setEditSlipTotalSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CATATAN SLIP GAJI</label>
                <input
                  type="text"
                  value={editSlipNotes}
                  onChange={(e) => setEditSlipNotes(e.target.value)}
                  placeholder="Keterangan pencairan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSlipToEdit(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Slip Gaji */}
      <ConfirmDeleteModal
        isOpen={!!slipToDelete}
        title="Hapus Slip Gaji"
        message="Slip gaji ini akan dihapus secara permanen dari sistem dan database Supabase."
        itemName={
          slipToDelete
            ? `${slipToDelete.tutorName} • Periode ${slipToDelete.monthPeriod} (${formatRupiah(slipToDelete.totalSalary)})`
            : ''
        }
        onConfirm={() => {
          if (slipToDelete && onDeleteSlip) {
            onDeleteSlip(slipToDelete.id);
            setSlipToDelete(null);
          }
        }}
        onCancel={() => setSlipToDelete(null)}
      />
    </div>
  );
};
