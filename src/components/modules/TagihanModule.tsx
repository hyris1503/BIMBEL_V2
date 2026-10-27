import React, { useState } from 'react';
import {
  Receipt,
  Calendar,
  CheckCircle,
  Clock,
  Printer,
  Share2,
  MessageCircle,
  Sparkles,
  Download,
  AlertCircle,
  X,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  StudentBill,
  Student,
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

interface TagihanModuleProps {
  bills: StudentBill[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: BimbelPricingSettings;
  onSaveBill: (bill: StudentBill) => void;
  onMarkPaid: (billId: string, paymentMethod: string) => void;
  onDeleteBill?: (billId: string) => void;
  userRole: UserRole;
}

export const TagihanModule: React.FC<TagihanModuleProps> = ({
  bills,
  students,
  attendanceRecords,
  settings,
  onSaveBill,
  onMarkPaid,
  onDeleteBill,
  userRole,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlip, setActiveSlip] = useState<StudentBill | null>(null);
  const [paymentMethodModal, setPaymentMethodModal] = useState<StudentBill | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'Transfer Bank' | 'Tunai' | 'QRIS'>('Transfer Bank');
  const [billToDelete, setBillToDelete] = useState<StudentBill | null>(null);

  const canManage = userRole === 'super_admin' || userRole === 'admin';

  // Stats
  const unpaidCount = bills.filter((b) => b.status === 'unpaid').length;
  const unpaidTotal = bills
    .filter((b) => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const paidTotal = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Generate automated weekly bills from attendance
  const handleAutoGenerateWeeklyBills = () => {
    // Current week Kamis calculation
    const now = new Date();
    // Find next or recent Thursday
    const d = new Date(now);
    const day = d.getDay(); // 0 is Sun, 4 is Thu
    const diffToThursday = (4 - day + 7) % 7;
    d.setDate(d.getDate() + diffToThursday);
    const thursdayDateStr = d.toISOString().split('T')[0];

    const currentWeekPeriod = `Minggu ke-4 Oktober 2026 (Jatuh Tempo Kamis, ${formatDateIndo(
      thursdayDateStr
    )})`;

    let generatedCount = 0;
    const newBills: StudentBill[] = [];

    students.forEach((student) => {
      // Check how many attendances student has
      const studentAttendances = attendanceRecords.filter((att) =>
        att.attendedStudentIds.includes(student.id)
      );
      const attendedCount = studentAttendances.length;

      // Business Rule:
      // Kelompok: "jika 1 hari masuk tetap membayar 20rb, jika tidak datang sama sekali baru tidak membayar"
      let rate = settings.kelompokPrice;
      let total = 0;

      if (student.bimbelType === 'Kelompok') {
        rate = settings.kelompokPrice;
        if (attendedCount > 0) {
          total = attendedCount * rate; // e.g. 20.000 per day attendance
        } else {
          total = 0; // tidak datang sama sekali = tidak bayar
        }
      } else if (student.bimbelType === 'Privat 3') {
        rate = settings.privat3Price;
        total = attendedCount * rate;
      } else if (student.bimbelType === 'Privat 1') {
        rate = settings.privat1Price;
        total = attendedCount * rate;
      } else if (student.bimbelType === 'Home Visit') {
        rate = settings.homeVisitPrice;
        total = attendedCount * rate;
      }

      // If total > 0, create bill if not already exists for this week
      if (total > 0) {
        const alreadyBilled = bills.find(
          (b) => b.studentId === student.id && b.weekPeriod === currentWeekPeriod
        );

        if (!alreadyBilled) {
          const newBill: StudentBill = {
            id: `BIL-${Date.now().toString().slice(-4)}-${student.id}`,
            studentId: student.id,
            studentName: student.name,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            bimbelType: student.bimbelType,
            weekPeriod: currentWeekPeriod,
            dueDate: thursdayDateStr,
            attendanceCount: attendedCount,
            ratePerDay: rate,
            totalAmount: total,
            status: 'unpaid',
            receiptNumber: `KWT-${Date.now().toString().slice(-6)}`,
            notes: `Tagihan mingguan sesi Senin - Kamis (${attendedCount}x kehadiran)`,
          };
          onSaveBill(newBill);
          generatedCount++;
        }
      }
    });

    if (generatedCount > 0) {
      alert(`Berhasil generate ${generatedCount} tagihan mingguan baru!`);
    } else {
      alert('Semua siswa yang hadir minggu ini sudah memiliki tagihan.');
    }
  };

  const handleConfirmPay = (bill: StudentBill) => {
    onMarkPaid(bill.id, selectedMethod);
    setPaymentMethodModal(null);
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const filteredBills = bills.filter((b) => {
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch =
      b.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.parentPhone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Tagihan Siswa Mingguan & Kuitansi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan tagihan per kehadiran siswa (Kelompok: min. 1x hadir bayar 20rb, tidak hadir = 0)
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleAutoGenerateWeeklyBills}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Generate Tagihan Minggu Ini</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Menunggu Pembayaran</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 mt-2 font-mono">
            {formatRupiah(unpaidTotal)}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {unpaidCount} siswa belum lunas
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sudah Lunas Terbayar</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-2 font-mono">
            {formatRupiah(paidTotal)}
          </p>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            Masuk otomatis ke kas pemasukan
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Aturan Tagihan Kelompok</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 mt-2">
            Rp 20.000 / Kehadiran
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Hadir 1 hari tetap bayar, tidak datang = bebas tagihan
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa, nomor kuitansi, atau nomor HP wali..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          {(['all', 'unpaid', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'all' ? 'Semua' : st === 'unpaid' ? 'Belum Bayar' : 'Lunas'}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Cards (Mobile App First) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredBills.map((bill) => {
          const isPaid = bill.status === 'paid';
          return (
            <div
              key={bill.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {bill.receiptNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{bill.studentName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{bill.bimbelType}</p>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isPaid ? '✓ LUNAS' : 'BELUM BAYAR'}
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Periode:</span>
                    <span className="text-slate-700 font-medium truncate max-w-[170px]">
                      {bill.weekPeriod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kehadiran Sesi:</span>
                    <span className="text-slate-900 font-semibold">{bill.attendanceCount} Hari Masuk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tarif Satuan:</span>
                    <span className="font-mono text-slate-700">{formatRupiah(bill.ratePerDay)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-800">Total Tagihan:</span>
                    <span className="font-mono font-extrabold text-indigo-600 text-sm">
                      {formatRupiah(bill.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {/* Print Slip Button */}
                <button
                  onClick={() => setActiveSlip(bill)}
                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs border border-slate-200 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Lihat Slip</span>
                </button>

                {/* WhatsApp Slip Link */}
                <a
                  href={createWhatsAppLink(
                    bill.parentPhone,
                    `Halo Bapak/Ibu ${bill.parentName || 'Wali'}, berikut rincian tagihan bimbel ananda ${bill.studentName} untuk ${bill.weekPeriod}. Total tagihan: ${formatRupiah(bill.totalAmount)} (${bill.attendanceCount}x sesi masuk). Status: ${isPaid ? 'LUNAS (Terima Kasih)' : 'Menunggu pembayaran jatuh tempo hari Kamis'}. Terima kasih - BimbelSmart.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all"
                  title="Kirim ke WhatsApp Wali"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                {/* Delete button */}
                {canManage && onDeleteBill && (
                  <button
                    onClick={() => setBillToDelete(bill)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Hapus Tagihan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Mark as paid button */}
                {canManage && !isPaid && (
                  <button
                    onClick={() => setPaymentMethodModal(bill)}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Tandai Lunas</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredBills.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Tidak ada data tagihan</p>
            <p className="mt-0.5">Klik 'Generate Tagihan Minggu Ini' untuk menghitung otomatis dari absensi</p>
          </div>
        )}
      </div>

      {/* MODAL PILIH METODE BAYAR */}
      {paymentMethodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-1">Konfirmasi Pembayaran</h3>
            <p className="text-xs text-slate-500 mb-4">
              Tandai tagihan {paymentMethodModal.studentName} sebesar{' '}
              <strong className="text-indigo-600 font-mono">
                {formatRupiah(paymentMethodModal.totalAmount)}
              </strong>{' '}
              sebagai lunas.
            </p>

            <div className="space-y-2 mb-5">
              {(['Transfer Bank', 'Tunai', 'QRIS'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                    selectedMethod === method
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{method}</span>
                  {selectedMethod === method && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPaymentMethodModal(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPay(paymentMethodModal)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Ya, Lunaskan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE SLIP / KUITANSI MODAL */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal actions bar */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print sticky top-0 z-20">
              <span className="text-xs font-bold text-slate-700">Pratinjau Kuitansi Siswa</span>
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
                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                  title="Keluar dari Kuitansi"
                >
                  <X className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            {/* Official Kuitansi Body (Printable Card) */}
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
                    {activeSlip.receiptNumber}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Jatuh Tempo: {formatDateIndo(activeSlip.dueDate)}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                  KUITANSI PEMBAYARAN BIMBEL MINGGUAN
                </h3>
                <p className="text-[11px] text-slate-500">{activeSlip.weekPeriod}</p>
              </div>

              {/* Student info */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama Siswa:</span>
                  <strong className="text-slate-900">{activeSlip.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Wali Murid:</span>
                  <strong className="text-slate-900">{activeSlip.parentName || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Jenis Bimbel:</span>
                  <strong className="text-slate-900">{activeSlip.bimbelType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status Tagihan:</span>
                  <strong
                    className={activeSlip.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}
                  >
                    {activeSlip.status === 'paid' ? 'LUNAS TERBAYAR' : 'MENUNGGU PEMBAYARAN'}
                  </strong>
                </div>
              </div>

              {/* Line items table */}
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Deskripsi Layanan</th>
                    <th className="py-2 px-3 text-center">Sesi Masuk</th>
                    <th className="py-2 px-3 text-right">Tarif / Hari</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3">
                      Bimbingan Belajar {activeSlip.bimbelType}
                      <span className="block text-[10px] text-slate-400">
                        {activeSlip.notes || 'Sesi pembelajaran rutin'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {activeSlip.attendanceCount} Hari
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatRupiah(activeSlip.ratePerDay)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {formatRupiah(activeSlip.totalAmount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right text-slate-800">
                      TOTAL PEMBAYARAN:
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-indigo-700 text-sm">
                      {formatRupiah(activeSlip.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures & Stamp */}
              <div className="pt-4 flex items-center justify-between text-xs">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">Penerima / Wali Siswa</p>
                  <div className="h-12" />
                  <p className="font-bold border-t border-slate-300 pt-1">
                    ( {activeSlip.parentName || 'Wali Murid'} )
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-slate-400">
                    Bandung, {formatDateIndo(activeSlip.dueDate)}
                  </p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 border-2 border-emerald-500 rounded px-1.5 py-0.5 rotate-[-8deg]">
                      {activeSlip.status === 'paid' ? 'LUNAS - BIMBEL' : 'TAGIHAN RESMI'}
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
                    onClick={() => {
                      const slipToPay = activeSlip;
                      setActiveSlip(null);
                      setPaymentMethodModal(slipToPay);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Tandai Lunas Sekarang ({formatRupiah(activeSlip.totalAmount)})</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveSlip(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Keluar dari Pratinjau Kuitansi</span>
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
                  onClick={() => {
                    const slipToPay = activeSlip;
                    setActiveSlip(null);
                    setPaymentMethodModal(slipToPay);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Lunaskan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Tagihan */}
      <ConfirmDeleteModal
        isOpen={!!billToDelete}
        title="Hapus Data Tagihan"
        message="Tagihan ini akan dihapus secara permanen dari sistem dan database Supabase."
        itemName={
          billToDelete
            ? `${billToDelete.studentName} • ${billToDelete.receiptNumber} (${formatRupiah(billToDelete.totalAmount)})`
            : ''
        }
        onConfirm={() => {
          if (billToDelete && onDeleteBill) {
            onDeleteBill(billToDelete.id);
            setBillToDelete(null);
          }
        }}
        onCancel={() => setBillToDelete(null)}
      />
    </div>
  );
};
