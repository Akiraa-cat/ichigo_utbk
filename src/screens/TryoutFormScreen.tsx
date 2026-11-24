import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Info,
  Megaphone,
  PlusCircle,
  Save,
  Star,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { SUBTEST_ORDER, SUBTESTS } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import { SubtestCode } from '../types';
import { TODAY_ISO } from '../utils/dateUtils';

interface TryoutFormScreenProps {
  tryoutId?: string;
}

export const TryoutFormScreen: React.FC<TryoutFormScreenProps> = ({ tryoutId }) => {
  const {
    tryouts,
    platforms,
    settings,
    saveTryout,
    deleteTryout,
    goBackToTab,
    setAddPlatformOpen,
    askConfirm,
  } = useApp();

  const existing = useMemo(
    () => (tryoutId ? tryouts.find((t) => t.id === tryoutId) : undefined),
    [tryoutId, tryouts]
  );

  const [platformId, setPlatformId] = useState<string>(
    existing?.platformId ?? platforms[0]?.id ?? 'nf'
  );
  const [title, setTitle] = useState(
    existing?.title ?? `Simulasi Akbar SNBT #0${tryouts.length + 1}`
  );
  const [date, setDate] = useState(existing?.date ?? TODAY_ISO);
  const [scores, setScores] = useState<Record<SubtestCode, number>>(
    existing?.scores ?? {
      PU: 680,
      PPU: 650,
      PBM: 670,
      PK: 730,
      LBI: 710,
      LBE: 690,
      PM: 725,
    }
  );
  const [averageScore, setAverageScore] = useState<number>(existing?.averageScore ?? 723);

  const handleScoreChange = (code: SubtestCode, val: string) => {
    const num = Math.max(0, Math.min(1000, Number(val) || 0));
    setScores((prev) => ({ ...prev, [code]: num }));
  };

  const computedMean = Math.round(
    SUBTEST_ORDER.reduce((acc, c) => acc + (scores[c] || 0), 0) / SUBTEST_ORDER.length
  );

  const deltaTarget = averageScore - settings.targetScore;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pf = platforms.find((p) => p.id === platformId);
    const codePrefix = pf?.shortCode || 'TO';
    const nextNum = String(tryouts.filter((t) => t.platformId === platformId).length + 1).padStart(
      2,
      '0'
    );
    saveTryout({
      id: existing?.id,
      platformId,
      title: title.trim() || `Tryout ${pf?.name || 'UTBK'} #${nextNum}`,
      code: existing?.code ?? `${codePrefix} TO-${nextNum}`,
      date,
      averageScore,
      scores,
      tag: existing?.tag ?? (averageScore >= settings.targetScore ? 'TARGET TERCAPAI' : undefined),
    });
    goBackToTab();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-2xl mx-auto pb-12 gap-5">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goBackToTab}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface text-ink text-xs font-bold rounded-lg border border-ink manga-shadow-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="uppercase tracking-wider">KEMBALI</span>
        </button>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg text-[10px] font-bold text-ink-muted uppercase">
          <span>{existing ? 'EDIT DATA TRYOUT' : 'ENTRY NILAI BARU'}</span>
        </div>
      </div>

      {/* Page Header Banner */}
      <div className="relative bg-surface rounded-xl p-4 border-2 border-ink manga-shadow overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 manga-dots opacity-15 pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] uppercase tracking-widest rounded-sm font-bold">
              SNBT 2027
            </span>
            <span className="text-ink-muted text-xs font-medium">Fase 2: Pemantapan</span>
          </div>
          <h1 className="font-condensed text-[28px] font-bold text-ink uppercase tracking-tight italic leading-tight">
            {existing ? 'DETAIL & EDIT NILAI TRYOUT' : 'TAMBAH NILAI TRYOUT'}
          </h1>
          <p className="text-xs text-ink-muted">
            Catat skor 7 subtes &amp; evaluasi kesiapan menuju {settings.targetUniversityShort}.
          </p>
        </div>
      </div>

      {/* Speech Bubble Hint */}
      <div className="bg-manga-red-soft rounded-xl p-3 border-2 border-ink manga-shadow-sm flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 text-on-primary">
          <Megaphone className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-condensed text-sm font-bold leading-tight uppercase tracking-wider text-manga-red-dark">
            TARGET SCORE: {settings.targetMajor.toUpperCase()} ({settings.targetUniversityShort})
          </div>
          <p className="text-xs text-ink leading-snug mt-0.5">
            Pastikan subtes fokusmu ({settings.focusSubtests.join(' & ')}) menembus ambang{' '}
            <span className="font-bold underline">{settings.targetScore}+</span> poin!
          </p>
        </div>
      </div>

      {/* SECTION 1: Platform Selector */}
      <div className="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-4 bg-primary inline-block rounded-xs" />
            <h2 className="font-condensed text-[20px] font-bold uppercase text-ink">
              1. PILIH APLIKASI TRYOUT
            </h2>
          </div>
          <span className="text-[10px] text-ink-muted uppercase font-bold">Wajib</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {platforms.map((pf) => {
            const selected = platformId === pf.id;
            return (
              <label
                key={pf.id}
                onClick={() => setPlatformId(pf.id)}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selected
                    ? 'bg-manga-red-soft border-ink manga-shadow-sm'
                    : 'bg-surface-container-low border-ink/20 hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-2 ring-offset-surface"
                    style={{ backgroundColor: pf.colorHex }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink uppercase leading-none">
                      {pf.name}
                    </span>
                    <span className="text-[11px] text-ink-muted mt-1">{pf.ratingType}</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="platform"
                  checked={selected}
                  onChange={() => setPlatformId(pf.id)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAddPlatformOpen(true)}
          className="w-full py-2.5 px-3 bg-surface text-ink text-xs font-bold rounded-lg border-2 border-ink flex items-center justify-center gap-1.5 manga-shadow-sm active:translate-y-0.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="uppercase tracking-wider">+ Tambah Aplikasi Baru</span>
        </button>
      </div>

      {/* SECTION 2: Tryout Info */}
      <div className="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-4 bg-primary inline-block rounded-xs" />
            <h2 className="font-condensed text-[20px] font-bold uppercase text-ink">
              2. INFORMASI TRYOUT
            </h2>
          </div>
          <span className="text-[10px] text-ink-muted uppercase font-bold">Meta Data</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nama_seri" className="text-xs font-bold uppercase text-ink">
            Nama / Seri Tryout
          </label>
          <div className="relative">
            <input
              id="nama_seri"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Contoh: TO Akbar Semester Genap"
              className="w-full h-11 px-3 pr-10 bg-surface-container-low text-ink text-sm rounded-lg border-2 border-ink focus:bg-surface outline-none"
            />
            <CheckCircle2 className="w-4 h-4 text-green-muted absolute right-3 top-3.5" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tanggal_to" className="text-xs font-bold uppercase text-ink">
            Tanggal Pelaksanaan
          </label>
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
            <input
              id="tanggal_to"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-11 pl-10 pr-3 bg-surface-container-low text-ink text-sm rounded-lg border-2 border-ink focus:bg-surface outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: 7 Subtest Scores */}
      <div className="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-4 bg-primary inline-block rounded-xs" />
            <h2 className="font-condensed text-[20px] font-bold uppercase text-ink">
              3. NILAI PER SUBTES (7 UTBK)
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded uppercase text-ink-muted font-bold">
            SKALA 100-1000
          </span>
        </div>

        <div className="p-2.5 bg-surface-container-low rounded-lg flex items-center gap-2">
          <Info className="w-4 h-4 text-ink-muted shrink-0" />
          <p className="text-xs text-ink-muted">
            Rentang skor standar nasional: <span className="font-bold text-ink">100 — 1000</span>{' '}
            poin per subtes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {SUBTEST_ORDER.map((code) => {
            const meta = SUBTESTS[code];
            const isFocus = settings.focusSubtests.includes(code);
            return (
              <div
                key={code}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  isFocus
                    ? 'bg-manga-red-soft border-primary/50 manga-shadow-sm'
                    : 'bg-surface-container-lowest border-ink/25 shadow-[1px_1px_0px_#171717]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className={`w-9 h-9 rounded font-condensed text-sm font-bold flex items-center justify-center shrink-0 ${
                      isFocus ? 'bg-primary text-on-primary' : 'bg-ink text-surface'
                    }`}
                  >
                    {code}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-ink truncate leading-tight">
                        {meta.name}
                      </span>
                      {isFocus && (
                        <span className="px-1.5 py-0.2 bg-primary text-on-primary text-[9px] uppercase font-bold rounded-sm">
                          FOKUS
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-ink-muted">{meta.description}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={100}
                    max={1000}
                    value={scores[code]}
                    onChange={(e) => handleScoreChange(code, e.target.value)}
                    className={`w-20 h-10 px-2 text-center bg-surface font-condensed text-xl font-bold rounded border-2 border-ink focus:bg-primary-fixed outline-none tabular-nums ${
                      isFocus ? 'text-manga-red-dark' : 'text-ink'
                    }`}
                  />
                  {isFocus ? (
                    <Star className="w-4 h-4 text-primary fill-primary" />
                  ) : (
                    <Check className="w-4 h-4 text-green-muted" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Overall Average Score (Manual Entry) */}
      <div className="relative bg-surface rounded-xl p-4 border-2 border-ink manga-shadow overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-2 bg-primary" />
        <div className="absolute -right-4 -bottom-4 w-28 h-28 manga-dots opacity-15 pointer-events-none rounded-full" />

        <div className="flex flex-col gap-2.5 relative z-10 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary shrink-0" />
              <h2 className="font-condensed text-[20px] font-bold uppercase text-ink leading-tight">
                SKOR KESELURUHAN / RATA-RATA TRYOUT
              </h2>
            </div>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Diinput manual sesuai sertifikat/hasil resmi penyedia. (Rata-rata hitung subtes:{' '}
            <button
              type="button"
              onClick={() => setAverageScore(computedMean)}
              className="underline font-bold text-primary cursor-pointer"
            >
              pakai {computedMean} pts
            </button>
            )
          </p>

          <div className="flex items-center justify-between p-3.5 bg-paper rounded-lg border-2 border-ink manga-shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-ink-muted uppercase font-bold">
                TOTAL NILAI AKHIR
              </span>
              <span className="text-sm font-bold text-ink">Skala Standar IRT</span>
            </div>
            <div className="flex items-baseline gap-2">
              <input
                id="skor_total"
                type="number"
                min={100}
                max={1000}
                value={averageScore}
                onChange={(e) => setAverageScore(Math.max(0, Math.min(1000, Number(e.target.value) || 0)))}
                required
                className="w-28 h-12 text-center font-bebas text-[36px] text-primary bg-surface rounded-lg border-2 border-ink manga-shadow-sm outline-none tabular-nums"
              />
              <span className="font-condensed text-lg font-bold text-ink uppercase">PTS</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-surface-container rounded-lg text-xs font-bold text-ink">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Target Minimum: {settings.targetScore}</span>
            </span>
            <span
              className={`tabular-nums ${
                deltaTarget >= 0 ? 'text-tertiary' : 'text-error'
              }`}
            >
              {deltaTarget >= 0 ? `+${deltaTarget} SURPLUS` : `${deltaTarget} DEFISIT`}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 5: Actions */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="submit"
          className="w-full h-12 bg-primary text-on-primary font-condensed text-lg font-bold uppercase rounded-xl border-2 border-ink manga-shadow flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>{existing ? 'PERBARUI NILAI TRYOUT' : 'SIMPAN NILAI TRYOUT'}</span>
        </button>

        {existing && (
          <button
            type="button"
            onClick={() =>
              askConfirm({
                title: 'Hapus Catatan Tryout?',
                description: `Nilai ${existing.title} (${existing.averageScore} pts) akan dihapus permanen.`,
                confirmLabel: 'Ya, Hapus Saja',
                onConfirm: () => {
                  deleteTryout(existing.id);
                  goBackToTab();
                },
              })
            }
            className="w-full h-11 bg-manga-red-soft text-manga-red-dark font-condensed text-base font-bold uppercase rounded-xl border-2 border-ink manga-shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>HAPUS CATATAN INI</span>
          </button>
        )}

        <button
          type="button"
          onClick={goBackToTab}
          className="w-full h-11 bg-surface text-ink font-condensed text-base font-bold uppercase rounded-xl border-2 border-ink manga-shadow-sm flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>BATAL / KEMBALI</span>
        </button>
      </div>
    </form>
  );
};
