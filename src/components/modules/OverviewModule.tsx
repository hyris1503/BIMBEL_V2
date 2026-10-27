import React, { useMemo } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Wallet,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import {
  Student,
  Tutor,
  AttendanceRecord,
  FinancialTransaction,
  StudentBill,
  ScheduleItem,
  UserAccount,
} from '../../types/bimbel';
import { formatRupiah, formatDateIndo, getDayNameIndo } from '../../utils/formatters';
import { NavTabId } from '../Navigation';

interface OverviewModuleProps {
  currentUser: UserAccount | null;
  students: Student[];
  tutors: Tutor[];
  attendanceRecords: AttendanceRecord[];
  transactions: FinancialTransaction[];
  bills: StudentBill[];
  schedules: ScheduleItem[];
  onNavigateTab: (tab: NavTabId) => void;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  currentUser,
  students,
  tutors,
  attendanceRecords,
  transactions,
  bills,
  schedules,
  onNavigateTab,
}) => {
  const totalPemasukan = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPengeluaran = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const saldoKas = totalPemasukan - totalPengeluaran;

  const unpaidBills = bills.filter((b) => b.status === 'unpaid');
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.totalAmount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDay = getDayNameIndo(todayStr);
  const todaySchedules = schedules.filter((s) => s.day === todayDay);

  // Line Chart Data Preparation:
  // Above 0 = Pemasukan (+), Below 0 = Pengeluaran (-)
  const chartPoints = useMemo(() => {
    // Group transactions by date or take the last 7 distinct transaction points
    const sorted = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));

    if (sorted.length === 0) {
      return [];
    }

    // Map each transaction into a point where pemasukan is positive, pengeluaran is negative
    return sorted.map((trx, idx) => ({
      id: trx.id,
      index: idx,
      date: trx.date,
      type: trx.type,
      category: trx.category,
      label: trx.description,
      // Value: positive for income, negative for expense
      value: trx.type === 'pemasukan' ? trx.amount : -trx.amount,
      rawAmount: trx.amount,
    }));
  }, [transactions]);

  // Compute SVG dimensions & scaling
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 30;
  const innerHeight = chartHeight - paddingY * 2;
  const innerWidth = chartWidth - paddingX * 2;
  const zeroY = paddingY + innerHeight / 2; // Middle baseline (0)

  // Maximum absolute value for symmetric Y-scaling
  const maxAbsValue = useMemo(() => {
    if (chartPoints.length === 0) return 100000;
    const max = Math.max(...chartPoints.map((p) => Math.abs(p.value)));
    return max > 0 ? max * 1.2 : 100000;
  }, [chartPoints]);

  const getYCoordinate = (val: number) => {
    // val > 0 -> above zeroY (towards paddingY)
    // val < 0 -> below zeroY (towards chartHeight - paddingY)
    const ratio = val / maxAbsValue;
    return zeroY - ratio * (innerHeight / 2);
  };

  const getXCoordinate = (index: number, total: number) => {
    if (total <= 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (total - 1)) * innerWidth;
  };

  // Build SVG Path
  const svgPath = useMemo(() => {
    if (chartPoints.length < 2) return '';
    return chartPoints.reduce((acc, pt, idx) => {
      const x = getXCoordinate(idx, chartPoints.length);
      const y = getYCoordinate(pt.value);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [chartPoints, maxAbsValue]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner - Without previous dummy descriptive text */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-800 rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Selamat Datang, {currentUser?.name || 'Administrator'}
          </h1>

          <div className="flex flex-wrap gap-2.5 mt-4">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-4 py-2 bg-white text-indigo-900 rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-50 transition-all flex items-center space-x-1.5"
            >
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <span>Input Presensi</span>
            </button>
            <button
              onClick={() => onNavigateTab('billing')}
              className="px-4 py-2 bg-indigo-700/80 hover:bg-indigo-700 border border-white/20 text-white rounded-xl font-semibold text-xs transition-all flex items-center space-x-1.5"
            >
              <Receipt className="w-4 h-4 text-indigo-200" />
              <span>Tagihan Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Siswa */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Siswa
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {students.length}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {students.length} siswa terdaftar
          </span>
        </div>

        {/* Guru */}
        <div
          onClick={() => onNavigateTab('tutors')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tenaga Pengajar
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {tutors.length}
          </p>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            {tutors.filter((t) => t.status === 'active').length} guru aktif
          </span>
        </div>

        {/* Saldo Kas */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Kas Bimbel
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(saldoKas)}
          </p>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">
            Net saldo operasional
          </span>
        </div>

        {/* Tagihan Menunggu */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Menunggu Pembayaran
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-2 font-mono">
            {formatRupiah(unpaidTotal)}
          </p>
          <span className="text-[10px] text-amber-700 mt-0.5 block">
            {unpaidBills.length} tagihan belum lunas
          </span>
        </div>
      </div>

      {/* GRAFIK KEUANGAN DIAGRAM GARIS (DIATAS 0 = PEMASUKAN, DIBAWAH 0 = PENGELUARAN) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Diagram Garis Arus Kas Keuangan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Titik di atas garis nol (positif) adalah Pemasukan, dan titik di bawah garis nol
              (negatif) adalah Pengeluaran
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Pemasukan (&gt; 0)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-rose-700">Pengeluaran (&lt; 0)</span>
            </div>
          </div>
        </div>

        {/* SVG Line Chart */}
        <div className="mt-4 w-full overflow-x-auto">
          <div className="min-w-[550px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 select-none overflow-visible"
            >
              {/* Background gradient zones */}
              {/* Positive zone (Pemasukan) */}
              <rect
                x={paddingX}
                y={paddingY}
                width={innerWidth}
                height={zeroY - paddingY}
                fill="#f0fdf4"
                opacity="0.5"
              />
              {/* Negative zone (Pengeluaran) */}
              <rect
                x={paddingX}
                y={zeroY}
                width={innerWidth}
                height={chartHeight - paddingY - zeroY}
                fill="#fff1f2"
                opacity="0.5"
              />

              {/* Zero Baseline (Sumbu Y = 0) */}
              <line
                x1={paddingX}
                y1={zeroY}
                x2={chartWidth - paddingX}
                y2={zeroY}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 6}
                y={zeroY + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-500 font-bold font-mono"
              >
                Rp 0
              </text>

              {/* Top positive boundary indicator */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={paddingY + 4}
                textAnchor="end"
                className="text-[9px] fill-emerald-600 font-bold font-mono"
              >
                +{formatRupiah(maxAbsValue)}
              </text>

              {/* Bottom negative boundary indicator */}
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={chartHeight - paddingY + 4}
                textAnchor="end"
                className="text-[9px] fill-rose-600 font-bold font-mono"
              >
                -{formatRupiah(maxAbsValue)}
              </text>

              {/* Chart Line */}
              {svgPath && (
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {chartPoints.map((pt, idx) => {
                const cx = getXCoordinate(idx, chartPoints.length);
                const cy = getYCoordinate(pt.value);
                const isPositive = pt.value >= 0;

                return (
                  <g key={pt.id} className="cursor-pointer group">
                    {/* Vertical guideline */}
                    <line
                      x1={cx}
                      y1={zeroY}
                      x2={cx}
                      y2={cy}
                      stroke={isPositive ? '#10b981' : '#f43f5e'}
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />

                    {/* Point Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5"
                      fill={isPositive ? '#10b981' : '#f43f5e'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Label */}
                    <text
                      x={cx}
                      y={isPositive ? cy - 10 : cy + 16}
                      textAnchor="middle"
                      className={`text-[9px] font-bold font-mono ${
                        isPositive ? 'fill-emerald-700' : 'fill-rose-700'
                      }`}
                    >
                      {isPositive ? '+' : '-'}
                      {formatRupiah(pt.rawAmount)}
                    </text>

                    {/* Date label at bottom */}
                    <text
                      x={cx}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      {pt.date.split('-').slice(1).join('/')}
                    </text>
                  </g>
                );
              })}

              {/* Empty state illustration if 0 points */}
              {chartPoints.length === 0 && (
                <text
                  x={chartWidth / 2}
                  y={zeroY - 14}
                  textAnchor="middle"
                  className="text-xs fill-slate-400 font-medium"
                >
                  Belum ada catatan transaksi pemasukan atau pengeluaran
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jadwal Hari Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Jadwal Hari Ini ({todayDay})
              </h3>
              <p className="text-xs text-slate-500">Sesi bimbingan yang terjadwal hari ini</p>
            </div>
            <button
              onClick={() => onNavigateTab('schedules')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <span>Jadwal Lengkap</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {todaySchedules.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    S{item.sessionId}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {item.tutorName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {item.sessionTime} • {item.bimbelType} ({item.studentNames.length} Siswa)
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {todaySchedules.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada jadwal bimbingan belajar pada hari ini.
              </div>
            )}
          </div>
        </div>

        {/* Presensi Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Presensi Terbaru</h3>
              <p className="text-xs text-slate-500">Rekap kehadiran sesi bimbingan</p>
            </div>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <span>Semua Presensi</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {attendanceRecords.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{rec.tutorName}</h4>
                  <p className="text-[11px] text-slate-500">
                    {formatDateIndo(rec.date)} • Sesi {rec.sessionId} ({rec.attendedStudentNames.length} hadir)
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {formatRupiah(rec.honorEarned)}
                  </span>
                </div>
              </div>
            ))}

            {attendanceRecords.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data absensi yang dicatat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
