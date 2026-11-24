import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  PlusCircle,
  Save,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { PLANNER_ACTIVITIES } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import { PlannerActivityCode } from '../types';
import {
  buildMonthGrid,
  formatIndonesianSheetDate,
  formatMonthYearUpper,
} from '../utils/dateUtils';

const SUBTEST_TILES: PlannerActivityCode[] = ['PK', 'PM', 'PU', 'PPU', 'PBM', 'LBI', 'LBE', 'TO'];
const RECOVERY_TILES: PlannerActivityCode[] = ['REST', 'EVAL', 'REVIEW', 'FREE'];

export const JadwalScreen: React.FC = () => {
  const { schedules, saveDaySchedule } = useApp();

  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // November
  const [selectedIso, setSelectedIso] = useState('2026-11-25');

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftActivities, setDraftActivities] = useState<PlannerActivityCode[]>([]);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedActivities = schedules[selectedIso]?.activities ?? [];
  const estimatedMinutes = selectedActivities.length * 50;

  // Weekly progress calculation (days 23-29 of current month or week of selectedIso)
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const scheduledCountMonth = Object.entries(schedules)
    .filter(([date]) => date.startsWith(monthPrefix))
    .reduce((sum, [, sch]) => sum + sch.activities.length, 0);
  const weeklyTarget = 12;
  const completedCount = Math.min(weeklyTarget, Math.max(4, Math.round(scheduledCountMonth * 0.25)));
  const progressPct = Math.min(100, Math.round((completedCount / weeklyTarget) * 100));

  const openScheduleEditor = (iso: string) => {
    setSelectedIso(iso);
    setDraftActivities(schedules[iso]?.activities ?? ['PK', 'PM']);
    setSheetOpen(true);
  };

  const toggleDraftActivity = (code: PlannerActivityCode) => {
    setDraftActivities((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSaveSchedule = () => {
    saveDaySchedule(selectedIso, draftActivities);
    setSheetOpen(false);
  };

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

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Top Manga Announcement & Legend */}
      <section className="relative bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 manga-dots opacity-15 pointer-events-none rounded-full" />
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-paper px-2 py-0.5 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="font-condensed text-xs uppercase tracking-wider text-ink font-bold leading-none">
                RENCANA BELAJAR • ROAD TO ITS SI 2027
              </span>
            </div>
            <h2 className="font-condensed text-lg uppercase text-ink tracking-wide leading-tight font-bold">
              “DISIPLIN HARI INI, LOLOS BESOK!”
            </h2>
            <p className="text-xs text-ink-muted leading-tight">
              Konsistensi subtes TPS &amp; Literasi harian menuju target 720+.
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-manga-red-soft border-2 border-ink flex items-center justify-center shrink-0 manga-shadow-sm">
            <Calendar className="w-5 h-5 text-manga-red-dark" />
          </div>
        </div>

        {/* Subtes Legend Strip */}
        <div className="mt-3 pt-2.5 border-t border-dashed border-ink flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-ink-muted shrink-0 mr-1">
            SUBTES:
          </span>
          {(['PK', 'PM', 'PU', 'PPU', 'TO', 'LBI', 'LBE', 'EVAL'] as PlannerActivityCode[]).map(
            (code) => {
              const meta = PLANNER_ACTIVITIES[code];
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-condensed uppercase font-bold border border-ink shrink-0"
                  style={{ backgroundColor: `${meta.bgHex}33`, color: '#171717' }}
                >
                  <span
                    className="w-2 h-2 rounded-full border border-ink"
                    style={{ backgroundColor: meta.bgHex }}
                  />
                  <span>{code}</span>
                </span>
              );
            }
          )}
        </div>
      </section>

      {/* Weekly Progress Strip */}
      <section className="bg-surface rounded-xl p-3 border-2 border-ink manga-shadow-sm">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <span className="font-condensed text-xs uppercase font-bold text-ink truncate">
              TARGET PEKAN INI: {weeklyTarget} SUBTES
            </span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container border border-ink text-ink shrink-0 tabular-nums">
            {completedCount} Selesai / {weeklyTarget - completedCount} Menunggu ({progressPct}%)
          </span>
        </div>
        <div className="w-full h-3.5 bg-paper rounded border border-ink overflow-hidden relative">
          <div
            className="h-full bg-primary flex items-center justify-end pr-1.5 text-[9px] font-bold text-on-primary transition-all"
            style={{ width: `${progressPct}%` }}
          >
            {progressPct}%
          </div>
          <div className="absolute inset-0 manga-dots opacity-10 pointer-events-none" />
        </div>
      </section>

      {/* Month Navigation Header */}
      <section className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-condensed text-[26px] uppercase text-ink tracking-tight font-extrabold leading-none">
            {formatMonthYearUpper(viewYear, viewMonth)}
          </h2>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-on-primary font-condensed tracking-wider leading-none border border-ink">
            PEKAN 4
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded bg-surface border border-ink flex items-center justify-center text-ink manga-shadow-sm hover:bg-surface-container cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded bg-surface border border-ink flex items-center justify-center text-ink manga-shadow-sm hover:bg-surface-container cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Main Responsive Split: Calendar Matrix + Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 7-Column Manga Calendar Matrix */}
        <section className="lg:col-span-7 bg-surface rounded-xl p-2.5 md:p-3.5 border-2 border-ink manga-shadow overflow-hidden">
          <div className="grid grid-cols-7 gap-1 pb-2 mb-2 text-center border-b-2 border-ink">
            {['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'].map((d, idx) => (
              <div
                key={d}
                className={`font-condensed text-xs uppercase font-bold tracking-wider ${
                  idx >= 5 ? 'text-primary' : 'text-ink'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell.inMonth) {
                return (
                  <div
                    key={cell.iso}
                    className="min-h-[58px] p-1 bg-paper/60 rounded border border-ink/20 flex flex-col justify-between opacity-45"
                  >
                    <span className="font-condensed text-[10px] text-ink-muted">{cell.day}</span>
                  </div>
                );
              }
              const acts = schedules[cell.iso]?.activities ?? [];
              const isSelected = cell.iso === selectedIso;
              const isWeekend = idx % 7 >= 5;
              const hasTryout = acts.includes('TO');

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setSelectedIso(cell.iso)}
                  onDoubleClick={() => openScheduleEditor(cell.iso)}
                  className={`min-h-[58px] p-1 rounded flex flex-col justify-between text-left relative transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFF9E6] border-[2.5px] border-ink ring-1 ring-primary manga-shadow-sm z-10'
                      : hasTryout
                      ? 'bg-manga-red-soft/40 border border-ink hover:bg-manga-red-soft/70'
                      : 'bg-paper border border-ink hover:bg-surface-container'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary rounded-full border border-ink flex items-center justify-center text-[7px] text-on-primary font-bold">
                      ★
                    </div>
                  )}
                  <span
                    className={`font-condensed text-[11px] font-bold leading-none ${
                      isSelected || isWeekend ? 'text-primary font-black' : 'text-ink'
                    }`}
                  >
                    {cell.day}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-1 w-full">
                    {acts.slice(0, 3).map((code) => {
                      const meta = PLANNER_ACTIVITIES[code];
                      return (
                        <span
                          key={code}
                          className="text-[8px] font-condensed font-bold px-0.5 text-center rounded border border-ink leading-tight truncate"
                          style={{ backgroundColor: meta.bgHex, color: meta.textHex }}
                        >
                          {code}
                        </span>
                      );
                    })}
                    {acts.length > 3 && (
                      <span className="text-[8px] font-bold text-ink-muted text-center">
                        +{acts.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Selected Date Detailed Plan Panel + Footer Stamp */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <section className="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-28 h-28 manga-dots opacity-15 pointer-events-none rounded-full" />

            <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-ink relative z-10">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0" />
                  <h3 className="font-condensed text-2xl uppercase text-ink font-extrabold tracking-tight leading-none">
                    {formatIndonesianSheetDate(selectedIso)}
                  </h3>
                </div>
                <p className="text-[10px] text-ink-muted uppercase font-bold mt-1 leading-none">
                  TARGET HARIAN: {selectedActivities.length} AKTIVITAS TERJADWAL
                </p>
              </div>
              <span className="font-condensed text-xs uppercase font-bold px-2 py-0.5 rounded bg-primary text-on-primary border border-ink shadow-[1.5px_1.5px_0px_#171717] shrink-0">
                AKTIF
              </span>
            </div>

            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="font-condensed text-xs uppercase font-bold text-ink tracking-wide">
                DAFTAR SESI BELAJAR HARI INI
              </span>
              <span className="text-[11px] font-semibold text-ink-muted">
                Estimasi: {estimatedMinutes} Mnt
              </span>
            </div>

            {selectedActivities.length === 0 ? (
              <div className="p-4 bg-paper rounded-lg border border-dashed border-ink/30 text-center text-xs text-ink-muted">
                Belum ada subtes terjadwal pada tanggal ini.
              </div>
            ) : (
              <div className="space-y-2 relative z-10">
                {selectedActivities.map((code) => {
                  const meta = PLANNER_ACTIVITIES[code];
                  return (
                    <div
                      key={code}
                      className="p-2.5 rounded-lg bg-paper border-2 border-ink flex items-center justify-between manga-shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-11 h-10 rounded shrink-0 border border-ink flex flex-col items-center justify-center shadow-[1px_1px_0px_#171717]"
                          style={{ backgroundColor: meta.bgHex, color: meta.textHex }}
                        >
                          <span className="font-condensed text-base leading-none font-extrabold">
                            {meta.code}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-condensed text-sm uppercase font-bold text-ink leading-tight truncate">
                            {meta.name}
                          </h4>
                          <p className="text-[11px] text-ink-muted truncate">{meta.hint}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-dashed border-ink relative z-10">
              <button
                type="button"
                onClick={() => openScheduleEditor(selectedIso)}
                className="w-full h-11 bg-primary text-on-primary rounded-lg border-2 border-ink flex items-center justify-center gap-1.5 font-condensed text-base uppercase font-bold tracking-wide manga-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>+ TAMBAH / ATUR JADWAL SUBTES</span>
              </button>
            </div>
          </section>

          <section className="p-3 bg-surface rounded-lg border-2 border-ink manga-shadow-sm flex items-center gap-2.5">
            <div className="px-2 py-1 bg-ink text-surface font-condensed text-sm uppercase font-black tracking-widest rounded -rotate-2 shrink-0 leading-none">
              GANBATTE!
            </div>
            <p className="font-condensed text-sm uppercase text-ink font-bold leading-tight">
              Try Again, Fail Again, Fail Better.
            </p>
          </section>
        </div>
      </div>

      {/* MANGA MULTI-SELECT SCHEDULE BOTTOM SHEET */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-[2px] flex flex-col justify-end md:items-center md:justify-center md:p-4"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="relative w-full md:max-w-lg bg-paper rounded-t-2xl md:rounded-2xl border-t-2 md:border-2 border-ink shadow-[0_-6px_0px_0px_#171717] pt-3 max-h-[86vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-ink rounded-full mx-auto mb-2 opacity-80 md:hidden" />

            {/* Sheet Header */}
            <div className="px-4 pb-3 border-b-2 border-ink bg-surface flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bebas text-[28px] text-ink tracking-tight uppercase leading-none">
                      ATUR JADWAL
                    </h2>
                    <span className="px-2 py-0.5 bg-manga-red-soft text-primary text-[10px] uppercase tracking-wider rounded font-bold">
                      TARGET 2027
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase tracking-wider text-ink font-bold">
                      {formatIndonesianSheetDate(selectedIso)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Tutup bottom sheet"
                  onClick={() => setSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-paper hover:bg-surface-container border border-ink manga-shadow-sm flex items-center justify-center text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="self-start bg-paper px-3 py-1.5 rounded-lg border border-ink manga-shadow-sm flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-primary" />
                <span className="text-xs text-ink font-bold">
                  Rencanakan aktivitas belajarmu hari ini!
                </span>
              </div>
            </div>

            {/* Scrollable Tiles */}
            <div className="overflow-y-auto px-4 py-3 flex-1 flex flex-col gap-4">
              {/* Subtes UTBK */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-ink font-bold">
                    MATERI SUBTES UTBK
                  </span>
                  <span className="text-[10px] text-ink-muted font-medium">
                    Pilih satu atau lebih
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {SUBTEST_TILES.map((code) => {
                    const meta = PLANNER_ACTIVITIES[code];
                    const selected = draftActivities.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleDraftActivity(code)}
                        style={{ backgroundColor: meta.bgHex, color: meta.textHex }}
                        className={`relative text-left p-3 rounded-lg border-2 transition-all active:scale-95 cursor-pointer ${
                          selected
                            ? 'border-primary manga-shadow ring-1 ring-ink'
                            : 'border-ink opacity-85 hover:opacity-100 manga-shadow-sm'
                        }`}
                      >
                        {selected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-surface flex items-center justify-center border-2 border-surface shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <span className="font-bebas text-[26px] tracking-wider uppercase leading-none block">
                          {code}
                        </span>
                        <span className="text-xs font-semibold mt-0.5 line-clamp-1 block">
                          {meta.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Supporting & Recovery Activities */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wider text-ink font-bold">
                  AKTIVITAS PENDUKUNG &amp; RECOVERY
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {RECOVERY_TILES.map((code) => {
                    const meta = PLANNER_ACTIVITIES[code];
                    const selected = draftActivities.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleDraftActivity(code)}
                        style={{ backgroundColor: meta.bgHex, color: meta.textHex }}
                        className={`relative text-left p-3 rounded-lg border-2 transition-all active:scale-95 cursor-pointer ${
                          selected
                            ? 'border-primary manga-shadow ring-1 ring-ink'
                            : 'border-ink opacity-85 hover:opacity-100 manga-shadow-sm'
                        }`}
                      >
                        {selected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-surface flex items-center justify-center border-2 border-surface shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <span className="font-bebas text-[24px] tracking-wider uppercase leading-none block">
                          {code}
                        </span>
                        <span className="text-xs font-semibold mt-0.5 line-clamp-1 block">
                          {meta.name}
                        </span>
                        <span className="text-[10px] opacity-80 font-bold mt-1 block">
                          {meta.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Badges Summary Bar */}
            <div className="px-4 pt-2.5 pb-2 bg-surface border-t-2 border-ink flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-ink font-bold">
                    DIPILIH ({draftActivities.length})
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-manga-red-soft text-primary font-bold rounded">
                    Est. {((draftActivities.length * 50) / 60).toFixed(1)} Jam
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDraftActivities([])}
                  className="text-[11px] text-ink-muted hover:text-primary underline font-bold cursor-pointer"
                >
                  Reset Pilihan
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {draftActivities.length === 0 ? (
                  <span className="text-xs text-ink-muted italic">Belum ada aktivitas dipilih</span>
                ) : (
                  draftActivities.map((code) => {
                    const meta = PLANNER_ACTIVITIES[code];
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleDraftActivity(code)}
                        style={{ backgroundColor: meta.bgHex, color: meta.textHex }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717] shrink-0 cursor-pointer"
                      >
                        <span className="font-bebas text-base leading-none">{code}</span>
                        <span className="text-[10px] font-semibold">{meta.shortName}</span>
                        <X className="w-3 h-3" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sticky Sheet Buttons */}
            <div className="px-4 pt-2 pb-4 flex items-center gap-2.5 bg-surface border-t border-ink/10">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-24 h-12 rounded-lg bg-paper text-ink font-bebas text-lg tracking-wider uppercase border-2 border-ink manga-shadow-sm cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="flex-1 h-12 rounded-lg bg-primary text-surface font-bebas text-lg tracking-wider uppercase border-2 border-ink manga-shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>SIMPAN JADWAL ({draftActivities.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
