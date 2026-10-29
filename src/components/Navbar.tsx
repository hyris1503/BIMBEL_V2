import React from 'react';
import {
  GraduationCap,
  Database,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/bimbel';

interface NavbarProps {
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenSupabaseModal: () => void;
  onLogoClick: () => void;
  supabaseConnected: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenSupabaseModal,
  onLogoClick,
  supabaseConnected,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'admin':
        return {
          label: 'Admin Keuangan',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'guru':
        return {
          label: 'Guru Pengajar',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          label: 'Pengguna',
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
          dot: 'bg-gray-400',
        };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Bimbel Brand - Clicking navigates to role home */}
          <div
            onClick={onLogoClick}
            className="flex items-center space-x-3 cursor-pointer select-none group transition-transform active:scale-95"
            title="Kembali ke Beranda"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:from-indigo-700 group-hover:to-blue-600 transition-all">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg group-hover:text-indigo-600 transition-colors">
                  Bimbel<span className="text-indigo-600">Smart</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Sistem Terpadu Bimbingan Belajar
              </p>
            </div>
          </div>

          {/* Quick Actions & Authenticated User Info */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Supabase status badge */}
            <button
              onClick={onOpenSupabaseModal}
              title="Koneksi Database Supabase"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                supabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Supabase</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-2xs text-slate-700 active:scale-95"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline text-amber-400 font-bold">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline text-indigo-600 font-bold">Gelap</span>
                </>
              )}
            </button>

            {/* Authenticated User Display */}
            <div className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[200px] md:max-w-[260px]">
                  {currentUser?.name}
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  <span className="text-[10px] text-slate-500">{badge.label}</span>
                </div>
              </div>

              {/* Direct Logout Button */}
              <button
                onClick={onLogout}
                title="Keluar dari Akun"
                className="ml-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
