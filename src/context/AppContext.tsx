import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  INITIAL_PLATFORMS,
  INITIAL_SCHEDULES,
  INITIAL_SESSIONS,
  INITIAL_SETTINGS,
  INITIAL_TRYOUTS,
} from '../data/initialData';
import {
  DaySchedule,
  PlannerActivityCode,
  StudySession,
  SubViewRoute,
  TabRoute,
  ToastMessage,
  TryoutPlatform,
  TryoutRecord,
  UserSettings,
} from '../types';

const STORAGE_KEY = 'ichigo_utbk_2027_state_v1';

interface PersistedState {
  platforms: TryoutPlatform[];
  tryouts: TryoutRecord[];
  sessions: StudySession[];
  schedules: Record<string, DaySchedule>;
  settings: UserSettings;
}

interface ConfirmDialogState {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface AppContextValue extends PersistedState {
  route: SubViewRoute;
  activeTab: TabRoute;
  navigateTab: (tab: TabRoute) => void;
  openStudyForm: (opts?: { date?: string; sessionId?: string }) => void;
  openTryoutForm: (tryoutId?: string) => void;
  openSettings: () => void;
  goBackToTab: () => void;

  // Data mutations
  saveSession: (session: Omit<StudySession, 'id'> & { id?: string }) => void;
  deleteSession: (id: string) => void;
  saveTryout: (tryout: Omit<TryoutRecord, 'id'> & { id?: string }) => void;
  deleteTryout: (id: string) => void;
  addPlatform: (platform: Omit<TryoutPlatform, 'id'>) => TryoutPlatform;
  updatePlatform: (platform: TryoutPlatform) => void;
  deletePlatform: (id: string) => void;
  saveDaySchedule: (date: string, activities: PlannerActivityCode[]) => void;
  updateSettings: (next: UserSettings) => void;
  resetSettingsToDefault: () => void;
  exportTryoutsCsv: () => void;

