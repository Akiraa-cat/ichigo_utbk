import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudOff,
  Edit3,
  Info,
  Palette,
  RefreshCw,
  Save,
  Send,
  Trash2,
  TrendingUp,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { PLATFORM_COLORS } from '../constants/subtests';
import { useApp } from '../context/AppContext';

export const MangaOverlays: React.FC = () => {
  const {
    toasts,
    dismissToast,
    confirmDialog,
    closeConfirm,
    isAddPlatformOpen,
    setAddPlatformOpen,
    addPlatform,
    isNotificationsOpen,
    setNotificationsOpen,
    settings,
    triggerSkeletonDemo,
    networkErrorOpen,
    setNetworkErrorOpen,
    openSettings,
    pushToast,
  } = useApp();

  // Add Platform Form State
  const [pfName, setPfName] = useState('Kuasai SNBT');
  const [pfColorHex, setPfColorHex] = useState('#83A78D');
  const [pfColorName, setPfColorName] = useState('Muted Green');
  const [pfRatingType, setPfRatingType] = useState('Item Response Theory (IRT)');

  // Network Error Modal Retry State
  const [retryStatus, setRetryStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleSavePlatform = () => {
    const trimmed = pfName.trim();
    if (!trimmed) {
      pushToast({
        type: 'error',
        title: 'Nama Platform Kosong',
        subtitle: 'Silakan masukkan nama aplikasi atau penyedia tryout.',
      });
      return;
    }
    const words = trimmed.split(/\s+/);
    const shortCode =
      words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase();

    addPlatform({
      name: trimmed,
      shortCode,
      colorHex: pfColorHex,
      colorName: pfColorName,
      ratingType: pfRatingType,
      badgeText: 'BARU',
    });
    setAddPlatformOpen(false);
    setPfName('');
  };

  const handleRetryNetwork = () => {
    setRetryStatus('loading');
    setTimeout(() => {
      setRetryStatus('done');
      setTimeout(() => {
        setNetworkErrorOpen(false);
        setRetryStatus('idle');
        pushToast({
          type: 'success',
          title: 'Sinkronisasi Pulih!',
          subtitle: 'Data sesi lokal berhasil disinkronkan.',
        });
      }, 600);
    }, 800);
  };

  return (
    <>
      {/* 1. TOAST STACK */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-md flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-surface p-3 rounded-xl border-2 border-ink manga-shadow flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-ink ${
                  t.type === 'success'
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : t.type === 'offline'
                    ? 'bg-amber-muted/25 text-ink'
                    : 'bg-manga-red-soft text-primary'
                }`}
              >
                {t.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : t.type === 'offline' ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">
                    {t.title}
                  </span>
                  {t.type === 'offline' && (
                    <span className="px-1.5 py-0.2 bg-surface-container-highest text-[9px] font-bold rounded">
                      LOCAL
                    </span>
                  )}
                </div>
                {t.subtitle && (
                  <span className="text-xs text-ink-muted truncate">{t.subtitle}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {t.actionLabel && t.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    t.onAction?.();
                    dismissToast(t.id);
                  }}
                  className="px-2.5 py-1 bg-surface-container-high rounded text-ink text-[11px] font-bold border border-ink/20 hover:bg-surface-container-highest cursor-pointer"
                >
                  {t.actionLabel}
                </button>
              )}
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => dismissToast(t.id)}
                className="p-1 text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 2. DESTRUCTIVE CONFIRMATION MODAL */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeConfirm}
        >
          <div
            className="relative w-full max-w-sm bg-surface rounded-xl p-5 border-2 border-ink manga-shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 manga-dots opacity-5 pointer-events-none" />
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 border-2 border-ink manga-shadow-sm">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bebas text-xl text-primary tracking-wide uppercase leading-none">
                  {confirmDialog.title}
                </span>
                <p className="text-xs text-ink mt-1.5 leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex gap-2.5 justify-end pt-4 mt-3 border-t border-ink/10">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-4 py-2 bg-surface-container text-ink rounded-lg text-xs font-bold uppercase border border-ink manga-shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                {confirmDialog.cancelLabel || 'Batal Simpan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  closeConfirm();
                }}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase border border-ink manga-shadow-sm active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDialog.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FULLSCREEN MANGA ERROR DIALOG */}
      {networkErrorOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setNetworkErrorOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-surface rounded-xl p-5 border-2 border-ink manga-shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 manga-dots opacity-5 pointer-events-none" />

            <div className="relative z-10 flex justify-between items-center mb-3">
              <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded uppercase tracking-wider">
                Pemberitahuan Sistem
              </span>
              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={() => setNetworkErrorOpen(false)}
                className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-ink border border-ink/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-14 h-14 bg-manga-red-soft text-primary rounded-xl border-2 border-ink flex items-center justify-center manga-shadow-sm transform rotate-2">
                  <CloudOff className="w-8 h-8" />
                </div>
                <div className="absolute -right-5 -top-1 bg-surface px-1.5 py-0.5 rounded border border-ink manga-shadow-sm text-ink text-[10px] font-bold rotate-12">
                  BAKUM!
                </div>
              </div>

              <div className="bg-primary text-on-primary px-3 py-1 rounded border border-ink manga-shadow-sm transform -rotate-1 mb-2">
                <span className="font-bebas text-xl tracking-wider">GAGAL MENYIMPAN SESI!</span>
              </div>

              <p className="text-xs text-ink max-w-xs mt-1 leading-relaxed">
                Koneksi terputus saat menghubungi server pusat. Data sesi belajarmu{' '}
                <strong className="text-primary">tetap tersimpan aman di perangkat</strong> dan
                tidak akan hilang.
              </p>

              <div className="w-full bg-surface-container-low p-2.5 rounded-lg mt-3 text-left flex items-start gap-2 border border-ink/15">
                <WifiOff className="w-4 h-4 text-ink-muted mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-ink-muted font-bold uppercase">
                    Status Koneksi
                  </span>
                  <span className="text-xs text-ink font-semibold truncate">
                    ERR_NETWORK_TIMEOUT (504 Gateway)
                  </span>
                </div>
              </div>

              <div className="w-full mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setNetworkErrorOpen(false)}
                  className="py-2.5 bg-surface-container-highest text-ink font-condensed text-base font-bold rounded-lg border border-ink manga-shadow-sm active:translate-y-0.5 uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRetryNetwork}
                  className="py-2.5 bg-primary text-on-primary font-condensed text-base font-bold rounded-lg border border-ink manga-shadow-sm active:translate-y-0.5 uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {retryStatus === 'loading' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : retryStatus === 'done' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Coba Lagi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. NOTIFICATIONS & STATUS DRAWER */}
      {isNotificationsOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm flex justify-end"
          onClick={() => setNotificationsOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-paper h-full border-l-2 border-ink p-4 flex flex-col gap-4 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
              <div>
                <h2 className="font-bebas text-2xl text-ink uppercase leading-none">
                  NOTIFIKASI & STATUS
                </h2>
                <p className="text-[11px] text-ink-muted font-semibold">
                  Pengingat Telegram & Sinkronisasi Lokal
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup panel notifikasi"
                onClick={() => setNotificationsOpen(false)}
                className="w-9 h-9 rounded-lg bg-surface border-2 border-ink manga-shadow-sm flex items-center justify-center text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Telegram Bot Preview Card */}
            <div className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-ink uppercase">
                    {settings.telegram.botHandle}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed uppercase">
                  {settings.telegram.connected ? 'Terhubung' : 'Nonaktif'}
                </span>
              </div>
              <div className="bg-paper p-2.5 rounded-lg border border-ink/20 text-xs text-ink space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-primary">
                  <span>一歩ずつ、前へ。</span>
                  <span className="text-ink-muted">{settings.telegram.dailyTime} WIB</span>
                </div>
                <p className="leading-snug">
                  Time to study! Target hari ini: {settings.focusSubtests.join(' · ')} menuju{' '}
                  <strong>{settings.targetUniversityShort}</strong> (&gt;{settings.targetScore}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  openSettings();
                }}
                className="text-[11px] font-bold text-primary hover:underline text-left cursor-pointer"
              >
                Atur Jadwal Pengingat Telegram →
              </button>
            </div>

            {/* Offline Local Sync Banner */}
            <div className="bg-surface p-3 rounded-xl border-2 border-ink manga-shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-muted/20 border border-ink/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-ink" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-ink uppercase">Penyimpanan Lokal Aktif</span>
                <span className="text-[11px] text-ink-muted">
                  Semua sesi & skor tersimpan otomatis di perangkat.
                </span>
              </div>
            </div>

            {/* Interactive UI State Matrix Test Triggers */}
            <div className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Uji Status Antarmuka
              </span>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  triggerSkeletonDemo();
                }}
                className="w-full py-2 px-3 bg-paper rounded-lg border border-ink manga-shadow-sm text-xs font-bold text-ink text-left hover:bg-surface-container cursor-pointer"
              >
                Simulasi Skeleton Loading UI (1.1 dtk)
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  setNetworkErrorOpen(true);
                }}
                className="w-full py-2 px-3 bg-manga-red-soft rounded-lg border border-ink manga-shadow-sm text-xs font-bold text-manga-red-dark text-left hover:brightness-95 cursor-pointer"
              >
                Uji Dialog Error Koneksi Manga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD PLATFORM MODAL (Tambah Aplikasi — Registrasi Platform) */}
      {isAddPlatformOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex flex-col justify-end md:justify-center md:items-center md:p-4"
          onClick={() => setAddPlatformOpen(false)}
        >
          <div
            className="relative w-full md:max-w-md bg-surface rounded-t-2xl md:rounded-2xl border-t-2 md:border-2 border-ink shadow-2xl pt-3 pb-7 px-4 md:p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull Handle */}
            <div className="w-full flex justify-center py-0.5 md:hidden">
              <div className="w-12 h-1.5 bg-ink/25 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-manga-red-soft text-manga-red-dark text-[10px] rounded uppercase font-bold tracking-wider">
                    REGISTRASI SUMBER
                  </span>
                </div>
                <h2 className="font-condensed text-[26px] font-bold uppercase text-ink tracking-tight leading-tight">
                  TAMBAH APLIKASI TRYOUT
                </h2>
                <p className="text-xs text-ink-muted">
                  Daftarkan platform tryout baru untuk pelacakan grafik.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup Modal"
                onClick={() => setAddPlatformOpen(false)}
                className="w-9 h-9 shrink-0 flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-ink rounded-lg border border-ink manga-shadow-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="platform-name-input"
                  className="text-xs font-bold uppercase text-ink tracking-wide flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4 text-primary" />
                  <span>NAMA APLIKASI / PENYEDIA</span>
                </label>
                <input
                  id="platform-name-input"
                  type="text"
                  value={pfName}
                  onChange={(e) => setPfName(e.target.value)}
                  placeholder="Contoh: Zenius Ultima, Brain Academy..."
                  className="w-full h-11 px-3.5 bg-paper text-ink text-sm font-medium rounded-lg border-2 border-ink focus:outline-none focus:bg-surface"
                />
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Gunakan nama unik agar mudah dibedakan di grafik.</span>
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-ink tracking-wide">
                  TIPE PENILAIAN
                </label>
                <select
                  value={pfRatingType}
                  onChange={(e) => setPfRatingType(e.target.value)}
                  className="w-full h-11 px-3 bg-paper text-ink text-sm font-medium rounded-lg border-2 border-ink focus:outline-none"
                >
                  <option value="Item Response Theory (IRT)">Item Response Theory (IRT)</option>
                  <option value="Skor Baku Mentah (Klasik)">Skor Baku Mentah (Klasik)</option>
                  <option value="Persentil Bobot SNBT">Persentil Bobot SNBT</option>
                </select>
              </div>

              {/* 5 Official Colors */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-ink tracking-wide flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-primary" />
                    <span>WARNA SERI GRAFIK</span>
                  </label>
                  <span className="text-[11px] text-primary uppercase font-bold">
                    {pfColorName}
                  </span>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-ink/15 flex items-center justify-between gap-2">
                  {PLATFORM_COLORS.map((c) => {
                    const selected = pfColorHex === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        title={`${c.name} (${c.hex})`}
                        onClick={() => {
                          setPfColorHex(c.hex);
                          setPfColorName(c.name);
                        }}
                        style={{ backgroundColor: c.hex }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform cursor-pointer border-2 border-ink ${
                          selected
                            ? 'scale-105 ring-2 ring-offset-2 ring-ink manga-shadow-sm'
                            : 'hover:scale-105 opacity-90'
                        }`}
                      >
                        {selected && <Check className="w-5 h-5 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Legend Preview */}
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-ink/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-ink-muted tracking-wider font-bold">
                    PREVIEW PADA LEGENDA GRAFIK:
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded uppercase">
                    LIVE SYNC
                  </span>
                </div>

                <div className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-ink/30"
                        style={{ backgroundColor: pfColorHex }}
                      />
                      <span
                        className="w-5 h-1 rounded-full"
                        style={{ backgroundColor: pfColorHex }}
                      />
                    </div>
                    <span className="text-xs font-bold text-ink truncate">
                      {pfName.trim() || 'Nama Aplikasi'} • Skor Terakhir: 710
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 pl-2">
                    <span className="font-condensed text-xl font-bold text-ink leading-none tabular-nums">
                      710
                    </span>
                    <TrendingUp className="w-4 h-4 text-tertiary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleSavePlatform}
                className="w-full h-12 bg-primary text-on-primary font-condensed text-base font-bold uppercase tracking-wider rounded-xl border-2 border-ink manga-shadow hover:bg-manga-red-dark transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>SIMPAN APLIKASI</span>
              </button>
              <button
                type="button"
                onClick={() => setAddPlatformOpen(false)}
                className="w-full h-11 bg-surface-container text-ink font-condensed text-base font-bold uppercase tracking-wider rounded-xl border border-ink/30 hover:bg-surface-container-high transition-all flex items-center justify-center cursor-pointer"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
