import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Trash2,
  X,
  CreditCard,
  DollarSign,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { FinancialTransaction, UserRole } from '../../types/bimbel';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface KeuanganModuleProps {
  transactions: FinancialTransaction[];
  onSaveTransaction: (trx: FinancialTransaction) => void;
  onDeleteTransaction?: (trxId: string) => void;
  userRole: UserRole;
  currentUsername: string;
}

export const KeuanganModule: React.FC<KeuanganModuleProps> = ({
  transactions,
  onSaveTransaction,
  onDeleteTransaction,
  userRole,
  currentUsername,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pemasukan' | 'pengeluaran' | 'grafik'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [trxToDelete, setTrxToDelete] = useState<FinancialTransaction | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('Tagihan Bimbel');
  const [formAmount, setFormAmount] = useState<number>(50000);
  const [formDescription, setFormDescription] = useState('');
  const [formMethod, setFormMethod] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Transfer Bank');

  const canEdit = userRole === 'super_admin' || userRole === 'admin';

  // Categories
  const PEMASUKAN_CATEGORIES = [
    'Tagihan Bimbel',
    'Pendaftaran',
    'Modul & Buku',
    'Donasi / Subsidi',
    'Lainnya',
  ];

  const PENGELUARAN_CATEGORIES = [
    'Gaji Guru',
    'Operasional & ATK',
    'Sewa & Utilitas',
    'Listrik & Internet',
    'Perlengkapan Belajar',
    'Konsumsi & Snack',
    'Lainnya',
  ];

  // Calculations
  const totalPemasukan = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const handleOpenAdd = (type: 'pemasukan' | 'pengeluaran') => {
    setModalType(type);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(type === 'pemasukan' ? 'Tagihan Bimbel' : 'Operasional & ATK');
    setFormAmount(50000);
    setFormDescription('');
    setFormMethod('Transfer Bank');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || formAmount <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }

    const payload: FinancialTransaction = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: formDate,
      type: modalType,
      category: formCategory,
      amount: Number(formAmount),
      description: formDescription || `${modalType === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} ${formCategory}`,
      paymentMethod: formMethod,
      createdBy: currentUsername,
    };

    onSaveTransaction(payload);
    setIsModalOpen(false);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pemasukan' && t.type === 'pemasukan') ||
      (activeTab === 'pengeluaran' && t.type === 'pengeluaran');
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesDate = !dateFilter || t.date === dateFilter;

    return matchesTab && matchesSearch && matchesCat && matchesDate;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Saldo Kas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Saldo Kas Bimbel
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {formatRupiah(saldoKas)}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 inline-block">
            Net Kas Berjalan
          </span>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pemasukan
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-2 font-mono">
            {formatRupiah(totalPemasukan)}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
            SPP, Tagihan & Registrasi
          </span>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-2 font-mono">
            {formatRupiah(totalPengeluaran)}
          </p>
          <span className="text-[11px] text-rose-700 font-medium mt-1 inline-block">
            Gaji Guru & Operasional
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Sub-tabs header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Semua Transaksi ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('pemasukan')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'pemasukan'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Module Pemasukan
            </button>
            <button
              onClick={() => setActiveTab('pengeluaran')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'pengeluaran'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Module Pengeluaran
            </button>
            <button
              onClick={() => setActiveTab('grafik')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                activeTab === 'grafik'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Grafik Keuangan</span>
            </button>
          </div>

          {canEdit && activeTab !== 'grafik' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenAdd('pemasukan')}
                className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pemasukan</span>
              </button>
              <button
                onClick={() => handleOpenAdd('pengeluaran')}
                className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pengeluaran</span>
              </button>
            </div>
          )}
        </div>

        {/* Content View */}
        {activeTab !== 'grafik' ? (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi berdasarkan keterangan atau ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 outline-none"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:border-indigo-500 outline-none"
              >
                <option value="all">Semua Kategori</option>
                {Array.from(new Set([...PEMASUKAN_CATEGORIES, ...PENGELUARAN_CATEGORIES])).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Transaction List (Mobile Cards) */}
            <div className="space-y-2.5">
              {filteredTransactions.map((trx) => {
                const isIncome = trx.type === 'pemasukan';
                return (
                  <div
                    key={trx.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {trx.description}
                          </h4>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {trx.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateIndo(trx.date)} • {trx.paymentMethod} • dicatat oleh @
                          {trx.createdBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span
                          className={`font-mono font-extrabold text-sm sm:text-base ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatRupiah(trx.amount)}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {trx.id}
                        </span>
                      </div>

                      {canEdit && onDeleteTransaction && (
                        <button
                          onClick={() => setTrxToDelete(trx)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredTransactions.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Tidak ada catatan transaksi</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* GRAFIK & ANALISIS KEUANGAN */
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cashflow visual comparison */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-3">
                  Perbandingan Pemasukan vs Pengeluaran
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-700">Pemasukan</span>
                      <span className="font-mono text-emerald-700">
                        {formatRupiah(totalPemasukan)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalPemasukan + totalPengeluaran > 0
                              ? (totalPemasukan / (totalPemasukan + totalPengeluaran)) * 100
                              : 50
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-rose-700">Pengeluaran</span>
                      <span className="font-mono text-rose-700">
                        {formatRupiah(totalPengeluaran)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalPemasukan + totalPengeluaran > 0
                              ? (totalPengeluaran / (totalPemasukan + totalPengeluaran)) * 100
                              : 50
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Laba Bersih Kas:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      saldoKas >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatRupiah(saldoKas)}
                  </span>
                </div>
              </div>

              {/* Breakdown by Category */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-3">
                  Komposisi Kategori Transaksi
                </h4>
                <div className="space-y-2.5 text-xs max-h-56 overflow-y-auto">
                  {PEMASUKAN_CATEGORIES.map((cat) => {
                    const amount = transactions
                      .filter((t) => t.type === 'pemasukan' && t.category === cat)
                      .reduce((s, t) => s + t.amount, 0);
                    if (amount === 0) return null;
                    return (
                      <div
                        key={`income-${cat}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-medium text-slate-700">{cat}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {formatRupiah(amount)}
                        </span>
                      </div>
                    );
                  })}
                  {PENGELUARAN_CATEGORIES.map((cat) => {
                    const amount = transactions
                      .filter((t) => t.type === 'pengeluaran' && t.category === cat)
                      .reduce((s, t) => s + t.amount, 0);
                    if (amount === 0) return null;
                    return (
                      <div
                        key={`expense-${cat}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="font-medium text-slate-700">{cat}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {formatRupiah(amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Transaksi (Pemasukan / Pengeluaran) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                modalType === 'pemasukan' ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
              }`}
            >
              <h3 className="font-bold text-sm sm:text-base">
                {modalType === 'pemasukan' ? '+ Catat Pemasukan Baru' : '+ Catat Pengeluaran Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">TANGGAL TRANSAKSI</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">KATEGORI</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    {(modalType === 'pemasukan' ? PEMASUKAN_CATEGORIES : PENGELUARAN_CATEGORIES).map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">METODE BAYAR</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai">Tunai</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NOMINAL (RP)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">KETERANGAN</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pembayaran SPP Mingguan..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 outline-none resize-none"
                />
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
                  className={`px-5 py-2 text-white rounded-xl font-bold shadow-sm ${
                    modalType === 'pemasukan'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Transaksi */}
      <ConfirmDeleteModal
        isOpen={!!trxToDelete}
        title="Hapus Transaksi Keuangan"
        message="Catatan transaksi ini akan dihapus secara permanen dari sistem dan database Supabase."
        itemName={
          trxToDelete
            ? `${trxToDelete.type.toUpperCase()}: ${trxToDelete.description} (${formatRupiah(trxToDelete.amount)})`
            : ''
        }
        onConfirm={() => {
          if (trxToDelete && onDeleteTransaction) {
            onDeleteTransaction(trxToDelete.id);
            setTrxToDelete(null);
          }
        }}
        onCancel={() => setTrxToDelete(null)}
      />
    </div>
  );
};
