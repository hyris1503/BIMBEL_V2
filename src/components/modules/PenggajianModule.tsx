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
  userRole: UserRole;
  currentTutorId?: string;
}

const MONTH_OPTIONS = [
  'Januari 2026',
  'Februari 2026',
  'Maret 2026',
  'April 2026',
  'Mei 2026',
  'Juni 2026',
  'Juli 2026',
  'Agustus 2026',
  'September 2026',
  'Oktober 2026',
  'November 2026',
  'Desember 2026',
];

export const PenggajianModule: React.FC<PenggajianModuleProps> = ({
  slips,
  tutors,
  attendanceRecords,
  settings,
  onSaveSlip,
  onPaySalary,
  onDeleteSlip,
  userRole,
  currentTutorId,
}) => {
  const [activeSlip, setActiveSlip] = useState<SalarySlip | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [slipToDelete, setSlipToDelete] = useState<SalarySlip | null>(null);

  // Generator form
  const [selectedTutorId, setSelectedTutorId] = useState<string>(tutors[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('Oktober 2026');
  const [customTunjanganJabatan, setCustomTunjanganJabatan] = useState<number>(0);
  const [customTunjanganKehadiran, setCustomTunjanganKehadiran] = useState<number>(0);
  const [customTransport, setCustomTransport] = useState<number>(0);
  const [customDeduction, setCustomDeduction] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const canManage = userRole === 'super_admin' || userRole === 'admin';

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
    setIsGeneratorModalOpen(true);
  };

  const handleGenerateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const tutor = tutors.find((t) => t.id === selectedTutorId);
    if (!tutor) {
      alert('Pilih guru terlebih dahulu');
      return;
    }

    const tutorRecords = attendanceRecords.filter((a) => a.tutorId === tutor.id);
    const breakdown = tutorRecords.map((rec) => ({
      date: rec.date,
      day: rec.day,
      sessionId: rec.sessionId,
      studentCount: rec.attendedStudentIds.length,
      honor: rec.honorEarned,
    }));

    const sessionHonorTotal = breakdown.reduce((sum, item) => sum + item.honor, 0);
    const totalStudentsTaught = breakdown.reduce((sum, item) => sum + item.studentCount, 0);
    const totalSalary =
      sessionHonorTotal +
      customTunjanganJabatan +
      customTunjanganKehadiran +
      customTransport -
      customDeduction;

    const newSlip: SalarySlip = {
      id: `SLIP-${Date.now().toString().slice(-6)}`,
      tutorId: tutor.id,
      tutorName: tutor.name,
      monthPeriod: selectedMonth,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
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
    setSuccessMessage(`Slip gaji untuk ${tutor.name} periode ${selectedMonth} berhasil dibuat!`);
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

              {/* Bulan Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PERIODE BULAN</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Generate Slip Gaji
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

              {/* Title */}
              <div className="text-center py-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  SLIP GAJI GURU / TENAGA PENGAJAR
                </h3>
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
                  <tr>
                    <td className="py-2 px-3">Honor Presensi Sesi Mengajar</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      {formatRupiah(activeSlip.sessionHonorTotal)}
                    </td>
                  </tr>
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
    </div>
  );
};
