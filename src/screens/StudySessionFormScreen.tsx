import React, { useMemo, useState } from 'react';
import {
  AlarmClock,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Lightbulb,
  Timer,
} from 'lucide-react';
import { STUDY_GRID_ORDER, SUBTESTS } from '../constants/subtests';
import { useApp } from '../context/AppContext';
import { SubtestCode } from '../types';
import { TODAY_ISO } from '../utils/dateUtils';

interface StudySessionFormScreenProps {
  initialDate?: string;
  sessionId?: string;
}

export const StudySessionFormScreen: React.FC<StudySessionFormScreenProps> = ({
  initialDate,
  sessionId,
}) => {
  const { sessions, saveSession, goBackToTab } = useApp();

  const existing = useMemo(
    () => (sessionId ? sessions.find((s) => s.id === sessionId) : undefined),
    [sessionId, sessions]
  );

  const [date, setDate] = useState(existing?.date ?? initialDate ?? TODAY_ISO);
  const [startTime, setStartTime] = useState(existing?.startTime ?? '14:30');
  const [durationMinutes, setDurationMinutes] = useState<number>(
    existing?.durationMinutes ?? 120
  );
  const [selectedSubtests, setSelectedSubtests] = useState<SubtestCode[]>(
    existing?.subtests ?? ['PK', 'PM']
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const hours = Math.floor(durationMinutes / 60);
  const remainder = durationMinutes % 60;
  const readableDuration = `${String(hours).padStart(2, '0')} jam ${String(remainder).padStart(
    2,
    '0'
  )} menit`;

  const addDuration = (delta: number) => {
    setDurationMinutes((prev) => Math.min(720, Math.max(5, prev + delta)));
  };

  const toggleSubtest = (code: SubtestCode) => {
    setSelectedSubtests((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSession({
      id: existing?.id,
      date,
      startTime,
      durationMinutes: Math.max(5, Math.min(720, durationMinutes || 30)),
      subtests: selectedSubtests,
      notes: notes.trim(),
    });
    goBackToTab();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-2xl mx-auto pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 pt-1 border-b-2 border-ink">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Kembali"
            onClick={goBackToTab}
            className="w-10 h-10 flex items-center justify-center bg-surface border-2 border-ink rounded-lg manga-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-ink" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-condensed text-[22px] font-bold tracking-tight uppercase text-ink leading-none">
                {existing ? 'Edit Sesi Belajar' : 'Catat Sesi Belajar'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-manga-red-soft text-manga-red-dark font-bold rounded uppercase">
                {existing ? 'EDIT SESI' : 'SESI BARU'}
              </span>
            </div>
            <span className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
              <span>Target UTBK 2027</span>
              <span>•</span>
              <span className="italic font-semibold text-primary">一歩ずつ、前へ。</span>
            </span>
          </div>
        </div>
        <div className="hidden sm:flex w-9 h-9 rounded-full border-2 border-ink bg-amber-muted/30 items-center justify-center">
          <Edit3 className="w-4 h-4 text-ink" />
        </div>
      </div>

      {/* Section A: Informasi Sesi */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-5 bg-primary rounded-sm" />
          <h2 className="font-condensed text-[22px] font-bold uppercase text-ink tracking-wide">
            INFORMASI SESI
          </h2>
          <span className="text-[10px] text-manga-red-dark bg-manga-red-soft px-1.5 py-0.5 rounded font-bold uppercase ml-auto">
            WAJIB
          </span>
        </div>

        <div className="bg-surface border-2 border-ink rounded-xl p-4 manga-shadow-sm flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="study-date"
              className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Tanggal Belajar</span>
            </label>
            <div className="relative flex items-center gap-2">
              <input
                id="study-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="flex-1 h-11 bg-paper border-2 border-ink rounded-lg px-3 text-sm font-medium text-ink focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setDate(TODAY_ISO)}
                className="px-3 h-11 bg-surface border-2 border-ink text-ink text-xs font-bold rounded-lg uppercase hover:bg-surface-container cursor-pointer shrink-0"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="study-time"
                className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5"
              >
                <AlarmClock className="w-4 h-4" />
                <span>Waktu Mulai</span>
              </label>
              <input
                id="study-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 bg-paper border-2 border-ink rounded-lg px-3 text-sm font-medium text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="study-duration"
                  className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5"
                >
                  <Timer className="w-4 h-4" />
                  <span>Durasi Belajar</span>
                </label>
                <span className="text-[11px] font-bold text-primary tabular-nums">
                  {readableDuration}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="study-duration"
                  type="number"
                  min={5}
                  max={720}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  required
                  className="w-full h-11 bg-paper border-2 border-ink rounded-lg px-3 pr-20 font-condensed text-2xl font-bold text-ink focus:outline-none focus:border-primary tabular-nums"
                />
                <div className="absolute right-2 px-2.5 py-1 bg-ink text-surface font-condensed text-xs rounded uppercase tracking-wider font-bold">
                  MENIT
                </div>
              </div>
            </div>
          </div>

          {/* Quick Add Pills */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-ink/25">
            <span className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">
              Tambah Cepat Durasi:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[15, 30, 45, 60, 120].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addDuration(amt)}
                  className="px-3 py-1.5 bg-paper hover:bg-manga-red-soft border-2 border-ink rounded manga-shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-condensed text-base font-bold text-ink transition-all cursor-pointer"
                >
                  +{amt}m
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDurationMinutes(60)}
                className="px-2.5 py-1.5 bg-surface text-ink-muted hover:text-ink border border-ink/40 rounded text-[11px] font-bold uppercase ml-auto cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Fokus Subtes UTBK */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-5 bg-secondary rounded-sm" />
            <h2 className="font-condensed text-[22px] font-bold uppercase text-ink tracking-wide">
              FOKUS MATERI SUBTES
            </h2>
          </div>
          <span className="text-[10px] text-ink-muted bg-surface-container px-2 py-0.5 rounded font-bold uppercase">
            OPSIONAL
          </span>
        </div>
        <p className="text-xs text-ink-muted -mt-1">
          Pilih satu atau lebih materi yang dipelajari pada sesi ini untuk sinkronisasi heat-map.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {STUDY_GRID_ORDER.map((code) => {
            const meta = SUBTESTS[code];
            const selected = selectedSubtests.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleSubtest(code)}
                style={{ backgroundColor: meta.bgHex }}
                className={`relative text-left p-3 rounded-lg border-2 transition-all active:scale-95 flex flex-col justify-between h-24 overflow-hidden cursor-pointer ${
                  selected
                    ? 'border-primary manga-shadow'
                    : 'border-ink manga-shadow-sm opacity-85 hover:opacity-100'
                }`}
              >
                <div className="absolute -right-2 -bottom-3 text-[48px] font-bebas text-ink/10 font-bold select-none pointer-events-none leading-none">
                  {code}
                </div>
                <div className="flex items-start justify-between z-10 w-full">
                  <span className="font-condensed text-[26px] font-bold text-ink leading-none">
                    {code}
                  </span>
                  {selected && (
                    <span className="w-6 h-6 rounded-full bg-primary text-on-primary border border-ink flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="z-10 text-xs text-ink font-semibold line-clamp-2 leading-tight">
                  {meta.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Badges Summary */}
        <div className="bg-surface border-2 border-ink rounded-lg p-3 flex items-center justify-between gap-2 manga-shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-ink" />
            <span className="text-xs uppercase text-ink font-bold">
              SUBTES DIPILIH ({selectedSubtests.length}):
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {selectedSubtests.length === 0 ? (
              <span className="text-xs text-ink-muted italic">Tidak ada</span>
            ) : (
              selectedSubtests.map((code) => (
                <span
                  key={code}
                  className="font-condensed text-sm font-bold px-2 py-0.5 bg-ink text-surface rounded"
                >
                  {code}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section C: Catatan Belajar */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-5 bg-tertiary rounded-sm" />
            <h2 className="font-condensed text-[22px] font-bold uppercase text-ink tracking-wide">
              CATATAN BELAJAR
            </h2>
          </div>
          <span className="text-[10px] text-ink-muted bg-surface-container px-2 py-0.5 rounded font-bold uppercase">
            OPSIONAL
          </span>
        </div>

        <div className="bg-surface border-2 border-ink rounded-xl p-3 manga-shadow-sm flex flex-col gap-2">
          <label
            htmlFor="study-notes"
            className="text-[10px] font-bold uppercase tracking-wider text-ink-muted"
          >
            Refleksi atau detail materi:
          </label>
          <textarea
            id="study-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Latihan 20 soal PM bab Peluang dan Fungsi Komposisi, evaluasi error log soal penalaran analitis..."
            className="w-full bg-paper border-2 border-ink rounded-lg p-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-ink-muted">
              <Lightbulb className="w-3.5 h-3.5 text-amber-muted" />
              <span className="text-[10px] italic">
                Tuliskan konsep rumus yang masih sering keliru.
              </span>
            </div>
            <span className="text-[10px] text-ink-muted">{notes.length} karakter</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t-2 border-ink px-4 py-3 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={goBackToTab}
            className="w-1/3 h-12 bg-surface text-ink font-condensed text-lg font-bold uppercase tracking-wider border-2 border-ink rounded-lg manga-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-surface-container transition-all cursor-pointer"
          >
            BATAL
          </button>
          <button
            type="submit"
            className="w-2/3 h-12 bg-primary text-on-primary font-condensed text-lg font-bold uppercase tracking-wide border-2 border-ink rounded-lg manga-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>SIMPAN SESI BELAJAR</span>
          </button>
        </div>
      </div>
    </form>
  );
};