  // UI feedback
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  confirmDialog: ConfirmDialogState | null;
  askConfirm: (dialog: ConfirmDialogState) => void;
  closeConfirm: () => void;
  isAddPlatformOpen: boolean;
  setAddPlatformOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  isLoadingSkeleton: boolean;
  triggerSkeletonDemo: () => void;
  networkErrorOpen: boolean;
  setNetworkErrorOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        platforms: parsed.platforms ?? INITIAL_PLATFORMS,
        tryouts: parsed.tryouts ?? INITIAL_TRYOUTS,
        sessions: parsed.sessions ?? INITIAL_SESSIONS,
        schedules: parsed.schedules ?? INITIAL_SCHEDULES,
        settings: parsed.settings ?? INITIAL_SETTINGS,
      };
    }
  } catch {
    // Fallback to initial seed
  }
  return {
    platforms: INITIAL_PLATFORMS,
    tryouts: INITIAL_TRYOUTS,
    sessions: INITIAL_SESSIONS,
    schedules: INITIAL_SCHEDULES,
    settings: INITIAL_SETTINGS,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<TabRoute>('beranda');
  const [route, setRoute] = useState<SubViewRoute>({ type: 'tab', tab: 'beranda' });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [isAddPlatformOpen, setAddPlatformOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(false);
  const [networkErrorOpen, setNetworkErrorOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues
    }
  }, [state]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  const navigateTab = useCallback((tab: TabRoute) => {
    setActiveTab(tab);
    setRoute({ type: 'tab', tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openStudyForm = useCallback((opts?: { date?: string; sessionId?: string }) => {
    setRoute({ type: 'study_form', date: opts?.date, sessionId: opts?.sessionId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openTryoutForm = useCallback((tryoutId?: string) => {
    setRoute({ type: 'tryout_form', tryoutId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openSettings = useCallback(() => {
    setRoute({ type: 'settings' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBackToTab = useCallback(() => {
    setRoute({ type: 'tab', tab: activeTab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const saveSession = useCallback(
    (payload: Omit<StudySession, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (payload.id) {
          return {
            ...prev,
            sessions: prev.sessions.map((s) =>
              s.id === payload.id ? { ...payload, id: payload.id } : s
            ),
          };
        }
        const newSession: StudySession = {
          ...payload,
          id: `ses-${Date.now()}`,
        };
        return {
          ...prev,
          sessions: [newSession, ...prev.sessions],
        };
      });
      pushToast({
        type: 'success',
        title: 'Pencatatan Sukses!',
        subtitle: `Sesi belajar ${payload.durationMinutes} menit berhasil dicatat.`,
        actionLabel: 'Lihat Agenda',
        onAction: () => {
          setActiveTab('agenda');
          setRoute({ type: 'tab', tab: 'agenda' });
        },
      });
    },
    [pushToast]
  );

  const deleteSession = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== id),
      }));
      pushToast({
        type: 'success',
        title: 'Sesi Dihapus',
        subtitle: 'Catatan sesi belajar telah dihapus dari arsip lokal.',
      });
    },
    [pushToast]
  );

  const saveTryout = useCallback(
    (payload: Omit<TryoutRecord, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (payload.id) {
          return {
            ...prev,
            tryouts: prev.tryouts.map((t) =>
              t.id === payload.id ? { ...payload, id: payload.id } : t
            ),
          };
        }
        const newTryout: TryoutRecord = {
          ...payload,
          id: `to-${Date.now()}`,
        };
        return {
          ...prev,
          tryouts: [...prev.tryouts, newTryout],
        };
      });
      pushToast({
        type: 'success',
        title: 'Nilai Tryout Tersimpan!',
        subtitle: `${payload.title} (${payload.averageScore} pts) masuk ke grafik.`,
        actionLabel: 'Lihat Grafik',
        onAction: () => {
          setActiveTab('nilai');
          setRoute({ type: 'tab', tab: 'nilai' });
        },
      });
    },
    [pushToast]
  );

  const deleteTryout = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        tryouts: prev.tryouts.filter((t) => t.id !== id),
      }));
      pushToast({
        type: 'success',
        title: 'Catatan Tryout Dihapus',
        subtitle: 'Riwayat nilai tryout telah diperbarui.',
      });
    },
    [pushToast]
  );

  const addPlatform = useCallback(
    (payload: Omit<TryoutPlatform, 'id'>): TryoutPlatform => {
      const created: TryoutPlatform = {
        ...payload,
        id: `pf-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        platforms: [...prev.platforms, created],
      }));
      pushToast({
        type: 'success',
        title: 'Platform Terdaftar!',
        subtitle: `${created.name} siap dipakai di analitik multi-series.`,
      });
      return created;
    },
    [pushToast]
  );

  const updatePlatform = useCallback(
    (platform: TryoutPlatform) => {
      setState((prev) => ({
        ...prev,
        platforms: prev.platforms.map((p) => (p.id === platform.id ? platform : p)),
      }));
      pushToast({
        type: 'success',
        title: 'Platform Diperbarui',
        subtitle: `Konfigurasi ${platform.name} berhasil disimpan.`,
      });
    },
    [pushToast]
  );

  const deletePlatform = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        platforms: prev.platforms.filter((p) => p.id !== id),
      }));
      pushToast({
        type: 'offline',
        title: 'Platform Diarsipkan',
        subtitle: 'Nilai terkait tetap aman tersimpan di penyimpanan lokal.',
      });
    },
    [pushToast]
  );

  const saveDaySchedule = useCallback(
    (date: string, activities: PlannerActivityCode[]) => {
      setState((prev) => ({
        ...prev,
        schedules: {
          ...prev.schedules,
          [date]: { date, activities },
        },
      }));
      pushToast({
        type: 'success',
        title: 'Jadwal Diperbarui!',
        subtitle: `${activities.length} aktivitas terjadwal tersimpan.`,
      });
    },
    [pushToast]
  );

  const updateSettings = useCallback(
    (next: UserSettings) => {
      setState((prev) => ({
        ...prev,
        settings: next,
      }));
      pushToast({
        type: 'success',
        title: 'Pengaturan tersimpan!',
        subtitle: '一歩前進 • Maju Selangkah',
      });
    },
    [pushToast]
  );

  const resetSettingsToDefault = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: INITIAL_SETTINGS,
    }));
    pushToast({
      type: 'success',
      title: 'Pengaturan Direset',
      subtitle: 'Preferensi kembali ke default UTBK 2027.',
    });
  }, [pushToast]);

  const exportTryoutsCsv = useCallback(() => {
    const header = ['Tanggal', 'Kode', 'Platform', 'Judul', 'Skor Rata-rata', 'PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'];
    const rows = state.tryouts.map((t) => {
      const pfName = state.platforms.find((p) => p.id === t.platformId)?.name ?? t.platformId;
      return [
        t.date,
        t.code,
        `"${pfName}"`,
        `"${t.title}"`,
        t.averageScore,
        t.scores.PU,
        t.scores.PPU,
        t.scores.PBM,
        t.scores.PK,
        t.scores.LBI,
        t.scores.LBE,
        t.scores.PM,
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ichigo-utbk-2027-tryouts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast({
      type: 'success',
      title: 'Ekspor CSV Selesai!',
      subtitle: `${state.tryouts.length} berkas tryout berhasil diunduh.`,
    });
  }, [state.platforms, state.tryouts, pushToast]);

  const askConfirm = useCallback((dialog: ConfirmDialogState) => {
    setConfirmDialog(dialog);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const triggerSkeletonDemo = useCallback(() => {
    setIsLoadingSkeleton(true);
    setTimeout(() => {
      setIsLoadingSkeleton(false);
    }, 1100);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        route,
        activeTab,
        navigateTab,
        openStudyForm,
        openTryoutForm,
        openSettings,
        goBackToTab,
        saveSession,
        deleteSession,
        saveTryout,
        deleteTryout,
        addPlatform,
        updatePlatform,
        deletePlatform,
        saveDaySchedule,
        updateSettings,
        resetSettingsToDefault,
        exportTryoutsCsv,
        toasts,
        pushToast,
        dismissToast,
        confirmDialog,
        askConfirm,
        closeConfirm,
        isAddPlatformOpen,
        setAddPlatformOpen,
        isNotificationsOpen,
        setNotificationsOpen,
        isLoadingSkeleton,
        triggerSkeletonDemo,
        networkErrorOpen,
        setNetworkErrorOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
