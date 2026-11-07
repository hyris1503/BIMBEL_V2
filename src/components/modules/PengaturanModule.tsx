import React, { useState, useRef, useEffect } from 'react';
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
  Plus,
  Trash2,
  RotateCcw,
  Moon,
  Sun,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Copy,
  Check,
  GraduationCap,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Folder,
  X,
  FileImage,
  Search,
  Sparkle,
} from 'lucide-react';
import { BimbelPricingSettings, UserRole, SessionConfig, StorageBucketFile } from '../../types/bimbel';
import { formatRupiah } from '../../utils/formatters';
import { DEFAULT_SESSIONS, BimbelService } from '../../services/bimbelStorage';
import { getSupabaseClient } from '../../lib/supabase';

interface PengaturanModuleProps {
  settings: BimbelPricingSettings;
  onSaveSettings: (settings: BimbelPricingSettings) => void;
  onOpenSupabase: () => void;
  userRole: UserRole;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const PengaturanModule: React.FC<PengaturanModuleProps> = ({
  settings,
  onSaveSettings,
  onOpenSupabase,
  userRole,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [formSettings, setFormSettings] = useState<BimbelPricingSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedStorageSql, setCopiedStorageSql] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'bucket' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // States for direct storage upload & bucket picker
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showBucketPicker, setShowBucketPicker] = useState(false);
  const [isLoadingBucketFiles, setIsLoadingBucketFiles] = useState(false);
  const [bucketFiles, setBucketFiles] = useState<StorageBucketFile[]>([]);
  const [detectedFolders, setDetectedFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [bucketPickerError, setBucketPickerError] = useState<string | null>(null);
  const [bucketSearchQuery, setBucketSearchQuery] = useState('');

  const canEdit = userRole === 'super_admin';
  const currentBucket = formSettings.supabaseStorageBucket || 'bimbel-photos';

  // Synchronize internal form when incoming settings change
  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const loadBucketFiles = async (folderToLoad: string = currentFolder) => {
    setIsLoadingBucketFiles(true);
    setBucketPickerError(null);
    try {
      const res = await BimbelService.listSupabaseBucketFiles(currentBucket, folderToLoad);
      if (res.success) {
        setBucketFiles(res.files);
        setDetectedFolders(res.folders);
        setCurrentFolder(folderToLoad);
      } else {
        setBucketPickerError(res.error || 'Gagal memuat berkas dari bucket Supabase.');
      }
    } catch (err: any) {
      setBucketPickerError(err?.message || 'Terjadi kesalahan sistem saat membaca isi bucket.');
    } finally {
      setIsLoadingBucketFiles(false);
    }
  };

  const handleOpenBucketPicker = (initialFolder: string = '') => {
    setShowBucketPicker(true);
    loadBucketFiles(initialFolder);
  };

  const handleSelectBucketFile = (file: StorageBucketFile) => {
    const updated = {
      ...formSettings,
      logoUrl: file.publicUrl,
    };
    setFormSettings(updated);
    onSaveSettings(updated);
    setShowBucketPicker(false);
    setUploadSuccess(`Logo berhasil diterapkan dari bucket: ${file.name}`);
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 5MB untuk menjaga performa optimal.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);

    const client = getSupabaseClient();
    if (client) {
      setIsUploadingLogo(true);
      try {
        const folderTarget = formSettings.photoStorageFolder || 'logo';
        const res = await BimbelService.uploadLogoToSupabase(file, currentBucket, folderTarget);
        if (res.success && res.publicUrl) {
          const updated = {
            ...formSettings,
            logoUrl: res.publicUrl,
          };
          setFormSettings(updated);
          onSaveSettings(updated);
          setUploadSuccess('Logo berhasil diunggah langsung ke Supabase Storage & tersimpan ke database!');
          setTimeout(() => setUploadSuccess(null), 4500);
        } else {
          setUploadError(res.error || 'Gagal mengunggah logo ke Supabase Storage.');
        }
      } catch (err: any) {
        setUploadError(err?.message || 'Terjadi kesalahan saat mengunggah berkas.');
      } finally {
        setIsUploadingLogo(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (modalFileInputRef.current) modalFileInputRef.current.value = '';
      }
    } else {
      // Local Base64 fallback if Supabase client is not connected
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const updated = {
            ...formSettings,
            logoUrl: reader.result as string,
          };
          setFormSettings(updated);
          onSaveSettings(updated);
          setUploadSuccess('Logo disimpan secara lokal. Sambungkan Supabase agar dapat muncul di semua perangkat.');
          setTimeout(() => setUploadSuccess(null), 5000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConvertBase64ToSupabase = async () => {
    if (!formSettings.logoUrl?.startsWith('data:image')) return;
    const client = getSupabaseClient();
    if (!client) {
      alert('Koneksi Supabase belum terhubung. Konfigurasikan URL dan Anon Key terlebih dahulu.');
      return;
    }

    setIsUploadingLogo(true);
    setUploadError(null);
    try {
      const res = await fetch(formSettings.logoUrl);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'png';
      const file = new File([blob], `logo-migrated-${Date.now()}.${ext}`, { type: blob.type });

      const uploadRes = await BimbelService.uploadLogoToSupabase(file, currentBucket, 'logo');
      if (uploadRes.success && uploadRes.publicUrl) {
        const updated = {
          ...formSettings,
          logoUrl: uploadRes.publicUrl,
        };
        setFormSettings(updated);
        onSaveSettings(updated);
        setUploadSuccess('Logo lokal berhasil dipindahkan ke Supabase Storage publik!');
        setTimeout(() => setUploadSuccess(null), 4500);
      } else {
        setUploadError(uploadRes.error || 'Gagal memindahkan logo lokal ke Supabase Storage.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal memproses gambar logo lokal.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleResetLogo = () => {
    const updated = {
      ...formSettings,
      logoUrl: '',
    };
    setFormSettings(updated);
    onSaveSettings(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadSuccess('Logo direset kembali ke ikon default.');
    setTimeout(() => setUploadSuccess(null), 3000);
  };
  const STORAGE_SETUP_SQL = `-- 1. BUCKET STORAGE SUPABASE UNTUK FOTO & LOGO
INSERT INTO storage.buckets (id, name, public) 
VALUES ('${currentBucket}', '${currentBucket}', true)
ON CONFLICT (id) DO NOTHING;

-- 2. KEBIJAKAN AKSES PUBLIK (SELECT, INSERT, UPDATE)
DROP POLICY IF EXISTS "Public Select ${currentBucket}" ON storage.objects;
CREATE POLICY "Public Select ${currentBucket}" ON storage.objects FOR SELECT USING (bucket_id = '${currentBucket}');

DROP POLICY IF EXISTS "Public Insert ${currentBucket}" ON storage.objects;
CREATE POLICY "Public Insert ${currentBucket}" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${currentBucket}');

DROP POLICY IF EXISTS "Public Update ${currentBucket}" ON storage.objects;
CREATE POLICY "Public Update ${currentBucket}" ON storage.objects FOR UPDATE USING (bucket_id = '${currentBucket}');`;

  const handleCopyStorageSql = () => {
    navigator.clipboard.writeText(STORAGE_SETUP_SQL);
    setCopiedStorageSql(true);
    setTimeout(() => setCopiedStorageSql(false), 2500);
  };

  const sessions =
    formSettings.sessions && formSettings.sessions.length > 0
      ? formSettings.sessions
      : DEFAULT_SESSIONS;

  const handleUpdateSession = (index: number, updatedFields: Partial<SessionConfig>) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], ...updatedFields };
    setFormSettings({ ...formSettings, sessions: newSessions });
  };

  const handleAddSession = () => {
    const nextId =
      sessions.length > 0 ? Math.max(...sessions.map((s) => s.id)) + 1 : 1;
    const newSession: SessionConfig = {
      id: nextId,
      name: `Sesi ${nextId}`,
      time: '21:30 - 22:45',
    };
    setFormSettings({ ...formSettings, sessions: [...sessions, newSession] });
  };

  const handleRemoveSession = (index: number) => {
    if (sessions.length <= 1) {
      alert('Minimal harus ada 1 sesi pembelajaran');
      return;
    }
    const newSessions = sessions.filter((_, i) => i !== index);
    setFormSettings({ ...formSettings, sessions: newSessions });
  };

  const handleResetSessions = () => {
    setFormSettings({ ...formSettings, sessions: DEFAULT_SESSIONS });
  };

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
        {/* Tema & Tampilan Antarmuka */}
        {onToggleDarkMode && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Tema & Tampilan Aplikasi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan tampilan visual dashboard antara mode gelap yang nyaman di mata dan mode terang
                </p>
              </div>

              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (isDarkMode) onToggleDarkMode();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    !isDarkMode
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mode Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDarkMode) onToggleDarkMode();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isDarkMode
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Mode Gelap</span>
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Logo Bimbel & Ikon Aplikasi */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Logo Lembaga Bimbel & Branding Visual</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Logo ini tersimpan di Supabase Storage publik agar otomatis muncul di seluruh pengguna & deploy aplikasi
              </p>
            </div>

            <div className="flex items-center space-x-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setLogoInputMode('upload')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  logoInputMode === 'upload'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Unggah File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoInputMode('bucket');
                  handleOpenBucketPicker('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  logoInputMode === 'bucket'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderKanban className="w-3 h-3" />
                <span>Pilih dari Bucket</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoInputMode('url')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  logoInputMode === 'url'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3 h-3" />
                <span>Link URL</span>
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{uploadSuccess}</span>
            </div>
          )}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{uploadError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Logo Preview Card */}
            <div className="flex flex-col items-center space-y-2 shrink-0">
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-indigo-200 bg-slate-50 flex items-center justify-center p-2 overflow-hidden shadow-2xs relative group">
                {formSettings.logoUrl ? (
                  <img
                    src={formSettings.logoUrl}
                    alt="Logo Bimbel"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-indigo-400">
                    <GraduationCap className="w-10 h-10 mb-1 text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-400">Default</span>
                  </div>
                )}

                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-1" />
                    <span className="text-[10px] font-bold text-indigo-700">Mengunggah...</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-center space-y-1">
                {formSettings.logoUrl?.startsWith('http') ? (
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Supabase Storage Publik</span>
                    </span>
                    <a
                      href={formSettings.logoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-indigo-600 p-0.5"
                      title="Buka gambar di tab baru"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : formSettings.logoUrl?.startsWith('data:image') ? (
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      ⚠ Hanya Tersimpan Lokal (Base64)
                    </span>
                    <button
                      type="button"
                      disabled={isUploadingLogo || !canEdit}
                      onClick={handleConvertBase64ToSupabase}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center space-x-0.5"
                    >
                      <span>Unggah ke Supabase Storage</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    Ikon Standar
                  </span>
                )}
              </div>
            </div>

            {/* Input Controls */}
            <div className="flex-1 w-full space-y-3">
              {logoInputMode === 'upload' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    UNGGAH LOGO LANGSUNG KE BUCKET ({currentBucket})
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    disabled={!canEdit || isUploadingLogo}
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!canEdit || isUploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 disabled:opacity-50 shadow-2xs"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>
                        {isUploadingLogo
                          ? 'Mengunggah ke Supabase...'
                          : 'Pilih Berkas & Unggah ke Supabase'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={!canEdit || isUploadingLogo}
                      onClick={() => handleOpenBucketPicker('')}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <FolderKanban className="w-4 h-4 text-emerald-600" />
                      <span>Pilih dari Berkas di Bucket</span>
                    </button>

                    {formSettings.logoUrl && (
                      <button
                        type="button"
                        disabled={!canEdit || isUploadingLogo}
                        onClick={handleResetLogo}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset Default</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    File akan diunggah langsung ke Public Bucket Supabase Storage sehingga bisa diakses oleh seluruh pengguna di semua browser/deploy. Maksimal 5MB (PNG, JPG, SVG, WebP).
                  </p>
                </div>
              ) : logoInputMode === 'bucket' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    PILIH FILE DARI BUCKET SUPABASE ({currentBucket})
                  </label>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                    <p className="text-xs text-slate-700">
                      Anda sudah memiliki file di bucket Supabase? Klik tombol di bawah untuk melihat dan memilih file logo secara langsung dari bucket Anda.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleOpenBucketPicker('')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                      >
                        <FolderKanban className="w-4 h-4" />
                        <span>Buka Penjelajah Berkas Bucket</span>
                      </button>

                      {formSettings.logoUrl && (
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={handleResetLogo}
                          className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ALAMAT URL LOGO PUBLIK (SUPABASE STORAGE ATAU CDN)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="https://...supabase.co/storage/v1/object/public/bimbel-photos/logo.png"
                      value={formSettings.logoUrl || ''}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, logoUrl: e.target.value })
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 outline-none disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleOpenBucketPicker('')}
                      className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center space-x-1 shrink-0"
                      title="Pilih dari Bucket"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Bucket</span>
                    </button>
                    {formSettings.logoUrl && (
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={handleResetLogo}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 shrink-0"
                        title="Hapus Logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Masukkan URL publik file logo dari Supabase Storage. URL ini dapat diakses langsung oleh siapa saja.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Setting Data Foto & Media Supabase */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Penyimpanan Foto & Media Supabase</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi bucket penyimpanan file (Storage Bucket) untuk data foto siswa, tutor, dan logo
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleOpenBucketPicker('')}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Lihat Berkas Bucket</span>
              </button>

              <button
                type="button"
                onClick={handleCopyStorageSql}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                {copiedStorageSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SQL Bucket Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin SQL Bucket Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NAMA BUCKET STORAGE SUPABASE
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formSettings.supabaseStorageBucket || 'bimbel-photos'}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    supabaseStorageBucket: e.target.value,
                  })
                }
                placeholder="bimbel-photos"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:border-emerald-500 outline-none disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Nama bucket publik di menu <strong>Storage &gt; Buckets</strong> pada Supabase
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SUB-FOLDER MEDIA DEFAULT
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formSettings.photoStorageFolder || 'photos'}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    photoStorageFolder: e.target.value,
                  })
                }
                placeholder="photos"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-medium focus:border-emerald-500 outline-none disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Folder penyimpanan untuk foto siswa dan guru (misal: <code>photos</code> atau <code>avatars</code>)
              </p>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Cara Mengaktifkan Fitur Foto & Logo di Supabase:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>
                Buka <strong>Supabase Dashboard &gt; SQL Editor</strong> pada proyek Anda.
              </li>
              <li>
                Klik tombol <strong>"Salin SQL Bucket Supabase"</strong> di atas, lalu paste dan klik <strong>Run</strong>.
              </li>
              <li>
                Bucket <code className="px-1 py-0.5 bg-slate-200 rounded font-bold font-mono">{formSettings.supabaseStorageBucket || 'bimbel-photos'}</code> akan langsung aktif dengan hak akses publik untuk foto siswa, guru, dan logo.
              </li>
              <li>
                URL foto dapat langsung dimasukkan atau diunggah dan tersinkronisasi otomatis dengan database PostgreSQL Supabase.
              </li>
            </ol>
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

        {/* Setup Jumlah Sesi dan Jam Sesi Pembelajaran */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Jumlah Sesi & Jam Sesi Pembelajaran</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur jumlah sesi harian (Senin - Kamis) dan jam operasional untuk masing-masing sesi
              </p>
            </div>

            {canEdit && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResetSessions}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 flex items-center space-x-1"
                  title="Kembalikan ke standar 5 sesi"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Standar 5 Sesi</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddSession}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sesi</span>
                </button>
              </div>
            )}
          </div>

