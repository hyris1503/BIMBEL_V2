import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CalendarDays,
  Wallet,
  Receipt,
  Banknote,
  Settings,
} from 'lucide-react';
import { UserRole } from '../types/bimbel';

export type NavTabId =
  | 'overview'
  | 'students'
  | 'tutors'
  | 'attendance'
  | 'schedules'
  | 'finance'
  | 'billing'
  | 'payroll'
  | 'settings';

interface NavigationProps {
  currentRole: UserRole;
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentRole,
  activeTab,
  onTabChange,
}) => {
  // Tabs per role (Icons only as requested)
  const getTabs = () => {
    if (currentRole === 'guru') {
      return [
        { id: 'attendance' as NavTabId, label: 'Absensi', icon: CalendarCheck },
        { id: 'schedules' as NavTabId, label: 'Jadwal Saya', icon: CalendarDays },
        { id: 'payroll' as NavTabId, label: 'Slip Gaji', icon: Banknote },
      ];
    }

    if (currentRole === 'admin') {
      return [
        { id: 'finance' as NavTabId, label: 'Keuangan', icon: Wallet },
        { id: 'billing' as NavTabId, label: 'Tagihan Siswa', icon: Receipt },
        { id: 'attendance' as NavTabId, label: 'Absensi', icon: CalendarCheck },
        { id: 'students' as NavTabId, label: 'Siswa', icon: Users },
        { id: 'schedules' as NavTabId, label: 'Jadwal', icon: CalendarDays },
      ];
    }

    // Super Admin: Entire system
    return [
      { id: 'overview' as NavTabId, label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'students' as NavTabId, label: 'Siswa', icon: Users },
      { id: 'tutors' as NavTabId, label: 'Guru', icon: GraduationCap },
      { id: 'attendance' as NavTabId, label: 'Absensi', icon: CalendarCheck },
      { id: 'schedules' as NavTabId, label: 'Jadwal', icon: CalendarDays },
      { id: 'finance' as NavTabId, label: 'Keuangan', icon: Wallet },
      { id: 'billing' as NavTabId, label: 'Tagihan', icon: Receipt },
      { id: 'payroll' as NavTabId, label: 'Penggajian', icon: Banknote },
      { id: 'settings' as NavTabId, label: 'Pengaturan', icon: Settings },
    ];
  };

  const tabs = getTabs();

  return (
    <>
      {/* Top Desktop & Tablet Horizontal Tab Navigation - ICONS ONLY */}
      <div className="bg-white border-b border-slate-200 shadow-2xs hidden md:block no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 py-2 items-center justify-start overflow-x-auto scrollbar-none" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  title={tab.label}
                  className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 scale-105'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile App First Bottom Navigation Bar - ICONS ONLY */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg md:hidden no-print">
        <div className="grid grid-flow-col auto-cols-fr h-14 items-center px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                className={`flex items-center justify-center py-2 transition-all ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    isActive ? 'bg-indigo-50 text-indigo-600 transform scale-110 shadow-2xs' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
