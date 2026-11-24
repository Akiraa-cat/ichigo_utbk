import React from 'react';
import { BookOpen, CalendarDays, FolderOpen, Home, LineChart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabRoute } from '../types';

const TABS: { id: TabRoute; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'beranda', label: 'Beranda', Icon: Home },
  { id: 'nilai', label: 'Nilai', Icon: LineChart },
  { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { id: 'jadwal', label: 'Jadwal', Icon: BookOpen },
  { id: 'data', label: 'Data', Icon: FolderOpen },
];

export const BottomNav: React.FC = () => {
  const { activeTab, route, navigateTab } = useApp();

  if (route.type !== 'tab') return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/95 backdrop-blur-xl border-t-2 border-ink shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigateTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all cursor-pointer ${
                isActive ? 'text-primary font-bold' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-full transition-all ${
                  isActive && id === 'data'
                    ? 'w-9 h-7 bg-manga-red-soft border-2 border-ink mb-0.5'
                    : ''
                }`}
              >
                <Icon className="w-[22px] h-[22px]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide mt-0.5 leading-none">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
