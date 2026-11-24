import React, { useState } from 'react';
import {
  AlarmClock,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  GraduationCap,
  Hourglass,
  LineChart,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  Terminal,
  User,
} from 'lucide-react';
import { STUDY_GRID_ORDER, SUBTESTS } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import { SubtestCode, UserSettings } from '../types';
import { getDaysRemaining, TODAY_ISO } from '../utils/dateUtils';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettingsToDefault,
    goBackToTab,
    askConfirm,
    pushToast,
  } = useApp();

  const [draft, setDraft] = useState<UserSettings>(settings);

  const daysRemaining = getDaysRemaining(TODAY_ISO, draft.targetDate);
  const dailyHoursLabel = (draft.dailyTargetMinutes / 60).toFixed(1).replace('.0', '');

  const toggleFocusSubtest = (code: SubtestCode) => {
    setDraft((prev) => {
      const exists = prev.focusSubtests.includes(code);
      const next = exists
        ? prev.focusSubtests.filter((c) => c !== code)
        : [...prev.focusSubtests, code];
      return { ...prev, focusSubtests: next };
    });
  };

  const adjustDuration = (delta: number) => {
    setDraft((prev) => ({
      ...prev,
      dailyTargetMinutes: Math.min(600, Math.max(30, prev.dailyTargetMinutes + delta)),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(draft);
    goBackToTab();
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-28">
      {/* Header Banner Section */}
      <div className="w-full bg-surface p-4 rounded-xl border-2 border-ink manga-shadow mb-5 relative overflow-hidden">
        <div className="absolute inset-0 manga-dots opacity-15 pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Kembali"
              onClick={goBackToTab}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container border border-ink text-ink manga-shadow-sm active:translate-y-0.5 transition-transform cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-manga-red-soft text-primary text-[10px] font-bold tracking-wider border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>UTBK 2027 MODE</span>
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-2">
              <h1 className="font-bebas text-[40px] uppercase text-ink tracking-tight leading-none">
                PENGATURAN
              </h1>
              <span className="text-[10px] text-ink-muted uppercase tracking-widest font-bold">
                ICHIGO-V2
              </span>
            </div>
            <p className="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
              <span>Make it your own.</span>
              <span className="text-primary font-bold">•</span>
              <span className="font-medium text-ink">自分らしく。</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* SEKSI 1: TARGET AKADEMIK */}
        <section className="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-primary rounded-full" />
              <h2 className="font-condensed text-[22px] font-bold uppercase text-ink tracking-tight">
                TARGET AKADEMIK
              </h2>
            </div>
            <span className="text-[10px] text-ink-muted font-bold tracking-wider">
              01 / GENERAL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Nama Panggilan
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={draft.userName}
                  onChange={(e) => setDraft({ ...draft, userName: e.target.value })}
                  className="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20 outline-none focus:bg-surface focus:border-ink"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink uppercase tracking-wide">
                  Target Tanggal UTBK
                </label>
                <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] rounded-full font-bold tabular-nums">
                  H-{daysRemaining} HARI
                </span>
              </div>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
                <input
                  type="date"
                  value={draft.targetDate}
                  onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })}
                  className="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20 outline-none focus:bg-surface focus:border-ink"
                />
              </div>
            </div>
          </div>

          {/* Target Skor */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Target Skor Rata-Rata
              </label>
              <span className="px-2 py-0.5 bg-manga-red-soft text-primary text-[10px] rounded-full font-bold">
                Fokus Ambis
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 flex items-center">
                <Flag className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  min={100}
                  max={1000}
                  step={5}
                  value={draft.targetScore}
                  onChange={(e) =>
                    setDraft({ ...draft, targetScore: Number(e.target.value) || 700 })
                  }
                  className="w-full bg-surface-container text-ink font-condensed text-2xl font-bold pl-9 pr-3 py-2 rounded-lg border border-ink/20 outline-none focus:bg-surface focus:border-ink tabular-nums"
                />
              </div>
              <div className="bg-surface-container-high px-3 py-2 rounded-lg text-ink text-[10px] flex flex-col items-center justify-center border border-ink/15">
                <span className="text-ink-muted uppercase font-bold">Passing Grade</span>
                <span className="font-bold text-primary text-xs">+14.2%</span>
              </div>
            </div>
          </div>

          {/* Target PTN & Singkatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Target Perguruan Tinggi (PTN)
              </label>
              <div className="relative flex items-center">
                <GraduationCap className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={draft.targetUniversity}
                  onChange={(e) => setDraft({ ...draft, targetUniversity: e.target.value })}
                  className="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20 outline-none focus:bg-surface focus:border-ink"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Singkatan PTN
              </label>
              <input
                type="text"
                value={draft.targetUniversityShort}
                onChange={(e) => setDraft({ ...draft, targetUniversityShort: e.target.value })}
                className="w-full bg-surface-container text-ink text-sm px-3 py-2.5 rounded-lg border border-ink/20 outline-none focus:bg-surface focus:border-ink uppercase font-bold"
              />
            </div>
          </div>

          {/* Program Studi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wide">
              Program Studi Pilihan
            </label>
            <div className="relative flex items-center">
              <Terminal className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={draft.targetMajor}
                onChange={(e) => setDraft({ ...draft, targetMajor: e.target.value })}
                className="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20 outline-none focus:bg-surface focus:border-ink"
              />
            </div>
          </div>
        </section>

        {/* SEKSI 2: PREFERENSI BELAJAR */}
        <section className="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-primary rounded-full" />
              <h2 className="font-condensed text-[22px] font-bold uppercase text-ink tracking-tight">
                PREFERENSI BELAJAR
              </h2>
            </div>
            <span className="text-[10px] text-ink-muted font-bold tracking-wider">02 / STUDY</span>
          </div>

          {/* Multi-select Subtest Tiles */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Fokus Subtes Utama
              </label>
              <span className="text-xs text-ink-muted">Pilih prioritas drill</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {STUDY_GRID_ORDER.map((code) => {
                const selected = draft.focusSubtests.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleFocusSubtest(code)}
                    className={`relative py-2.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 border transition-transform active:scale-95 cursor-pointer ${
                      selected
                        ? 'bg-primary text-on-primary border-ink manga-shadow-sm'
                        : 'bg-surface-container text-ink border-ink/15 hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="font-bold text-sm leading-none">{code}</span>
                    <span
                      className={`text-[10px] tracking-tight ${
                        selected ? 'text-on-primary/90' : 'text-ink-muted'
                      }`}
                    >
                      {SUBTESTS[code].shortName}
                    </span>
                    {selected && <CheckCircle2 className="w-3.5 h-3.5 absolute top-1 right-1" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDraft({ ...draft, focusSubtests: ['PK', 'PM'] })}
                className="relative py-2.5 px-2 rounded-lg bg-surface-container-high text-ink-muted flex flex-col items-center justify-center gap-0.5 border border-ink/20 active:scale-95 cursor-pointer"
              >
                <span className="font-bold text-sm leading-none">ALL</span>
                <span className="text-[10px] tracking-tight">Reset</span>
              </button>
            </div>
          </div>

          {/* Target Belajar Harian */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Target Belajar Harian
              </label>
              <span className="text-[11px] text-primary font-bold">
                ~{dailyHoursLabel} Jam / Hari
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-surface-container rounded-lg px-3 py-2 border border-ink/20">
                <Clock className="w-4 h-4 text-ink-muted mr-2" />
                <span className="font-condensed text-2xl text-ink font-bold leading-none tabular-nums">
                  {draft.dailyTargetMinutes}
                </span>
                <span className="text-xs text-ink-muted ml-1.5">Menit</span>
              </div>
              {[30, 60, 120].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => adjustDuration(amt)}
                  className="px-3 py-2.5 rounded-lg bg-surface-container text-ink text-xs font-bold border border-ink/20 active:bg-primary active:text-on-primary transition-colors cursor-pointer"
                >
                  +{amt}m
                </button>
              ))}
            </div>
          </div>

          {/* Pomodoro */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wide">
              Durasi Sesi Pomodoro Standar
            </label>
            <div className="relative flex items-center">
              <Hourglass className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
              <select
                value={draft.pomodoroMinutes}
                onChange={(e) => setDraft({ ...draft, pomodoroMinutes: Number(e.target.value) })}
                className="w-full bg-surface-container text-ink text-sm pl-9 pr-8 py-2.5 rounded-lg border border-ink/20 outline-none focus:bg-surface focus:border-ink"
              >
                <option value={45}>45 Menit / Sesi (Fokus Cepat)</option>
                <option value={60}>60 Menit / Sesi (Standar)</option>
                <option value={90}>90 Menit / Sesi (Manga Intensive)</option>
                <option value={120}>120 Menit / Sesi (Simulasi UTBK Penuh)</option>
              </select>
            </div>
          </div>
        </section>

        {/* SEKSI 3: TELEGRAM REMINDERS */}
        <section className="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-primary rounded-full" />
              <div className="flex flex-col">
                <h2 className="font-condensed text-[22px] font-bold uppercase text-ink tracking-tight leading-none">
                  TELEGRAM REMINDERS
                </h2>
                <span className="text-[11px] text-ink-muted leading-tight mt-0.5">
                  Stay on track, one day at a time.
                </span>
              </div>
            </div>
            <span className="text-[10px] text-ink-muted font-bold tracking-wider">
              03 / TELEGRAM
            </span>
          </div>

          {/* Telegram Connection Panel */}
          <div className="p-3 rounded-lg bg-surface-container border border-ink/15 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-[#245582] border border-ink/15 shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        draft.telegram.connected ? 'bg-green-muted animate-pulse' : 'bg-ink-muted'
                      }`}
                    />
                    <span className="text-sm text-ink font-bold leading-tight">
                      {draft.telegram.botHandle}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface text-[10px] font-bold text-ink-muted uppercase">
                      {draft.telegram.connected ? 'Terhubung' : 'Terputus'}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted font-medium mt-0.5">
                    Chat ID: {draft.telegram.chatId} • Telegram Bot API
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    telegram: { ...draft.telegram, connected: !draft.telegram.connected },
                  })
                }
                className="text-ink-muted hover:text-error text-[11px] font-semibold transition-colors pt-1 cursor-pointer"
              >
                {draft.telegram.connected ? 'Putuskan' : 'Hubungkan'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-ink/10 gap-2 flex-wrap">
              <p className="text-[11px] text-ink-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Satu-satunya kanal pengingat aktif (tanpa Web-Push).</span>
              </p>
              <button
                type="button"
                onClick={() =>
                  pushToast({
                    type: 'success',
                    title: 'Pesan Uji Coba Terkirim!',
                    subtitle: `Notifikasi test dikirim ke ${draft.telegram.botHandle}.`,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold manga-shadow-sm active:translate-y-0.5 transition-transform cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Uji Coba</span>
              </button>
            </div>
          </div>

          {/* 3 Reminder Preferences */}
          <div className="flex flex-col gap-2.5">
            {/* Daily Study Reminder */}
            <div className="p-3 rounded-lg bg-surface-container border border-ink/15 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlarmClock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-ink font-bold">Pengingat Belajar Harian</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.telegram.dailyReminder}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        telegram: { ...draft.telegram, dailyReminder: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">
                Dorongan fokus harian untuk membuka jurnal dan konsisten.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-ink-muted uppercase font-bold">
                  Jam Pengiriman
                </span>
                <input
                  type="time"
                  value={draft.telegram.dailyTime}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      telegram: { ...draft.telegram, dailyTime: e.target.value },
                    })
                  }
                  className="bg-surface px-2.5 py-1 rounded border border-ink/20 text-xs font-bold text-ink"
                />
              </div>
            </div>

            {/* Subtest Schedule Reminder */}
            <div className="p-3 rounded-lg bg-surface-container border border-ink/15 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-ink font-bold">Pengingat Jadwal Subtes</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.telegram.scheduleReminder}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        telegram: { ...draft.telegram, scheduleReminder: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">
                Ringkasan subtes terjadwal hari ini (otomatis hening jika libur).
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-ink-muted uppercase font-bold">
                  Jam Pengiriman
                </span>
                <input
                  type="time"
                  value={draft.telegram.scheduleTime}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      telegram: { ...draft.telegram, scheduleTime: e.target.value },
                    })
                  }
                  className="bg-surface px-2.5 py-1 rounded border border-ink/20 text-xs font-bold text-ink"
                />
              </div>
            </div>

            {/* Weekly Evaluation */}
            <div className="p-3 rounded-lg bg-surface-container border border-ink/15 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-amber-muted" />
                  <span className="text-sm text-ink font-bold">Evaluasi Mingguan</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.telegram.weeklyEval}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        telegram: { ...draft.telegram, weeklyEval: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">
                Refleksi streak, kelengkapan catatan sesi, dan evaluasi skor tryout.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-ink-muted uppercase font-bold">Hari &amp; Jam</span>
                <input
                  type="text"
                  value={draft.telegram.weeklyDayTime}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      telegram: { ...draft.telegram, weeklyDayTime: e.target.value },
                    })
                  }
                  className="bg-surface px-2.5 py-1 rounded border border-ink/20 text-xs font-bold text-ink text-right w-32"
                />
              </div>
            </div>
          </div>

          {/* Live Bot Preview */}
          <div className="p-3 rounded-lg bg-paper border border-ink/25 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">
                  PRATINJAU TELEGRAM BOT ({draft.telegram.botHandle})
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-[#144975] text-[9px] font-bold uppercase">
                Bot Preview
              </span>
            </div>
            <div className="bg-surface p-3 rounded border border-ink/20 shadow-sm flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  一歩ずつ、前へ。
                </span>
                <span className="text-[9px] text-ink-muted">{draft.telegram.dailyTime} WIB</span>
              </div>
              <div className="text-xs text-ink font-medium leading-snug">
                Time to study!
                <br />
                Your study session is waiting. Open your UTBK Study Journal and keep moving forward.
              </div>
              <div className="mt-1 pt-1.5 border-t border-surface-container">
                <span className="inline-block px-2 py-0.5 rounded bg-surface-container text-[10px] text-ink font-semibold">
                  Hari ini: {draft.focusSubtests.join(' · ') || 'Semua Subtes'} | Target: &gt;
                  {draft.targetScore} {draft.targetUniversityShort}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SEKSI 4: DATA & CADANGAN */}
        <section className="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-primary rounded-full" />
              <h2 className="font-condensed text-[22px] font-bold uppercase text-ink tracking-tight">
                DATA &amp; CADANGAN
              </h2>
            </div>
            <span className="text-[10px] text-ink-muted font-bold tracking-wider">04 / CLOUD</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container border border-ink/15">
            <div className="w-2.5 h-2.5 rounded-full bg-green-muted shrink-0 animate-pulse" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-bold text-ink truncate">
                Penyimpanan Lokal &amp; Cloud Sync
              </span>
              <span className="text-[11px] text-ink-muted">
                Sinkronisasi terakhir: Aktif real-time
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                pushToast({
                  type: 'success',
                  title: 'Sinkronisasi Sukses!',
                  subtitle: 'Preferensi dan riwayat belajar tersimpan aman.',
                })
              }
              className="px-3 py-1.5 rounded bg-surface border border-ink text-ink text-[11px] font-bold active:scale-95 transition-transform cursor-pointer"
            >
              Sync
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              askConfirm({
                title: 'Reset ke Pengaturan Awal?',
                description:
                  'Semua target akademik, fokus subtes, dan jadwal pengingat Telegram akan dikembalikan ke default awal UTBK 2027.',
                confirmLabel: 'Ya, Reset Awal',
                onConfirm: () => {
                  resetSettingsToDefault();
                  goBackToTab();
                },
              })
            }
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-manga-red-soft text-manga-red-dark hover:bg-error-container border-2 border-ink font-condensed text-base font-bold manga-shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET KE PENGATURAN AWAL</span>
          </button>
        </section>

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t-2 border-ink px-4 py-3 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={goBackToTab}
              className="w-28 py-3 px-3 rounded-lg bg-surface-container text-ink font-condensed text-base font-bold border-2 border-ink manga-shadow-sm active:translate-y-0.5 transition-all text-center cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-lg bg-primary text-on-primary font-condensed text-base font-bold border-2 border-ink manga-shadow active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>SIMPAN PERUBAHAN</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
