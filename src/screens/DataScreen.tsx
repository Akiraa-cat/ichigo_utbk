import React, { useMemo, useState } from 'react';
import {
  CloudUpload,
  Database,
  Download,
  Edit3,
  PlusSquare,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { EmptyStateCard } from '../components/EmptyStateCard';
import { useApp } from '../context/AppContext';
import { formatIndonesianTitleDate } from '../utils/dateUtils';

export const DataScreen: React.FC = () => {
  const {
    platforms,
    tryouts,
    sessions,
    settings,
    setAddPlatformOpen,
    deletePlatform,
    deleteTryout,
    openTryoutForm,
    askConfirm,
    exportTryoutsCsv,
    pushToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPfId, setFilterPfId] = useState<string>('ALL');

  const totalStudyHours = Math.round(
    sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60
  );

  const filteredTryouts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...tryouts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) => {
        if (filterPfId !== 'ALL' && t.platformId !== filterPfId) return false;
        if (!q) return true;
        const pfName = platforms.find((p) => p.id === t.platformId)?.name.toLowerCase() || '';
        return (
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          pfName.includes(q)
        );
      });
  }, [tryouts, platforms, filterPfId, searchQuery]);

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* CONTEXT & HEADER SUB-BAR */}
      <div className="relative bg-surface p-4 rounded-xl border-2 border-ink manga-shadow overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 manga-dots opacity-15 pointer-events-none rotate-12" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center px-2 py-0.5 bg-manga-red-soft text-manga-red-dark text-[10px] uppercase tracking-wider font-bold rounded">
              MODUL MANAJEMEN DATA
            </span>
            <span className="text-[10px] text-ink-muted font-bold tracking-tight uppercase">
              UTBK 2027 ARCHIVE
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="font-condensed text-[28px] text-ink uppercase tracking-tight font-extrabold leading-none">
                KELOLA DATA &amp; PLATFORM
              </h1>
              <p className="text-xs text-ink-muted mt-1">
                Atur aplikasi tryout terdaftar dan arsip nilai 7 subtes UTBK.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddPlatformOpen(true)}
              className="w-full md:w-auto px-5 h-11 bg-primary text-on-primary font-condensed text-lg tracking-wider uppercase font-bold rounded-lg border-2 border-ink flex items-center justify-center gap-1.5 manga-shadow active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
            >
              <PlusSquare className="w-5 h-5" />
              <span>+ DAFTAR PLATFORM BARU</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: PLATFORMS + LOCAL STORAGE */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* SECTION 1: PLATFORM TRYOUT TERDAFTAR */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-condensed text-2xl text-ink uppercase tracking-tight font-bold leading-none">
                  PLATFORM TRYOUT
                </h2>
                <span className="px-2 py-0.5 bg-ink text-surface text-[10px] uppercase font-bold rounded">
                  {platforms.length} AKTIF
                </span>
              </div>
              <span className="text-[10px] text-ink-muted uppercase font-bold">
                Konfigurasi IRT
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {platforms.map((pf) => {
                const count = tryouts.filter((t) => t.platformId === pf.id).length;
                return (
                  <div
                    key={pf.id}
                    className="bg-surface p-3.5 rounded-xl border-2 border-ink manga-shadow-sm flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded border border-ink flex items-center justify-center shadow-[1.5px_1.5px_0px_#171717] shrink-0 text-white"
                        style={{ backgroundColor: pf.colorHex }}
                      >
                        <span className="text-[11px] font-bold">{pf.shortCode}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-ink truncate">{pf.name}</span>
                          <span className="px-1.5 py-0.5 bg-manga-red-soft text-manga-red-dark text-[9px] font-bold uppercase rounded">
                            {pf.badgeText}
                          </span>
                        </div>
                        <span className="text-[11px] text-ink-muted truncate">
                          {pf.ratingType} • {count} Sesi Tersimpan
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label={`Filter tryout ${pf.name}`}
                        onClick={() => setFilterPfId(pf.id)}
                        className="w-8 h-8 rounded bg-surface-container border border-ink flex items-center justify-center text-ink shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus platform ${pf.name}`}
                        onClick={() =>
                          askConfirm({
                            title: `Hapus Platform ${pf.name}?`,
                            description: `Platform ${pf.name} memiliki ${count} tryout aktif. Menghapus platform akan mengarsipkan referensi tanpa menghilangkan data nilai.`,
                            confirmLabel: 'Ya, Hapus',
                            onConfirm: () => deletePlatform(pf.id),
                          })
                        }
                        className="w-8 h-8 rounded bg-manga-red-soft border border-ink flex items-center justify-center text-manga-red-dark shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setAddPlatformOpen(true)}
                className="w-full py-3 rounded-xl bg-surface-container-lowest border-2 border-dashed border-ink text-ink font-condensed text-lg tracking-wider uppercase font-bold flex items-center justify-center gap-2 hover:bg-surface-container transition-all cursor-pointer"
              >
                <PlusSquare className="w-5 h-5" />
                <span>+ TAMBAH PLATFORM BARU</span>
              </button>

              <div className="p-3 rounded-lg bg-surface-container-low border border-ink flex items-start gap-2 manga-shadow-sm">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-ink leading-snug">
                  <strong className="font-bold text-primary">PENTING:</strong> Menghapus platform
                  yang memiliki riwayat nilai akan mengarsipkan nilai terkait secara aman tanpa
                  menghapus data mentah UTBK.
                </p>
              </div>
            </div>
          </section>

          {/* LOCAL STORAGE & BACKUP CARD */}
          <div className="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <span className="font-condensed text-lg uppercase text-ink font-bold">
                  STATUS PENYIMPANAN LOKAL
                </span>
              </div>
              <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase rounded">
                SINKRON
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-paper p-2.5 rounded-lg border border-ink/20">
              <div className="flex flex-col items-center bg-surface p-2 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
                <span className="text-[9px] text-primary font-bold uppercase">TRYOUT</span>
                <span className="font-bebas text-3xl text-ink leading-none my-1 tabular-nums">
                  {tryouts.length}
                </span>
                <span className="text-[9px] text-ink-muted uppercase font-bold text-center">
                  Tercatat
                </span>
              </div>
              <div className="flex flex-col items-center bg-surface p-2 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
                <span className="text-[9px] text-primary font-bold uppercase">PLATFORM</span>
                <span className="font-bebas text-3xl text-primary leading-none my-1 tabular-nums">
                  {platforms.length}
                </span>
                <span className="text-[9px] text-manga-red-dark uppercase font-bold text-center">
                  Aktif
                </span>
              </div>
              <div className="flex flex-col items-center bg-surface p-2 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
                <span className="text-[9px] text-primary font-bold uppercase">LOG BELAJAR</span>
                <div className="flex items-baseline my-1">
                  <span className="font-bebas text-3xl text-ink leading-none tabular-nums">
                    {totalStudyHours}
                  </span>
                  <span className="text-[9px] text-ink-muted font-bold ml-0.5">JAM</span>
                </div>
                <span className="text-[9px] text-ink-muted uppercase font-bold text-center">
                  Total Durasi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={exportTryoutsCsv}
                className="h-10 bg-surface-container text-ink font-condensed text-sm font-bold uppercase tracking-wide rounded-lg border border-ink flex items-center justify-center gap-1.5 manga-shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Ekspor CSV</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  pushToast({
                    type: 'success',
                    title: 'Sinkron Cloud Berhasil!',
                    subtitle: `${tryouts.length} tryout & ${sessions.length} sesi belajar tersinkron.`,
                  })
                }
                className="h-10 bg-ink text-surface font-condensed text-sm font-bold uppercase tracking-wide rounded-lg border border-ink flex items-center justify-center gap-1.5 manga-shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Sinkron Cloud</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ARSIP RIWAYAT TRYOUT */}
        <section className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h2 className="font-condensed text-2xl text-ink uppercase tracking-tight font-bold leading-none">
                ARSIP RIWAYAT TRYOUT
              </h2>
              <span className="px-2 py-0.5 bg-manga-red-soft text-manga-red-dark text-[10px] uppercase font-bold rounded">
                {tryouts.length} SESI TERCATAT
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              Hasil komparasi skor 7 subtes TPS &amp; Literasi.
            </p>
          </div>

          {/* Search & Quick Filter Chips */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama tryout atau kode..."
                className="w-full h-11 pl-9 pr-3 bg-surface text-ink text-sm rounded-lg border-2 border-ink manga-shadow-sm focus:outline-none placeholder:text-ink-muted"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setFilterPfId('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase whitespace-nowrap border border-ink manga-shadow-sm cursor-pointer ${
                  filterPfId === 'ALL' ? 'bg-ink text-surface' : 'bg-surface text-ink'
                }`}
              >
                Semua ({tryouts.length})
              </button>
              {platforms.map((pf) => {
                const cnt = tryouts.filter((t) => t.platformId === pf.id).length;
                const active = filterPfId === pf.id;
                return (
                  <button
                    key={pf.id}
                    type="button"
                    onClick={() => setFilterPfId(pf.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase whitespace-nowrap border border-ink manga-shadow-sm cursor-pointer ${
                      active ? 'bg-ink text-surface' : 'bg-surface text-ink'
                    }`}
                  >
                    {pf.name} ({cnt})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tryout Cards Stack */}
          {filteredTryouts.length === 0 ? (
            <EmptyStateCard
              title="Arsip Tidak Ditemukan"
              description="Tidak ada catatan tryout yang cocok dengan pencarian atau filter platform saat ini."
              ctaLabel="+ Catat Tryout Baru"
              onCta={() => openTryoutForm()}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTryouts.map((record) => {
                const pf = platforms.find((p) => p.id === record.platformId);
                const deltaTarget = record.averageScore - settings.targetScore;
                return (
                  <div
                    key={record.id}
                    className="bg-surface p-3.5 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: pf?.colorHex || '#ad2933' }}
                          />
                          <span className="text-[10px] text-ink-muted uppercase font-bold truncate">
                            {pf?.name || 'Platform'} • {formatIndonesianTitleDate(record.date)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-ink mt-0.5 truncate">
                          {record.title}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bebas text-[34px] text-ink leading-none tabular-nums">
                            {record.averageScore}
                          </span>
                          <span className="text-[10px] text-ink-muted font-bold">PTS</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold uppercase mt-0.5 rounded tabular-nums ${
                            deltaTarget >= 0
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {deltaTarget >= 0 ? `+${deltaTarget}` : deltaTarget} VS TARGET
                        </span>
                      </div>
                    </div>

                    <div className="bg-paper p-2.5 rounded-lg border border-ink/20 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] text-ink-muted uppercase font-bold">
                        <span>Rincian Nilai Kunci:</span>
                        <span className="text-primary">TARGET: {settings.targetUniversityShort}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-surface p-1.5 rounded border border-ink flex flex-col items-center shadow-[1.5px_1.5px_0px_#171717]">
                          <span className="text-[9px] text-ink-muted uppercase font-bold">
                            Pen. Mat
                          </span>
                          <span className="font-bebas text-xl text-primary leading-none mt-0.5 tabular-nums">
                            {record.scores.PM}
                          </span>
                        </div>
                        <div className="bg-surface p-1.5 rounded border border-ink flex flex-col items-center shadow-[1.5px_1.5px_0px_#171717]">
                          <span className="text-[9px] text-ink-muted uppercase font-bold">
                            Pen. Kuan
                          </span>
                          <span className="font-bebas text-xl text-ink leading-none mt-0.5 tabular-nums">
                            {record.scores.PK}
                          </span>
                        </div>
                        <div className="bg-surface p-1.5 rounded border border-ink flex flex-col items-center shadow-[1.5px_1.5px_0px_#171717]">
                          <span className="text-[9px] text-ink-muted uppercase font-bold">
                            Pen. Umum
                          </span>
                          <span className="font-bebas text-xl text-ink leading-none mt-0.5 tabular-nums">
                            {record.scores.PU}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded font-bold text-ink uppercase">
                        {record.code}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            askConfirm({
                              title: 'Hapus Catatan Tryout?',
                              description: `Nilai ${record.title} (${record.averageScore} pts) dan riwayat 7 subtes akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
                              confirmLabel: 'Ya, Hapus Saja',
                              onConfirm: () => deleteTryout(record.id),
                            })
                          }
                          className="px-3 h-8 bg-manga-red-soft text-manga-red-dark text-xs font-bold uppercase rounded border border-ink shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => openTryoutForm(record.id)}
                          className="px-4 h-8 bg-primary text-on-primary font-condensed text-sm font-bold uppercase tracking-wide rounded border border-ink shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer"
                        >
                          Detail Sesi
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
