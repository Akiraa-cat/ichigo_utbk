import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  Filter,
  History,
  LineChart as LineChartIcon,
  PlusCircle,
  Quote,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { SUBTEST_ORDER } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import { SubtestCode, TryoutRecord } from '../types';
import { formatIndonesianShortDate, formatIndonesianTitleDate } from '../utils/dateUtils';

export const NilaiScreen: React.FC = () => {
  const {
    tryouts,
    platforms,
    settings,
    openTryoutForm,
    navigateTab,
    isLoadingSkeleton,
  } = useApp();

  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedSubtest, setSelectedSubtest] = useState<'AVG' | SubtestCode>('AVG');
  const [activePointId, setActivePointId] = useState<string | null>(null);

  const getScoreValue = (t: TryoutRecord): number => {
    if (selectedSubtest === 'AVG') return t.averageScore;
    return t.scores[selectedSubtest];
  };

  const filteredTryouts = useMemo(() => {
    return [...tryouts]
      .filter((t) => selectedPlatform === 'ALL' || t.platformId === selectedPlatform)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tryouts, selectedPlatform]);

  if (isLoadingSkeleton) {
    return <SkeletonCard />;
  }

  // Compute KPI stats
  const latest = filteredTryouts[filteredTryouts.length - 1];
  const prev = filteredTryouts[filteredTryouts.length - 2];
  const latestScore = latest ? getScoreValue(latest) : 0;
  const highestScore = filteredTryouts.length
    ? Math.max(...filteredTryouts.map(getScoreValue))
    : 0;
  const delta = latest && prev ? getScoreValue(latest) - getScoreValue(prev) : 0;

  // Build SVG Multi-Series Chart Coordinates
  const uniqueDates = Array.from(new Set(filteredTryouts.map((t) => t.date))).sort();
  const minX = 48;
  const maxX = 318;
  const xStep = uniqueDates.length > 1 ? (maxX - minX) / (uniqueDates.length - 1) : 0;

  const yFromScore = (score: number) => {
    // Map score 300..900 -> y 180..30 (clamped 150..950)
    const clamped = Math.max(250, Math.min(950, score));
    return 190 - ((clamped - 250) / 700) * 160;
  };

  const visiblePlatforms = platforms.filter(
    (p) => selectedPlatform === 'ALL' || p.id === selectedPlatform
  );

  const activeRecord =
    (activePointId && filteredTryouts.find((t) => t.id === activePointId)) || latest;
  const activePlatform = activeRecord
    ? platforms.find((p) => p.id === activeRecord.platformId)
    : undefined;

  const recentDescending = [...filteredTryouts].reverse().slice(0, 5);

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header Banner & Action CTA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-[10px] w-fit uppercase font-bold tracking-wider mb-1 border border-primary/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>UTBK 2027 TARGET</span>
          </div>
          <h1 className="font-bebas text-[38px] uppercase text-ink tracking-tight leading-none">
            ANALISIS SKOR
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Evaluasi Capaian 7 Subtes UTBK &amp; Trajektori Multi-Platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-surface px-3 py-2 rounded-lg border-2 border-ink manga-shadow-sm text-ink text-xs font-bold uppercase tracking-wider">
            TARGET: {settings.targetScore}+
          </div>
          <button
            type="button"
            onClick={() => openTryoutForm()}
            className="w-full md:w-auto px-5 h-11 bg-primary hover:bg-manga-red-dark active:translate-x-0.5 active:translate-y-0.5 transition-all text-on-primary rounded-lg border-2 border-ink manga-shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-bebas text-[20px] leading-none tracking-wide uppercase">
              + TAMBAH NILAI
            </span>
          </button>
        </div>
      </div>

      {/* Metric Highlights Summary */}
      <div className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 manga-dots opacity-15 pointer-events-none rounded-full" />
        <div className="flex items-center justify-between pb-2.5 mb-3 bg-surface-container-low px-2.5 py-1.5 rounded-lg border border-ink/10">
          <div className="flex items-center gap-1.5">
            <Award className="w-[18px] h-[18px] text-primary" />
            <span className="text-xs uppercase tracking-wider text-ink font-bold">
              Ringkasan Tren {selectedSubtest === 'AVG' ? 'Keseluruhan' : `Subtes ${selectedSubtest}`}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase">
            {latestScore >= settings.targetScore ? 'Siap SNBT' : 'Terus Dorong!'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 relative z-10 text-center">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-surface-container-lowest border border-ink/15 shadow-[1.5px_1.5px_0px_#171717]">
            <span className="text-[10px] text-ink-muted uppercase font-bold">Skor Terakhir</span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="font-bebas text-[34px] leading-none text-ink tabular-nums">
                {latestScore || '—'}
              </span>
              <span className="text-[10px] text-ink-muted font-bold">pts</span>
            </div>
            <span className="text-[10px] text-blue-deep font-bold mt-1">Terverifikasi</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-primary-fixed border border-primary/30 shadow-[1.5px_1.5px_0px_#171717]">
            <span className="text-[10px] text-on-primary-fixed-variant uppercase font-bold">
              Tertinggi
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="font-bebas text-[34px] leading-none text-primary tabular-nums">
                {highestScore || '—'}
              </span>
              <span className="text-[10px] text-on-primary-fixed-variant font-bold">pts</span>
            </div>
            <span className="text-[10px] text-primary font-bold mt-1">Rekor Pribadi</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-tertiary-fixed border border-tertiary/30 shadow-[1.5px_1.5px_0px_#171717]">
            <span className="text-[10px] text-on-tertiary-fixed font-bold uppercase">
              Kenaikan
            </span>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className="font-bebas text-[34px] leading-none text-tertiary tabular-nums">
                {delta >= 0 ? `+${delta}` : delta}
              </span>
              <span className="text-[10px] text-tertiary font-bold">pts</span>
            </div>
            <span className="text-[10px] text-tertiary font-bold mt-1">vs Sesi Lalu</span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Platform Penyedia</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedPlatform('ALL')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold border border-ink cursor-pointer transition-colors ${
                selectedPlatform === 'ALL'
                  ? 'bg-ink text-surface manga-shadow-sm'
                  : 'bg-surface text-ink hover:bg-surface-container'
              }`}
            >
              SEMUA
            </button>
            {platforms.map((pf) => {
              const active = selectedPlatform === pf.id;
              return (
                <button
                  key={pf.id}
                  type="button"
                  onClick={() => setSelectedPlatform(pf.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold border border-ink flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-ink text-surface manga-shadow-sm'
                      : 'bg-surface text-ink hover:bg-surface-container'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-ink/30"
                    style={{ backgroundColor: pf.colorHex }}
                  />
                  <span>{pf.shortCode}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Fokus Subtes</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSubtest('AVG')}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] uppercase font-bold border border-ink cursor-pointer ${
                selectedSubtest === 'AVG'
                  ? 'bg-primary text-on-primary manga-shadow-sm'
                  : 'bg-surface text-ink hover:bg-surface-container'
              }`}
            >
              KESELURUHAN
            </button>
            {SUBTEST_ORDER.map((code) => {
              const active = selectedSubtest === code;
              const isFocus = settings.focusSubtests.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedSubtest(code)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] uppercase font-bold border flex items-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-primary text-on-primary border-ink manga-shadow-sm'
                      : isFocus
                      ? 'bg-manga-red-soft text-manga-red-dark border-primary/40'
                      : 'bg-surface text-ink border-ink/30 hover:bg-surface-container'
                  }`}
                >
                  <span>{code}</span>
                  {isFocus && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredTryouts.length === 0 ? (
        <EmptyStateCard
          title="Belum Ada Skor Tryout"
          description="Belum ada data skor untuk filter ini. Catat hasil tryout pertamamu untuk mulai memantau grafik progres."
          ctaLabel="+ Tambah Nilai Tryout"
          onCta={() => openTryoutForm()}
          bubbleText="MULAI!"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Multi-Series LINE CHART */}
          <div className="lg:col-span-7 bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <LineChartIcon className="w-5 h-5 text-ink" />
                  <span className="font-bebas text-[22px] tracking-wide uppercase text-ink leading-none">
                    TRAJEKTORI SKOR
                  </span>
                </div>
                <span className="text-[10px] text-primary bg-primary-fixed px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-primary/20">
                  {filteredTryouts.length} SESI
                </span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {visiblePlatforms.map((pf) => (
                  <div key={pf.id} className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-1.5 rounded-full"
                      style={{ backgroundColor: pf.colorHex }}
                    />
                    <span className="text-[11px] font-bold text-ink">{pf.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Point Tooltip Callout */}
            {activeRecord && (
              <div className="bg-surface-container-low text-ink px-3 py-1.5 rounded-lg border border-ink/20 flex items-center justify-between gap-2 max-w-[280px] ml-auto">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: activePlatform?.colorHex || '#ad2933' }}
                  />
                  <span className="text-xs font-bold text-ink truncate">
                    {activePlatform?.shortCode} • {formatIndonesianShortDate(activeRecord.date)}
                  </span>
                </div>
                <div className="text-right shrink-0 flex items-baseline gap-1">
                  <span className="font-bebas text-xl text-primary leading-none tabular-nums">
                    {getScoreValue(activeRecord)}
                  </span>
                  <span className="text-[10px] text-ink-muted font-semibold">pts</span>
                </div>
              </div>
            )}

            {/* Interactive SVG Chart */}
            <div className="w-full relative select-none">
              <svg className="w-full h-auto overflow-visible" viewBox="0 0 350 220">
                <defs>
                  <pattern
                    id="grid-dots-nilai"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r="0.8" fill="#171717" opacity="0.1" />
                  </pattern>
                </defs>
                <rect x="34" y="20" width="298" height="175" rx="2" fill="url(#grid-dots-nilai)" />

                {/* Y Axis Reference Lines */}
                {[900, 700, 500, 300].map((val) => {
                  const y = yFromScore(val);
                  const isTarget = val === 700;
                  return (
                    <g key={val}>
                      <line
                        x1="34"
                        x2="332"
                        y1={y}
                        y2={y}
                        stroke={isTarget ? '#ad2933' : '#171717'}
                        strokeWidth={isTarget ? 1.8 : 1}
                        strokeDasharray={isTarget ? '4,3' : '2,3'}
                        opacity={isTarget ? 1 : 0.2}
                      />
                      <text
                        x="28"
                        y={y + 3}
                        fontSize="9"
                        fontWeight={isTarget ? '800' : '700'}
                        fill={isTarget ? '#ad2933' : '#6F6A66'}
                        textAnchor="end"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Target Label Badge */}
                <rect
                  x="258"
                  y={yFromScore(settings.targetScore) - 12}
                  width="74"
                  height="14"
                  rx="2"
                  fill="#ffdad8"
                />
                <text
                  x="295"
                  y={yFromScore(settings.targetScore) - 2}
                  fontSize="8.5"
                  fontWeight="800"
                  fill="#ad2933"
                  textAnchor="middle"
                >
                  TARGET {settings.targetScore}
                </text>

                {/* X Axis baseline */}
                <line x1="34" x2="332" y1="195" y2="195" stroke="#171717" strokeWidth="1.5" />

                {/* Vertical date guidelines + X labels */}
                {uniqueDates.map((d, idx) => {
                  const x = uniqueDates.length === 1 ? 180 : minX + idx * xStep;
                  const isLast = idx === uniqueDates.length - 1;
                  return (
                    <g key={d}>
                      <line
                        x1={x}
                        x2={x}
                        y1="20"
                        y2="195"
                        stroke="#171717"
                        strokeDasharray="1,4"
                        strokeWidth="0.8"
                        opacity="0.18"
                      />
                      <text
                        x={x}
                        y="211"
                        fontSize="8.5"
                        fontWeight={isLast ? '800' : '700'}
                        fill={isLast ? '#ad2933' : '#171717'}
                        textAnchor="middle"
                      >
                        {formatIndonesianShortDate(d)}
                      </text>
                    </g>
                  );
                })}

                {/* Platform Polylines & Interactive Dots */}
                {visiblePlatforms.map((pf) => {
                  const pfRecords = filteredTryouts.filter((t) => t.platformId === pf.id);
                  if (pfRecords.length === 0) return null;

                  const points = pfRecords
                    .map((r) => {
                      const idx = uniqueDates.indexOf(r.date);
                      const x = uniqueDates.length === 1 ? 180 : minX + idx * xStep;
                      const y = yFromScore(getScoreValue(r));
                      return `${x},${y}`;
                    })
                    .join(' ');

                  return (
                    <g key={pf.id}>
                      {pfRecords.length > 1 && (
                        <polyline
                          fill="none"
                          points={points}
                          stroke={pf.colorHex}
                          strokeWidth={pf.id === 'nf' ? 3 : 2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {pfRecords.map((r) => {
                        const idx = uniqueDates.indexOf(r.date);
                        const x = uniqueDates.length === 1 ? 180 : minX + idx * xStep;
                        const y = yFromScore(getScoreValue(r));
                        const isSelected = activeRecord?.id === r.id;
                        return (
                          <g
                            key={r.id}
                            className="cursor-pointer"
                            onClick={() => setActivePointId(r.id)}
                          >
                            {isSelected && (
                              <circle
                                cx={x}
                                cy={y}
                                r="7.5"
                                fill="none"
                                stroke={pf.colorHex}
                                strokeWidth="1.5"
                                strokeDasharray="2,2"
                                opacity="0.8"
                              />
                            )}
                            <circle
                              cx={x}
                              cy={y}
                              r={isSelected ? 5 : 4}
                              fill={isSelected ? pf.colorHex : '#FFFEFC'}
                              stroke={isSelected ? '#FFFEFC' : pf.colorHex}
                              strokeWidth="2.2"
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center gap-2 border border-ink/10">
              <Quote className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-ink leading-tight">
                <strong className="text-primary font-bold">一歩ずつ、前へ。</strong> Konsistensi
                melampaui target {settings.targetScore}.
              </p>
            </div>
          </div>

          {/* RIGHT: Recent Tryout List + Motivation */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-ink" />
                <h2 className="font-bebas text-[20px] uppercase text-ink leading-none tracking-wide">
                  RIWAYAT TRYOUT TERAKHIR
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateTab('data')}
                className="text-[11px] text-primary uppercase font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Semua ({tryouts.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {recentDescending.map((item, idx) => {
                const pf = platforms.find((p) => p.id === item.platformId);
                const val = getScoreValue(item);
                const prevItem = recentDescending[idx + 1];
                const diff = prevItem ? val - getScoreValue(prevItem) : 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openTryoutForm(item.id)}
                    className="w-full text-left bg-surface rounded-xl p-3 border-2 border-ink manga-shadow-sm flex items-center justify-between gap-2 hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg border border-ink flex items-center justify-center shrink-0 text-white font-bebas text-lg"
                        style={{ backgroundColor: pf?.colorHex || '#ad2933' }}
                      >
                        {pf?.shortCode || 'TO'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sm font-bold text-ink truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-ink-muted mt-0.5">
                          {pf?.name} · {formatIndonesianTitleDate(item.date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1.5">
                        {item.tag && (
                          <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-[9px] font-bold uppercase">
                            {item.tag}
                          </span>
                        )}
                        <div
                          className={`px-2 py-0.5 rounded font-bebas text-[22px] leading-none font-bold tabular-nums ${
                            idx === 0
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-ink'
                          }`}
                        >
                          {val}
                        </div>
                      </div>
                      {prevItem && (
                        <span
                          className={`text-[10px] font-bold mt-1 tabular-nums ${
                            diff >= 0 ? 'text-tertiary' : 'text-error'
                          }`}
                        >
                          {diff >= 0 ? `+${diff}` : diff} pts
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Insight Card */}
            <div className="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-manga-red-soft border border-primary/30 flex items-center justify-center shrink-0 text-manga-red-dark">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bebas text-[18px] uppercase text-ink leading-none">
                    PESAN HARI INI
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-manga-red-soft text-manga-red-dark text-[9px] font-bold uppercase tracking-wider">
                    MOTIVASI
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  <strong className="text-primary font-bold">一歩ずつ、前へ。</strong> Konsistensi
                  kecil hari ini adalah lompatan besar menuju kampus impian.{' '}
                  <strong className="text-ink">Keep moving forward!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
