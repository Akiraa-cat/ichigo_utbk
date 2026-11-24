import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Bolt,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  Hourglass,
  PlusSquare,
  Timer,
} from 'lucide-react';
import { PLANNER_ACTIVITIES, SUBTESTS } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import { SkeletonCard } from '../components/SkeletonCard';
import {
  formatDurationReadable,
  formatIndonesianFull,
  formatIndonesianShortDate,
  formatIndonesianTitleDate,
  getDaysRemaining,
  TODAY_ISO,
} from '../utils/dateUtils';

export const BerandaScreen: React.FC = () => {
  const {
    settings,
    sessions,
    tryouts,
    platforms,
    schedules,
    navigateTab,
    openStudyForm,
    openTryoutForm,
    isLoadingSkeleton,
  } = useApp();

  if (isLoadingSkeleton) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <SkeletonCard />
        </div>
        <div className="lg:col-span-5">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const daysLeft = getDaysRemaining(TODAY_ISO, settings.targetDate);
  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Latest & previous tryout sorted by date descending
  const sortedTryouts = [...tryouts].sort((a, b) => b.date.localeCompare(a.date));
  const latestTryout = sortedTryouts[0];
  const prevTryout = sortedTryouts[1];
  const latestPlatform = latestTryout
    ? platforms.find((p) => p.id === latestTryout.platformId)
    : undefined;
  const avgDelta =
    latestTryout && prevTryout ? latestTryout.averageScore - prevTryout.averageScore : 0;

  const highlightSubtests = (['PU', 'PK', 'PM'] as const).map((code) => {
    const currentVal = latestTryout ? latestTryout.scores[code] : 0;
    const prevVal = prevTryout ? prevTryout.scores[code] : currentVal;
    return {
      code,
      label: SUBTESTS[code].name,
      score: currentVal,
      delta: currentVal - prevVal,
      isTarget: settings.focusSubtests.includes(code),
    };
  });

  const todaySchedule = schedules[TODAY_ISO]?.activities ?? ['PK', 'LBI', 'PM'];

  return (
    <div className="flex flex-col gap-5 select-none">
      {/* Greeting Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] text-ink-muted uppercase tracking-wider font-semibold">
              {formatIndonesianFull(TODAY_ISO)}
            </span>
          </div>
          <h1 className="font-bebas text-[30px] md:text-[36px] uppercase tracking-normal text-ink mt-0.5 leading-none">
            MOSHI MOSHI, {settings.userName.toUpperCase()}!
          </h1>
        </div>
        <div className="px-3 py-1.5 bg-surface rounded-lg border-2 border-ink manga-shadow-sm flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] uppercase font-bold text-primary tracking-wide">
            {settings.track}
          </span>
        </div>
      </div>

      {/* Main 2-column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Countdown Hero Panel with Manga Speedlines */}
          <div className="relative overflow-hidden bg-surface rounded-xl border-2 border-ink manga-shadow p-4 md:p-5">
            <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center">
              <svg
                className="w-full h-full"
                fill="none"
                stroke="#171717"
                strokeWidth="2"
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
              >
                <line x1="200" x2="0" y1="200" y2="0" />
                <line x1="200" x2="100" y1="200" y2="0" />
                <line x1="200" x2="200" y1="200" y2="0" />
                <line x1="200" x2="300" y1="200" y2="0" />
                <line x1="200" x2="400" y1="200" y2="0" />
                <line x1="200" x2="400" y1="200" y2="100" />
                <line x1="200" x2="400" y1="200" y2="200" />
                <line x1="200" x2="400" y1="200" y2="300" />
                <line x1="200" x2="400" y1="200" y2="400" />
                <line x1="200" x2="300" y1="200" y2="400" />
                <line x1="200" x2="200" y1="200" y2="400" />
                <line x1="200" x2="100" y1="200" y2="400" />
                <line x1="200" x2="0" y1="200" y2="400" />
                <line x1="200" x2="0" y1="200" y2="300" />
                <line x1="200" x2="0" y1="200" y2="200" />
                <line x1="200" x2="0" y1="200" y2="100" />
              </svg>
            </div>

            <div className="relative z-10 flex justify-between items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper rounded border border-ink/20">
                <Timer className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] uppercase font-bold text-ink tracking-wider">
                  MENUJU UTBK 2027
                </span>
              </div>
              <div className="bg-surface px-2.5 py-1 rounded-lg border border-ink/30 shadow-[1.5px_1.5px_0px_#171717] flex items-center gap-1.5 -rotate-1">
                <span className="text-[10px] font-bold text-ink">一歩ずつ、前へ。</span>
                <span className="text-[10px] text-primary font-bold italic">ichigo ichie</span>
              </div>
            </div>

            <div className="relative z-10 mt-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2.5">
                <span className="font-bebas text-[52px] md:text-[60px] leading-none tracking-tight text-ink drop-shadow-[2px_2px_0px_rgba(173,41,51,0.3)] tabular-nums">
                  H-{daysLeft}
                </span>
                <span className="px-2 py-0.5 bg-manga-red-soft text-manga-red-dark text-[10px] rounded uppercase font-bold self-center border border-primary/20">
                  KRUSIAL
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] uppercase text-ink-muted block leading-none font-semibold">
                  PELAKSANAAN GEL. 1
                </span>
                <span className="font-bebas text-[22px] leading-tight text-ink mt-1 uppercase">
                  {formatIndonesianTitleDate(settings.targetDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Target & Focus Comic Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">
                    PILIHAN 1
                  </span>
                  <GraduationCap className="w-4 h-4 text-secondary" />
                </div>
                <div className="mt-1 font-bebas text-[22px] text-ink leading-tight tracking-wide">
                  {settings.targetUniversityShort}
                </div>
                <div className="text-xs text-ink-muted truncate">{settings.targetMajor}</div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-ink/10 flex items-center justify-between">
                <span className="text-[10px] text-ink-muted font-bold">TARGET SKOR</span>
                <span className="font-bebas text-[20px] text-primary leading-none tabular-nums">
                  &gt;{settings.targetScore}
                </span>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">
                    FOKUS UTAMA
                  </span>
                  <Bolt className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                  {settings.focusSubtests.map((code) => (
                    <span
                      key={code}
                      className="px-2 py-0.5 bg-manga-red-soft text-manga-red-dark font-bebas text-[15px] rounded leading-none border border-primary/20"
                    >
                      {code}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-ink-muted mt-1.5 leading-snug line-clamp-1">
                  {settings.focusSubtests.map((c) => SUBTESTS[c].shortName).join(' & ')}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-ink/10 flex items-center justify-between">
                <span className="text-[10px] text-ink-muted font-bold">STATUS DRILL</span>
                <span className="text-[11px] text-tertiary font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  AKTIF
                </span>
              </div>
            </div>
          </div>

          {/* Study Duration Strip Panel */}
          <div className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container border border-ink/20 flex items-center justify-center text-ink shrink-0">
                <Hourglass className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">
                  TOTAL WAKTU BELAJAR
                </span>
                <span className="font-bebas text-[28px] text-ink leading-none mt-0.5 tabular-nums">
                  {formatDurationReadable(totalMinutes)}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 bg-surface-container-high rounded text-ink text-[11px] font-bold tracking-wide border border-ink/15">
                {sessions.length} Sesi
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => openTryoutForm()}
              className="h-12 bg-primary text-on-primary rounded-xl text-[13px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 border-2 border-ink manga-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              <BarChart3 className="w-[18px] h-[18px]" />
              <span>CATAT NILAI</span>
            </button>
            <button
              type="button"
              onClick={() => openStudyForm({ date: TODAY_ISO })}
              className="h-12 bg-surface text-ink rounded-xl text-[13px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 border-2 border-ink manga-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer hover:bg-surface-container-low"
            >
              <Clock className="w-[18px] h-[18px] text-primary" />
              <span>CATAT BELAJAR</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Tryout Score Overview Panel */}
          <div className="bg-surface rounded-xl border-2 border-ink manga-shadow overflow-hidden">
            <div className="p-3 bg-surface flex items-center justify-between border-b border-ink/10">
              <div className="flex items-center gap-1.5">
                <PlusSquare className="w-[18px] h-[18px] text-primary" />
                <span className="text-[13px] text-ink uppercase font-bold tracking-wide">
                  RINGKASAN SKOR
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigateTab('nilai')}
                className="text-[11px] text-secondary font-bold uppercase tracking-wider flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span>LIHAT NILAI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestTryout ? (
              <>
                <div className="p-3.5 bg-paper flex items-center justify-between border-b border-ink/10">
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="px-1.5 py-0.5 text-white rounded font-bebas text-[12px] leading-none tracking-wider shrink-0"
                        style={{ backgroundColor: latestPlatform?.colorHex || '#32618f' }}
                      >
                        {latestTryout.code}
                      </span>
                      <span className="text-[11px] text-ink-muted font-medium truncate">
                        {latestPlatform?.name}
                      </span>
                    </div>
                    <span className="text-xs text-ink-muted mt-1">Rata-rata Terkini</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="font-bebas text-[38px] text-primary font-bold leading-none tabular-nums">
                      {latestTryout.averageScore}
                    </span>
                    <span
                      className={`text-[11px] font-bold bg-surface px-1.5 py-0.5 rounded border border-ink/20 shadow-[1px_1px_0px_#171717] tabular-nums ${
                        avgDelta >= 0 ? 'text-tertiary' : 'text-error'
                      }`}
                    >
                      {avgDelta >= 0 ? `+${avgDelta}` : avgDelta}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 p-3 gap-2">
                  {highlightSubtests.map((item) => {
                    const isPositive = item.delta >= 0;
                    return (
                      <div
                        key={item.code}
                        className={`rounded-lg p-2.5 flex flex-col items-center justify-between text-center border shadow-[1px_1px_0px_#171717] ${
                          item.isTarget
                            ? 'bg-manga-red-soft/45 border-primary/40'
                            : 'bg-surface-container-low border-ink/15'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-tight ${
                              item.isTarget
                                ? 'text-primary px-1 bg-surface rounded border border-primary/20'
                                : 'text-ink-muted'
                            }`}
                          >
                            {item.isTarget ? 'TARGET' : item.code}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isTarget
                                ? isPositive
                                  ? 'bg-primary'
                                  : 'bg-error'
                                : 'bg-tertiary'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold mt-1 line-clamp-1 ${
                            item.isTarget ? 'text-manga-red-dark' : 'text-ink-muted'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`font-bebas text-[28px] leading-none mt-1.5 tabular-nums ${
                            item.code === 'PK' ? 'text-primary' : 'text-ink'
                          }`}
                        >
                          {item.score}
                        </span>
                        <div
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border mt-2 text-[10px] font-bold leading-none tabular-nums ${
                            isPositive
                              ? 'border-tertiary/30 bg-[#EAF4EC] text-[#56865D]'
                              : 'border-error/30 bg-[#FDF0F0] text-[#C54A4A]'
                          }`}
                        >
                          <span>{isPositive ? '↑' : '↓'}</span>
                          <span>
                            {isPositive ? `+${item.delta}` : item.delta} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-5 text-center text-xs text-ink-muted">
                Belum ada catatan tryout. Klik <strong>CATAT NILAI</strong> untuk memulai.
              </div>
            )}
          </div>

          {/* Today's Agenda Preview */}
          <div className="bg-surface rounded-xl border-2 border-ink manga-shadow p-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-[18px] h-[18px] text-primary" />
                <div className="flex items-center gap-2">
                  <span className="font-bebas text-[19px] tracking-wide text-ink leading-none">
                    AGENDA HARI INI
                  </span>
                  <span className="text-[10px] uppercase font-bold text-ink-muted bg-surface-container px-1.5 py-0.5 rounded leading-none">
                    {formatIndonesianShortDate(TODAY_ISO)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-manga-red-soft text-manga-red-dark font-bold tracking-wider rounded uppercase">
                {todaySchedule.length} SUBTES
              </span>
            </div>

            <div className="flex flex-col gap-2.5 mt-3">
              {todaySchedule.length === 0 ? (
                <p className="text-xs text-ink-muted py-3 text-center">
                  Belum ada jadwal untuk hari ini.
                </p>
              ) : (
                todaySchedule.map((code) => {
                  const meta = PLANNER_ACTIVITIES[code];
                  return (
                    <div
                      key={code}
                      className="p-2.5 rounded-lg bg-surface-container-low border border-ink/15 flex items-center gap-3 shadow-[1px_1px_0px_#171717]"
                    >
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center font-bebas text-[18px] text-white shrink-0 border border-ink shadow-[1px_1px_0px_#171717]"
                        style={{ backgroundColor: meta.bgHex, color: meta.textHex }}
                      >
                        {meta.code}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-bold text-ink tracking-wide uppercase leading-tight truncate">
                          {meta.name}
                        </span>
                        <span className="text-[11px] text-ink-muted truncate">{meta.hint}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-center">
              <button
                type="button"
                onClick={() => navigateTab('jadwal')}
                className="text-[11px] text-ink font-bold uppercase tracking-wider flex items-center gap-1 hover:text-primary transition-colors py-1.5 px-3 rounded-lg bg-paper hover:bg-surface-container border border-ink/20 shadow-[1px_1px_0px_#171717] cursor-pointer"
              >
                <span>LIHAT SEMUA JADWAL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
