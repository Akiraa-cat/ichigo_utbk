import React, { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { ICHIGO_LOGO_URL } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import { TabRoute } from '../types';

const TAB_LABELS: Record<TabRoute, string> = {
  beranda: 'Beranda',
  nilai: 'Nilai',
  agenda: 'Agenda',
  jadwal: 'Jadwal',
  data: 'Data Management',
};

export const HeaderBar: React.FC = () => {
  const {
    route,
    activeTab,
    navigateTab,
    openSettings,
    setNotificationsOpen,
  } = useApp();
  const [imgError, setImgError] = useState(false);

  const subtitle =
    route.type === 'settings'
      ? 'Pengaturan'
      : route.type === 'study_form'
      ? 'Sesi Belajar'
      : route.type === 'tryout_form'
      ? 'Input Nilai'
      : TAB_LABELS[activeTab];

  const navItems: { id: TabRoute; label: string }[] = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'nilai', label: 'Nilai' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'jadwal', label: 'Jadwal' },
    { id: 'data', label: 'Data' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-safe bg-surface/95 backdrop-blur-xl border-b-2 border-ink shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="max-w-6xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 manga-dots opacity-10 pointer-events-none" />

        {/* Left: Brand Lockup */}
        <button
          type="button"
          onClick={() => navigateTab('beranda')}
          className="flex items-center gap-2.5 relative z-10 text-left cursor-pointer shrink-0 group"
        >
          {!imgError ? (
            <img
              src={ICHIGO_LOGO_URL}
              alt="ICHIGO Manga Study Logo"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-primary border-2 border-ink flex items-center justify-center manga-shadow-sm shrink-0">
              <span className="font-bebas text-xl text-white leading-none mt-0.5">壱</span>
            </div>
          )}
          <div className="flex flex-col leading-none">
            <span className="font-bebas text-[22px] tracking-wide uppercase text-ink leading-none group-hover:text-primary transition-colors">
              ICHIGO UTBK
            </span>
            <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider mt-0.5">
              {subtitle}
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 bg-manga-red-soft text-manga-red-dark font-bold tracking-wider rounded uppercase border border-primary/20">
            2027 TARGET
          </span>
        </button>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 relative z-10">
          {navItems.map((item) => {
            const isActive = route.type === 'tab' && activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTab(item.id)}
                className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary manga-shadow-sm border border-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-container'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Notification & Settings/Profile */}
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button
            type="button"
            aria-label="Notifikasi & Status"
            onClick={() => setNotificationsOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-ink rounded-lg border border-ink/20 bg-paper hover:bg-surface-container transition-colors cursor-pointer relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          </button>
          <button
            type="button"
            aria-label="Buka Pengaturan"
            onClick={openSettings}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-ink manga-shadow-sm transition-transform active:translate-y-0.5 cursor-pointer ${
              route.type === 'settings'
                ? 'bg-ink text-surface'
                : 'bg-primary text-on-primary hover:brightness-105'
            }`}
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
