import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Student, BimbelType, UserRole } from '../../types/bimbel';
import { createWhatsAppLink } from '../../utils/formatters';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface SiswaModuleProps {
  students: Student[];
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  userRole: UserRole;
}

export const SiswaModule: React.FC<SiswaModuleProps> = ({
  students,
  onSaveStudent,
  onDeleteStudent,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBimbelType, setSelectedBimbelType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formBimbelType, setFormBimbelType] = useState<BimbelType>('Kelompok');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const canEdit = userRole === 'super_admin' || userRole === 'admin';

  // Check for duplicate ID
  const isDuplicateId = students.some(
    (s) =>
      s.id.trim().toLowerCase() === formId.trim().toLowerCase() &&
      (!editingStudent || s.id.trim().toLowerCase() !== editingStudent.id.trim().toLowerCase())
  );

  // Helper to find lowest available sequential ID (e.g. SIS-001, SIS-002, ...)
  const getNextAvailableId = (): string => {
    const existingIds = new Set(students.map((s) => s.id.trim().toUpperCase()));
    for (let i = 1; i <= 999; i++) {
      const candidate = `SIS-${String(i).padStart(3, '0')}`;
      if (!existingIds.has(candidate)) {
        return candidate;
      }
    }
    return `SIS-${Date.now().toString().slice(-4)}`;
  };

  // Helper to list unused suggested IDs for dropdown selection
  const getAvailableIdOptions = (): string[] => {
    const existingIds = new Set(students.map((s) => s.id.trim().toUpperCase()));
    const options: string[] = [];
    for (let i = 1; i <= 200 && options.length < 10; i++) {
      const candidate = `SIS-${String(i).padStart(3, '0')}`;
      if (!existingIds.has(candidate)) {
        options.push(candidate);
      }
    }
    return options;
  };

  const handleOpenAdd = () => {
    const autoId = getNextAvailableId();
    setEditingStudent(null);
    setFormId(autoId);
    setFormName('');
    setFormBimbelType('Kelompok');
    setFormParentPhone('');
    setFormParentName('');
    setFormGrade('SD Kelas 5');
    setFormAddress('');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormId(student.id);
    setFormName(student.name);
    setFormBimbelType(student.bimbelType);
    setFormParentPhone(student.parentPhone);
    setFormParentName(student.parentName || '');
    setFormGrade(student.grade || '');
    setFormAddress(student.address || '');
    setFormStatus(student.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateId) {
      alert(`ID Siswa "${formId}" sudah terdaftar. Harap gunakan ID lain.`);
      return;
    }
    if (!formName.trim() || !formParentPhone.trim()) {
      alert('Nama dan nomor HP wali wajib diisi');
      return;
    }

    const payload: Student = {
      id: formId.trim() || getNextAvailableId(),
      name: formName.trim(),
      bimbelType: formBimbelType,
      parentPhone: formParentPhone.trim(),
      parentName: formParentName.trim() || 'Wali Murid',
      grade: formGrade.trim() || 'Umum',
      address: formAddress.trim(),
      status: formStatus,
      joinedAt: editingStudent?.joinedAt || new Date().toISOString().split('T')[0],
    };

    onSaveStudent(payload);
    setIsModalOpen(false);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentPhone.includes(searchQuery);
    const matchesType = selectedBimbelType === 'all' || s.bimbelType === selectedBimbelType;
    return matchesSearch && matchesType;
  });

  const getBimbelTypeBadge = (type: BimbelType) => {
    switch (type) {
      case 'Kelompok':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Privat 3':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Privat 1':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Home Visit':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Manajemen Siswa</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full">
              {students.length} Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data siswa bimbingan belajar, jenis bimbel, dan kontak wali
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa, ID, atau No HP wali..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['all', 'Kelompok', 'Privat 3', 'Privat 1', 'Home Visit'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedBimbelType(type)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBimbelType === type
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'all' ? 'Semua Jenis' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Students Card List - Mobile App First */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {student.id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1.5">
                    {student.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{student.grade}</p>
                </div>

                <span
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border ${getBimbelTypeBadge(
                    student.bimbelType
                  )}`}
                >
                  {student.bimbelType}
                </span>
              </div>

              {/* Detail Info */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Wali:</span>
                  <span className="font-medium text-slate-800">{student.parentName || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">No. HP Wali:</span>
                  <span className="font-mono text-slate-800 font-medium">{student.parentPhone}</span>
                </div>
                {student.address && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Alamat:</span>
                    <span className="text-slate-700 truncate max-w-[170px]">{student.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={createWhatsAppLink(
                  student.parentPhone,
                  `Halo Bapak/Ibu ${student.parentName || 'Wali'}, kami dari BimbelSmart ingin menginformasikan mengenai kegiatan bimbel ananda ${student.name}.`
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
                    onClick={() => handleOpenEdit(student)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Edit Data Siswa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStudentToDelete(student)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Hapus Siswa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Tidak ada data siswa ditemukan</p>
            <p className="mt-0.5">Coba sesuaikan kata kunci pencarian atau filter jenis bimbel</p>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Siswa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">ID SISWA</label>
                      {!editingStudent && (
                        <button
                          type="button"
                          onClick={() => setFormId(getNextAvailableId())}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          ⚡ Auto ID
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 rounded-xl border font-mono font-medium outline-none transition-all ${
                        isDuplicateId
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">JENIS BIMBEL</label>
                    <select
                      value={formBimbelType}
                      onChange={(e) => setFormBimbelType(e.target.value as BimbelType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                    >
                      <option value="Kelompok">Kelompok (Maks 6)</option>
                      <option value="Privat 3">Privat 3 (Maks 3)</option>
                      <option value="Privat 1">Privat 1</option>
                      <option value="Home Visit">Home Visit</option>
                    </select>
                  </div>
                </div>

                {/* Dropdown helper for unused IDs without typing */}
                {!editingStudent && (
                  <div className="flex items-center space-x-2 pt-0.5">
                    <span className="text-[11px] text-slate-400">Atau pilih ID:</span>
                    <select
                      value={formId}
                      onChange={(e) => {
                        if (e.target.value) setFormId(e.target.value);
                      }}
                      className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-mono outline-none"
                    >
                      <option value="">-- Dropdown ID Tersedia --</option>
                      {getAvailableIdOptions().map((opt) => (
                        <option key={opt} value={opt}>
                          {opt} (Tersedia)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Duplicate ID Warning Message */}
                {isDuplicateId && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] flex items-center space-x-1.5 font-medium animate-in fade-in duration-150">
                    <span>⚠️ ID Siswa <strong>"{formId}"</strong> sudah digunakan! Tombol simpan dinonaktifkan.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NAMA SISWA</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Farhan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NAMA WALI</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibu Ratna"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NO. HP WALI (WA)</label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TINGKAT / KELAS</label>
                  <input
                    type="text"
                    placeholder="Contoh: SD Kelas 5 / SMP Kelas 8"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">STATUS</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-indigo-500 outline-none"
                  >
                    <option value="active">Aktif Belajar</option>
                    <option value="inactive">Nonaktif / Cuti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ALAMAT TINGGAL</label>
                <input
                  type="text"
                  placeholder="Jl. Melati No. 12..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:border-indigo-500 outline-none"
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
                  disabled={isDuplicateId || !formName.trim() || !formParentPhone.trim()}
                  className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${
                    isDuplicateId || !formName.trim() || !formParentPhone.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  }`}
                  title={isDuplicateId ? 'ID Siswa sudah ada, tidak dapat klik simpan!' : 'Simpan data siswa'}
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus Siswa */}
      <ConfirmDeleteModal
        isOpen={!!studentToDelete}
        title="Hapus Data Siswa"
        message="Data siswa ini akan dihapus secara permanen dari sistem dan database Supabase."
        itemName={studentToDelete ? `${studentToDelete.name} (${studentToDelete.id})` : ''}
        onConfirm={() => {
          if (studentToDelete) {
            onDeleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};
