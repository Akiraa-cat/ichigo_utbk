import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Flame,
  Gauge,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { PLANNER_ACTIVITIES, SUBTESTS } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import {
  addDaysIso,
  buildMonthGrid,
  formatDurationCompact,
  formatDurationHHMM,
  formatIndonesianFull,
  formatIndonesianSheetDate,
  formatMonthYearUpper,
  TODAY_ISO,
} from '../utils/dateUtils';

export const AgendaScreen: React.FC = () => {
  const {
    sessions,
    schedules,
    settings,
    openStudyForm,
    deleteSession,
    askConfirm,
    navigateTab,
  } = useApp();

  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // 10 = November
  const [selectedIso, setSelectedIso] = useState<string>('2026-11-18');
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // Group total minutes per date
  const minutesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      map[s.date] = (map[s.date] || 0) + s.durationMinutes;
    });
    return map;
  }, [sessions]);

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthSessions = useMemo(
    () => sessions.filter((s) => s.date.startsWith(monthPrefix)),
    [sessions, monthPrefix]
  );

  const monthTotalMinutes = monthSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const activeDaysSet = new Set(monthSessions.map((s) => s.date));
  const activeDaysCount = activeDaysSet.size;
  const avgDailyMinutes = activeDaysCount > 0 ? Math.round(monthTotalMinutes / activeDaysCount) : 0;

  const selectedDaySessions = useMemo(
    () => sessions.filter((s) => s.date === selectedIso),
    [sessions, selectedIso]
  );
  const selectedDayMinutes = selectedDaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const targetPct = Math.round((selectedDayMinutes / Math.max(1, settings.dailyTargetMinutes)) * 100);

  const selectedSubtestsUnique = Array.from(
    new Set(selectedDaySessions.flatMap((s) => s.subtests))
  );

  const tomorrowIso = addDaysIso(TODAY_ISO, 1);
  const tomorrowSchedule = schedules[tomorrowIso]?.activities ?? ['PK', 'LBI', 'PM'];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const getHeatStyles = (mins: number, isFuture: boolean) => {
    if (isFuture && mins === 0) {
      return 'bg-paper/70 border border-dashed border-ink/25 text-ink-muted/60';
    }
    if (mins === 0) {
      return 'bg-paper border border-ink/25 text-ink-muted';
    }
    if (mins < 60) {
      return 'bg-[#FCE8E7] border border-ink text-ink';
    }
    if (mins <= 120) {
      return 'bg-[#F3B3B0] border border-ink text-ink';
    }
    if (mins <= 210) {
      return 'bg-[#E26D72] border border-ink text-white';
    }
    return 'bg-primary border border-ink text-white';
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Top Motivation & Manga Speech Bubble Header */}
      <section className="flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white border border-ink text-ink manga-shadow-sm">
            AKTIVITAS &amp; KONSISTENSI BELAJAR
          </span>
          <span className="text-[11px] font-bold text-ink-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            <span>{formatIndonesianFull(TODAY_ISO)}</span>
          </span>
        </div>

        <div className="relative bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-manga-red-soft text-primary border-2 border-ink flex items-center justify-center shrink-0 manga-shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bebas text-lg tracking-wider text-primary leading-none">
                KONTRIBUSI HARIAN
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-500 rounded uppercase">
                STREAK ON!
              </span>
            </div>
            <p className="text-xs font-semibold text-ink leading-snug mt-1">
              “Konsistensi kecil setiap hari kunci lolos UTBK! 一期一会 (Ichigo Ichie)”
            </p>
          </div>
        </div>
      </section>

      {/* Month Bar Controller */}
      <div className="flex items-center justify-between bg-surface rounded-xl px-3 py-2 border-2 border-ink manga-shadow">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={handlePrevMonth}
          className="w-9 h-9 rounded-lg bg-paper border-2 border-ink flex items-center justify-center text-ink active:translate-x-0.5 active:translate-y-0.5 transition-transform manga-shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bebas text-2xl tracking-wider text-ink leading-none mt-0.5">
            {formatMonthYearUpper(viewYear, viewMonth)}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-paper border border-ink rounded">
            {activeDaysCount} HARI AKTIF
          </span>
        </div>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={handleNextMonth}
          className="w-9 h-9 rounded-lg bg-paper border-2 border-ink flex items-center justify-center text-ink active:translate-x-0.5 active:translate-y-0.5 transition-transform manga-shadow-sm cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Responsive Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Heatmap Calendar Panel */}
        <section className="lg:col-span-7 bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-paper">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full border border-ink" />
              <span className="font-bebas text-xl uppercase tracking-wide text-ink leading-none">
                KALENDER BELAJAR
              </span>
            </div>
            <span className="text-[11px] font-bold text-ink-muted">
              Klik tanggal untuk rincian
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bebas text-base text-ink-muted">
            <span className="py-0.5">SEN</span>
            <span className="py-0.5">SEL</span>
            <span className="py-0.5">RAB</span>
            <span className="py-0.5">KAM</span>
            <span className="py-0.5">JUM</span>
            <span className="py-0.5">SAB</span>
            <span className="py-0.5 text-primary">MIN</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell) => {
              if (!cell.inMonth) {
                return (
                  <div
                    key={cell.iso}
                    className="aspect-square rounded p-1 bg-surface-container-low/40 border border-dashed border-ink/15 opacity-40 flex flex-col justify-between"
                  >
                    <span className="text-[9px] font-semibold text-ink-muted">{cell.day}</span>
                  </div>
                );
              }
              const mins = minutesByDate[cell.iso] || 0;
              const isSelected = cell.iso === selectedIso;
              const isFuture = cell.iso > TODAY_ISO;
              const heatClass = getHeatStyles(mins, isFuture);

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    setSelectedIso(cell.iso);
                    setSheetOpen(true);
                  }}
                  className={`aspect-square rounded p-1 flex flex-col justify-between text-left transition-all cursor-pointer hover:scale-105 active:scale-95 ${heatClass} ${
                    isSelected
                      ? 'ring-2 ring-ink border-[2.5px] border-ink manga-shadow-sm scale-105 z-10'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold leading-none tabular-nums">
                      {cell.day}
                    </span>
                    {cell.iso === TODAY_ISO && (
                      <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full border border-ink/40" />
                    )}
                  </div>
                  <span className="text-[8px] font-extrabold leading-none tabular-nums">
                    {mins > 0 ? formatDurationHHMM(mins) : isFuture ? '' : '-'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-2 border-t-2 border-paper">
            <span className="text-[10px] font-bold text-ink-muted uppercase">SEDIKIT</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-paper border border-ink/30" title="0 jam" />
              <div
                className="w-3.5 h-3.5 rounded-sm bg-[#FCE8E7] border border-ink/50"
                title="< 1 jam"
              />
              <div
                className="w-3.5 h-3.5 rounded-sm bg-[#F3B3B0] border border-ink/50"
                title="1-2 jam"
              />
              <div
                className="w-3.5 h-3.5 rounded-sm bg-[#E26D72] border border-ink/70"
                title="2-3.5 jam"
              />
              <div
                className="w-3.5 h-3.5 rounded-sm bg-primary border border-ink"
                title="> 3.5 jam"
              />
            </div>
            <span className="text-[10px] font-bold text-ink uppercase">BANYAK</span>
          </div>
        </section>

        {/* RIGHT: Selected Day Card + Monthly Stats + Tomorrow Schedule */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Selected Day Detail Card */}
          <section className="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 manga-dots opacity-10 pointer-events-none rounded-full" />
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-ink">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary text-white tracking-wider border border-ink">
                  TERPILIH
                </span>
                <span className="font-bebas text-xl uppercase text-ink leading-none mt-0.5">
                  {selectedIso === TODAY_ISO ? 'HARI INI' : formatIndonesianSheetDate(selectedIso)}
                </span>
              </div>
              {selectedDayMinutes > 0 && (
                <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>TERCATAT</span>
                </div>
              )}
            </div>

            {selectedDaySessions.length === 0 ? (
              <div className="py-4">
                <EmptyStateCard
                  title="Belum Ada Sesi Belajar"
                  description="Ceritamu dimulai dari satu sesi pertama. Langkah kecil hari ini adalah lompatan besar di UTBK 2027."
                  ctaLabel="+ Mulai Sesi Pertama"
                  onCta={() => openStudyForm({ date: selectedIso })}
                />
              </div>
            ) : (
              <>
                <div className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                      DURASI BELAJAR
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="font-bebas text-4xl text-primary tracking-wide leading-none tabular-nums">
                        {formatDurationHHMM(selectedDayMinutes)}
                      </span>
                      <span className="text-xs font-bold text-ink-muted tabular-nums">
                        ({selectedDayMinutes} Menit)
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                      TARGET HARIAN
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-bebas text-xl text-ink leading-none tabular-nums">
                        {settings.dailyTargetMinutes} MIN
                      </span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 rounded tabular-nums">
                        {targetPct}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-paper rounded-lg p-2.5 border border-ink/30 flex flex-col space-y-1.5 mb-3">
                  <span className="text-[10px] uppercase font-bold text-ink-muted">
                    SUBTES YANG DIKERJAKAN:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubtestsUnique.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-1 rounded bg-white border border-ink text-ink text-xs font-semibold flex items-center gap-1.5 manga-shadow-sm"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-ink/30"
                          style={{ backgroundColor: SUBTESTS[code].bgHex }}
                        />
                        <span>
                          {SUBTESTS[code].name} ({code})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="h-11 rounded-lg bg-surface text-ink border-2 border-ink manga-shadow-sm font-condensed text-base font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>RINCIAN SESI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudyForm({ date: selectedIso })}
                    className="h-11 rounded-lg bg-primary text-on-primary border-2 border-ink manga-shadow-sm font-condensed text-base font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ CATAT SESI</span>
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Monthly Stats 3-Column Summary Bar */}
          <section className="grid grid-cols-3 gap-2">
            <div className="bg-surface rounded-xl p-2.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1 text-ink-muted">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-tight">TOTAL JAM</span>
              </div>
              <div className="mt-2">
                <span className="font-bebas text-2xl text-ink leading-none block tabular-nums">
                  {formatDurationCompact(monthTotalMinutes)}
                </span>
                <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">
                  Bulan Ini
                </span>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-2.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1 text-ink-muted">
                <Gauge className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-tight">RATA-RATA</span>
              </div>
              <div className="mt-2">
                <span className="font-bebas text-2xl text-ink leading-none block tabular-nums">
                  {formatDurationCompact(avgDailyMinutes)}
                </span>
                <span className="text-[9px] text-ink-muted font-semibold block mt-0.5">
                  per hari aktif
                </span>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-2.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between bg-gradient-to-b from-white to-manga-red-soft/30">
              <div className="flex items-center gap-1 text-primary">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-tight">HARI AKTIF</span>
              </div>
              <div className="mt-2">
                <span className="font-bebas text-2xl text-primary leading-none block tabular-nums">
                  {activeDaysCount} HARI
                </span>
                <span className="text-[9px] text-ink font-bold block mt-0.5">Sesi Tercatat</span>
              </div>
            </div>
          </section>

          {/* Tomorrow's Schedule Preview */}
          <section className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-paper">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bebas text-xl uppercase tracking-wide text-ink leading-none">
                      JADWAL BESOK!
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-primary text-white font-extrabold rounded uppercase tracking-wider">
                      TERJADWAL
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-muted uppercase font-bold mt-0.5">
                    {formatIndonesianFull(tomorrowIso)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-paper border border-ink text-ink">
                {tomorrowSchedule.length} SUBTES
              </span>
            </div>

            <div className="flex flex-col space-y-2">
              {tomorrowSchedule.map((code) => {
                const meta = PLANNER_ACTIVITIES[code];
                return (
                  <div
                    key={code}
                    className="bg-paper border-2 border-ink rounded-lg p-2.5 flex items-center gap-3 manga-shadow-sm"
                  >
                    <span
                      className="w-9 h-9 rounded border border-ink font-bebas text-lg flex items-center justify-center shrink-0 leading-none"
                      style={{ backgroundColor: meta.bgHex, color: meta.textHex }}
                    >
                      {meta.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink leading-tight truncate">
                        {meta.name}
                      </p>
                      <p className="text-[10px] text-ink-muted truncate">{meta.hint}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigateTab('jadwal')}
              className="w-full py-2.5 px-3 rounded-lg bg-paper border-2 border-ink manga-shadow-sm text-xs font-bold text-ink text-center flex items-center justify-center gap-1.5 hover:bg-surface-container active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Lihat Seluruh Rencana di Jadwal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        </div>
      </div>

      {/* MANGA DETAIL BOTTOM SHEET */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/65 backdrop-blur-[2px] flex flex-col justify-end md:items-center md:justify-center md:p-4"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full md:max-w-lg max-h-[85vh] bg-surface border-t-[3px] md:border-[3px] border-ink rounded-t-2xl md:rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="pt-3 pb-1 flex justify-center items-center bg-paper md:hidden">
              <div className="w-12 h-1.5 bg-ink rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 bg-paper border-b-2 border-ink flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 manga-dots opacity-10 pointer-events-none" />
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-ink text-white rounded border border-ink uppercase">
                    HISTORI BELAJAR
                  </span>
                  <span className="font-bebas text-xl text-ink tracking-wide leading-none mt-0.5">
                    {formatIndonesianSheetDate(selectedIso)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-bold text-ink-muted">TOTAL:</span>
                  <span className="font-bebas text-lg text-primary leading-none tabular-nums">
                    {formatDurationHHMM(selectedDayMinutes)} ({selectedDayMinutes} MENIT)
                  </span>
                  {selectedDayMinutes > 0 && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-400 px-1.5 rounded tabular-nums">
                      Target Tercapai {targetPct}%
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setSheetOpen(false)}
                className="w-9 h-9 rounded-lg bg-surface border-2 border-ink flex items-center justify-center text-ink manga-shadow-sm z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bebas text-base uppercase text-ink tracking-wider">
                    RINCIAN SESI BELAJAR
                  </span>
                  <span className="text-[11px] font-bold text-ink-muted">
                    {selectedDaySessions.length} Sesi Tercatat
                  </span>
                </div>

                {selectedDaySessions.length === 0 ? (
                  <p className="text-xs text-ink-muted bg-paper p-3 rounded-lg border border-ink/20">
                    Belum ada sesi belajar tercatat pada tanggal ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDaySessions.map((ses) => (
                      <div
                        key={ses.id}
                        className="bg-paper rounded-xl p-3 border-2 border-ink manga-shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {ses.subtests.map((code) => (
                              <span
                                key={code}
                                className="px-2 py-0.5 rounded border border-ink font-bebas text-sm leading-none"
                                style={{
                                  backgroundColor: SUBTESTS[code].bgHex,
                                  color: SUBTESTS[code].textHex,
                                }}
                              >
                                {code}
                              </span>
                            ))}
                            <span className="text-xs font-bold text-ink tabular-nums">
                              {ses.startTime} WIB · {ses.durationMinutes} Menit
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              aria-label="Edit sesi"
                              onClick={() => {
                                setSheetOpen(false);
                                openStudyForm({ sessionId: ses.id, date: ses.date });
                              }}
                              className="w-8 h-8 rounded bg-surface border border-ink flex items-center justify-center text-ink hover:bg-surface-container cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Hapus sesi"
                              onClick={() =>
                                askConfirm({
                                  title: 'Hapus Sesi Belajar?',
                                  description: `Sesi belajar ${ses.durationMinutes} menit pada tanggal ${formatIndonesianSheetDate(
                                    ses.date
                                  )} akan dihapus permanen.`,
                                  confirmLabel: 'Ya, Hapus Saja',
                                  onConfirm: () => deleteSession(ses.id),
                                })
                              }
                              className="w-8 h-8 rounded bg-manga-red-soft border border-ink flex items-center justify-center text-primary cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {ses.notes && (
                          <div className="relative mt-2">
                            <div className="bg-white rounded-xl border-2 border-ink p-3 text-xs text-ink leading-relaxed">
                              <div className="flex items-center justify-between pb-1 mb-1 border-b border-ink/15">
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-primary text-white rounded">
                                  NOTE!
                                </span>
                                <span className="text-[10px] font-extrabold text-manga-red-dark">
                                  #KONSISTEN
                                </span>
                              </div>
                              <p className="font-medium text-ink">“{ses.notes}”</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="h-11 rounded-lg bg-surface border-2 border-ink manga-shadow-sm font-bebas text-lg uppercase tracking-wider text-ink flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>KEMBALI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    openStudyForm({ date: selectedIso });
                  }}
                  className="h-11 rounded-lg bg-primary text-on-primary border-2 border-ink manga-shadow-sm font-bebas text-lg uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ CATAT SESI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
