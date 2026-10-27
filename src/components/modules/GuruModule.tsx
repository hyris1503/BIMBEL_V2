import React, { useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Search,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  Award,
} from 'lucide-react';
import { Tutor, UserRole } from '../../types/bimbel';
import { formatRupiah, createWhatsAppLink } from '../../utils/formatters';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface GuruModuleProps {
  tutors: Tutor[];
  onSaveTutor: (tutor: Tutor) => void;
  onDeleteTutor: (tutorId: string) => void;
  userRole: UserRole;
}

export const GuruModule: React.FC<GuruModuleProps> = ({
  tutors,
  onSaveTutor,
  onDeleteTutor,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTunjanganJabatan, setFormTunjanganJabatan] = useState<number>(0);
  const [formTunjanganKehadiran, setFormTunjanganKehadiran] = useState<number>(0);
  const [formTransport, setFormTransport] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const canEdit = userRole === 'super_admin';

  const handleOpenAdd = () => {
    const nextNum = tutors.length + 1;
    const autoId = `GRU-${String(nextNum).padStart(3, '0')}`;
    setEditingTutor(null);
    setFormId(autoId);
    setFormName('');
    setFormPhone('');
    setFormTunjanganJabatan(0);
    setFormTunjanganKehadiran(0);
    setFormTransport(0);
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tutor: Tutor) => {
    setEditingTutor(tutor);
    setFormId(tutor.id);
    setFormName(tutor.name);
    setFormPhone(tutor.phone);
    setFormTunjanganJabatan(tutor.tunjanganJabatan || 0);
    setFormTunjanganKehadiran(tutor.tunjanganKehadiran || 0);
    setFormTransport(tutor.transport || 0);
    setFormStatus(tutor.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('Nama guru dan nomor HP wajib diisi');
      return;
    }

    const payload: Tutor = {
      id: formId.trim() || `GRU-${Date.now().toString().slice(-3)}`,
      name: formName.trim(),
      phone: formPhone.trim(),
      tunjanganJabatan: Number(formTunjanganJabatan) || 0,
      tunjanganKehadiran: Number(formTunjanganKehadiran) || 0,
      transport: Number(formTransport) || 0,
      status: formStatus,
    };

    onSaveTutor(payload);
    setIsModalOpen(false);
  };

  const filteredTutors = tutors.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Manajemen Guru / Tutor</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
              {tutors.length} Guru
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar tenaga pengajar bimbel dan tunjangan
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Guru Baru</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari guru berdasarkan nama atau ID..."
          className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
        />
      </div>

      {/* Guru Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredTutors.map((tutor) => (
          <div
            key={tutor.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-sm">
                    {tutor.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {tutor.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">
                      {tutor.name}
                    </h3>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    tutor.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tutor.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Tunjangan Info */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{tutor.phone}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tunjangan Jabatan:</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(tutor.tunjanganJabatan || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tunjangan Kehadiran:</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(tutor.tunjanganKehadiran || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uang Transport:</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(tutor.transport || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={createWhatsAppLink(
                  tutor.phone,
                  `Halo ${tutor.name}, kami dari tim administrasi BimbelSmart.`
                )}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-xs transition-all border border-emerald-200"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>

              {canEdit && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(tutor)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Edit Data Guru"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTutorToDelete(tutor)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Hapus Guru"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredTutors.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Belum ada data guru</p>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingTutor ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID GURU</label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">STATUS</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NAMA LENGKAP GURU</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Guru"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NOMOR HP (WHATSAPP)</label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <p className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Komponen Tunjangan & Transport</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">TUNJANGAN JABATAN</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={formTunjanganJabatan}
                      onChange={(e) => setFormTunjanganJabatan(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">TUNJANGAN KEHADIRAN</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={formTunjanganKehadiran}
                      onChange={(e) => setFormTunjanganKehadiran(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UANG TRANSPORT</label>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={formTransport}
                      onChange={(e) => setFormTransport(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium outline-none"
                    />
                  </div>
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
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Guru */}
      <ConfirmDeleteModal
        isOpen={!!tutorToDelete}
        title="Hapus Data Guru"
        message="Data guru ini akan dihapus secara permanen dari sistem dan database Supabase."
        itemName={tutorToDelete ? `${tutorToDelete.name} (${tutorToDelete.id})` : ''}
        onConfirm={() => {
          if (tutorToDelete) {
            onDeleteTutor(tutorToDelete.id);
            setTutorToDelete(null);
          }
        }}
        onCancel={() => setTutorToDelete(null)}
      />
    </div>
  );
};