          {/* Session Cards List */}
          <div className="space-y-2.5">
            {sessions.map((sess, idx) => (
              <div
                key={sess.id}
                className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                    {sess.id}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        NAMA SESI
                      </label>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={sess.name}
                        onChange={(e) => handleUpdateSession(idx, { name: e.target.value })}
                        placeholder={`Sesi ${sess.id}`}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        JAM SESI (WAKTU MULAI - SELESAI)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={sess.time}
                          onChange={(e) => handleUpdateSession(idx, { time: e.target.value })}
                          placeholder="Contoh: 13:30 - 14:45"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-medium text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center justify-end sm:justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(idx)}
                      disabled={sessions.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Hapus sesi ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60">
            <span>
              Total sesi aktif: <strong className="text-indigo-900">{sessions.length} Sesi Pembelajaran</strong>
            </span>
            <span>Konfigurasi ini otomatis diterapkan pada Jadwal dan Absensi</span>
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

      {/* Modal Pemilih Berkas dari Bucket Supabase */}
      {showBucketPicker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-1.5">
                    <span>Penjelajah Berkas Bucket:</span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs sm:text-sm">
                      {currentBucket}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih file gambar yang sudah ada di Supabase untuk dijadikan Logo Lembaga Bimbel
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBucketPicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folder & Action Toolbar */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Folder Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 font-semibold mr-1">Folder:</span>
                <button
                  type="button"
                  onClick={() => loadBucketFiles('')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                    currentFolder === ''
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  <span>/ (Root)</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadBucketFiles('logo')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                    currentFolder === 'logo'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  <span>logo/</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadBucketFiles('photos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                    currentFolder === 'photos'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  <span>photos/</span>
                </button>

                {detectedFolders
                  .filter((f) => f !== 'logo' && f !== 'photos')
                  .map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => loadBucketFiles(f)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                        currentFolder === f
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Folder className="w-3 h-3" />
                      <span>{f}/</span>
                    </button>
                  ))}
              </div>

              {/* Action Buttons: Refresh & Upload New */}
              <div className="flex items-center space-x-2 ml-auto">
                <input
                  type="file"
                  ref={modalFileInputRef}
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isLoadingBucketFiles || isUploadingLogo}
                  onClick={() => modalFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center space-x-1.5 transition-all"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Unggah Baru</span>
                </button>

                <button
                  type="button"
                  disabled={isLoadingBucketFiles}
                  onClick={() => loadBucketFiles(currentFolder)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                  title="Segarkan berkas"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingBucketFiles ? 'animate-spin text-emerald-600' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={bucketSearchQuery}
                onChange={(e) => setBucketSearchQuery(e.target.value)}
                placeholder="Cari nama berkas di folder ini..."
                className="w-full bg-transparent text-xs outline-none text-slate-800 placeholder-slate-400"
              />
              {bucketSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBucketSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Modal Body: File Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-[280px]">
              {isLoadingBucketFiles ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">
                    Membaca berkas dari bucket Supabase Storage...
                  </p>
                </div>
              ) : bucketPickerError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-800 space-y-1">
                      <p className="font-bold">Tidak dapat membaca berkas dari bucket `{currentBucket}`</p>
                      <p>{bucketPickerError}</p>
                      <div className="pt-2 text-slate-600 text-[11px] space-y-1">
                        <p><strong>Panduan Perbaikan di Supabase:</strong></p>
                        <p>1. Buka <strong>Supabase Dashboard &gt; Storage &gt; Buckets</strong>.</p>
                        <p>2. Pastikan bucket bernama <strong>`{currentBucket}`</strong> sudah dibuat dan opsi <strong>Public Bucket</strong> dalam posisi AKTIF (ON).</p>
                        <p>3. Jika perlu, jalankan query di menu <strong>SQL Editor</strong> dengan menyalin script SQL di bagian bawah halaman pengaturan ini.</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => loadBucketFiles(currentFolder)}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              ) : (
                (() => {
                  const filtered = bucketFiles.filter((f) =>
                    f.name.toLowerCase().includes(bucketSearchQuery.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-52 text-center p-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
                          <FolderKanban className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-700 text-xs sm:text-sm">
                          {bucketSearchQuery
                            ? `Tidak ada berkas yang cocok dengan "${bucketSearchQuery}"`
                            : `Belum ada berkas di folder ${currentFolder || 'Root'}`}
                        </h4>
                        <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                          {bucketSearchQuery
                            ? 'Coba gunakan kata kunci pencarian yang lain atau ganti folder.'
                            : 'Anda dapat mengunggah gambar logo baru ke folder ini atau memilih tab folder lain di atas.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => modalFileInputRef.current?.click()}
                          className="mt-3 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah File ke Sini</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filtered.map((file) => {
                        const isCurrentActive = formSettings.logoUrl === file.publicUrl;
                        return (
                          <div
                            key={file.fullPath}
                            className={`group relative rounded-2xl border p-2.5 flex flex-col justify-between transition-all ${
                              isCurrentActive
                                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400'
                                : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                            }`}
                          >
                            {/* Preview Area */}
                            <div className="w-full aspect-square bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center mb-2 relative">
                              {file.isImage ? (
                                <img
                                  src={file.publicUrl}
                                  alt={file.name}
                                  className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              ) : (
                                <FileImage className="w-8 h-8 text-slate-400" />
                              )}

                              <a
                                href={file.publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-white text-slate-600 rounded-lg shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Buka gambar di tab baru"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {isCurrentActive && (
                                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold flex items-center space-x-0.5 shadow-2xs">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Aktif</span>
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="space-y-1 mb-2">
                              <p
                                className="text-[11px] font-bold text-slate-800 truncate"
                                title={file.name}
                              >
                                {file.name}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>
                                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'File'}
                                </span>
                                <span>{file.name.split('.').pop()?.toUpperCase()}</span>
                              </div>
                            </div>

                            {/* Select Button */}
                            <button
                              type="button"
                              onClick={() => handleSelectBucketFile(file)}
                              className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                                isCurrentActive
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700'
                              }`}
                            >
                              {isCurrentActive ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Logo Saat Ini</span>
                                </>
                              ) : (
                                <span>Pilih Logo Ini</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <p className="text-[11px] text-slate-500 text-center sm:text-left">
                ✓ Menggunakan <strong>URL Publik Supabase Storage</strong> menjamin logo tampil konsisten di semua komputer, HP, & deploy.
              </p>
              <button
                type="button"
                onClick={() => setShowBucketPicker(false)}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
