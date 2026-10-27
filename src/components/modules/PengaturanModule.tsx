import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  Building,
  Save,
  Database,
  Award,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { BimbelPricingSettings, UserRole } from '../../types/bimbel';
import { formatRupiah } from '../../utils/formatters';

interface PengaturanModuleProps {
  settings: BimbelPricingSettings;
  onSaveSettings: (settings: BimbelPricingSettings) => void;
  onOpenSupabase: () => void;
  userRole: UserRole;
}

export const PengaturanModule: React.FC<PengaturanModuleProps> = ({
  settings,
  onSaveSettings,
  onOpenSupabase,
  userRole,
}) => {
  const [formSettings, setFormSettings] = useState<BimbelPricingSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const canEdit = userRole === 'super_admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Pengaturan Bimbel & Tarif Sesi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan nama bimbel, tarif masing-masing jenis bimbingan, dan aturan honor guru
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSupabase}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
        >
          <Database className="w-4 h-4" />
          <span>Koneksi Database Supabase</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profil Bimbel */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Profil Resmi Lembaga Bimbingan Belajar</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NAMA BIMBEL</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formSettings.bimbelName}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, bimbelName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">TAGLINE / SLOGAN</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formSettings.tagline}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, tagline: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NOMOR TELEPON / WA</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formSettings.phone}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, phone: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:border-indigo-500 outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ALAMAT BIMBEL</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formSettings.address}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, address: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Tarif Jenis Bimbel (Input Sendiri Sesuai Brief) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Tarif Jenis Bimbel (Input Harga Sendiri)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarif dihitung per hari kehadiran (Tagihan jatuh tempo setiap hari Kamis)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Kelompok */}
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-blue-900">1. Kelas Kelompok</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                  Maksimal 6 Anak
                </span>
              </div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                Tarif per hari kehadiran (Rp):
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                disabled={!canEdit}
                value={formSettings.kelompokPrice}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    kelompokPrice: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm focus:border-blue-500 outline-none"
              />
              <p className="text-[10px] text-blue-700 mt-1">
                * Aturan: Hadir 1 hari tetap bayar Rp 20.000, tidak hadir sama sekali = tidak bayar.
              </p>
            </div>

            {/* Privat 3 */}
            <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-purple-900">2. Kelas Privat 3</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">
                  Maksimal 3 Anak
                </span>
              </div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                Tarif per sesi kehadiran (Rp):
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                disabled={!canEdit}
                value={formSettings.privat3Price}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    privat3Price: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm focus:border-purple-500 outline-none"
              />
            </div>

            {/* Privat 1 */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-amber-900">3. Kelas Privat 1</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                  1 Anak
                </span>
              </div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                Tarif per sesi kehadiran (Rp):
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                disabled={!canEdit}
                value={formSettings.privat1Price}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    privat1Price: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm focus:border-amber-500 outline-none"
              />
            </div>

            {/* Home Visit */}
            <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-rose-900">4. Kelas Home Visit</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-semibold">
                  Datang ke Rumah (1 Anak)
                </span>
              </div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                Tarif per sesi kehadiran (Rp):
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                disabled={!canEdit}
                value={formSettings.homeVisitPrice}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    homeVisitPrice: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm focus:border-rose-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rumus Gaji Guru */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Rumus Honor Sesi Pengajar</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aturan perhitungan: 1 anak dalam 1 sesi = Rp 9.000, kenaikan Rp 1.000 per penambahan anak
              (maks 6 anak).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                TARIF DASAR (1 ANAK PER SESI)
              </label>
              <input
                type="number"
                step="500"
                min="0"
                disabled={!canEdit}
                value={formSettings.tutorBaseRate}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    tutorBaseRate: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:border-indigo-500 outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                KENAIKAN PER TAMBAHAN ANAK
              </label>
              <input
                type="number"
                step="500"
                min="0"
                disabled={!canEdit}
                value={formSettings.tutorIncrementPerStudent}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    tutorIncrementPerStudent: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:border-indigo-500 outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
            <span className="font-semibold text-slate-700">Simulasi Honor Guru Sesi Kelompok:</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1 font-mono text-[11px]">
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">1 Anak</span>
                <strong>{formatRupiah(formSettings.tutorBaseRate)}</strong>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">2 Anak</span>
                <strong>
                  {formatRupiah(formSettings.tutorBaseRate + formSettings.tutorIncrementPerStudent * 1)}
                </strong>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">3 Anak</span>
                <strong>
                  {formatRupiah(formSettings.tutorBaseRate + formSettings.tutorIncrementPerStudent * 2)}
                </strong>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">4 Anak</span>
                <strong>
                  {formatRupiah(formSettings.tutorBaseRate + formSettings.tutorIncrementPerStudent * 3)}
                </strong>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">5 Anak</span>
                <strong>
                  {formatRupiah(formSettings.tutorBaseRate + formSettings.tutorIncrementPerStudent * 4)}
                </strong>
              </div>
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">6 Anak (Maks)</span>
                <strong>
                  {formatRupiah(formSettings.tutorBaseRate + formSettings.tutorIncrementPerStudent * 5)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                ✓ Pengaturan berhasil disimpan!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
