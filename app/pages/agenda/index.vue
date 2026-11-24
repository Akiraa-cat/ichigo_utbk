<script setup>
import { computed, ref } from 'vue'
import { useRoute } from '#imports'
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
} from '@lucide/vue'
import { useApp } from '~/composables/useApp'
import {
  addDaysIso,
  buildMonthGrid,
  formatDurationCompact,
  formatDurationHHMM,
  formatIndonesianFull,
  formatIndonesianSheetDate,
  formatMonthYearUpper,
  getTodayIso,
} from '~/utils/dateUtils.js'

const {
  sessions,
  schedules,
  settings,
  getActivity,
  openStudyForm,
  deleteSession,
  askConfirm,
  navigateTab,
} = useApp()
const route = useRoute()

const todayIso = computed(() => getTodayIso(settings.value.timezone || undefined))
const viewYear = ref(Number(todayIso.value.slice(0, 4)))
const viewMonth = ref(Number(todayIso.value.slice(5, 7)) - 1)
const selectedIso = ref(todayIso.value)
const sheetOpen = ref(false)

const cells = computed(() => buildMonthGrid(viewYear.value, viewMonth.value))
const minutesByDate = computed(() => {
  const map = {}
  sessions.value.forEach((session) => {
    map[session.date] = (map[session.date] || 0) + (session.durationMinutes || 0)
  })
  return map
})
const monthPrefix = computed(
  () => `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}`,
)
const monthSessions = computed(() =>
  sessions.value.filter((session) => session.date.startsWith(monthPrefix.value)),
)
const monthTotalMinutes = computed(() =>
  monthSessions.value.reduce((total, session) => total + session.durationMinutes, 0),
)
const activeDaysCount = computed(() => new Set(monthSessions.value.map((session) => session.date)).size)
const avgDailyMinutes = computed(() =>
  activeDaysCount.value > 0 ? Math.round(monthTotalMinutes.value / activeDaysCount.value) : 0,
)
const selectedDaySessions = computed(() =>
  sessions.value.filter((session) => session.date === selectedIso.value),
)
const selectedDayMinutes = computed(() =>
  selectedDaySessions.value.reduce((total, session) => total + session.durationMinutes, 0),
)
const targetPct = computed(() =>
  settings.value.dailyTargetMinutes
    ? Math.round((selectedDayMinutes.value / settings.value.dailyTargetMinutes) * 100)
    : null,
)
const selectedSubtestsUnique = computed(() =>
  Array.from(new Set(selectedDaySessions.value.flatMap((session) => session.subtests))),
)
const tomorrowIso = computed(() => addDaysIso(todayIso.value, 1))
const tomorrowSchedule = computed(
  () => schedules.value[tomorrowIso.value]?.activities ?? [],
)

function handlePrevMonth() {
  if (viewMonth.value === 0) {
    viewYear.value -= 1
    viewMonth.value = 11
  } else {
    viewMonth.value -= 1
  }
}

function handleNextMonth() {
  if (viewMonth.value === 11) {
    viewYear.value += 1
    viewMonth.value = 0
  } else {
    viewMonth.value += 1
  }
}

function getHeatStyles(mins, isFuture) {
  if (isFuture && mins === 0) {
    return 'bg-paper/70 border border-dashed border-ink/25 text-ink-muted/60'
  }
  if (mins === 0) {
    return 'bg-paper border border-ink/25 text-ink-muted'
  }
  if (mins < 60) {
    return 'bg-[#FCE8E7] border border-ink text-ink'
  }
  if (mins <= 120) {
    return 'bg-[#F3B3B0] border border-ink text-ink'
  }
  if (mins <= 210) {
    return 'bg-[#E26D72] border border-ink text-white'
  }
  return 'bg-primary border border-ink text-white'
}

function selectDay(iso) {
  selectedIso.value = iso
  sheetOpen.value = true
}

function editSession(session) {
  sheetOpen.value = false
  openStudyForm({ sessionId: session.id, date: session.date })
}

function confirmDeleteSession(session) {
  askConfirm({
    title: 'Hapus Sesi Belajar?',
    description: `Sesi belajar ${session.durationMinutes} menit pada tanggal ${formatIndonesianSheetDate(session.date)} akan dihapus permanen.`,
    confirmLabel: 'Ya, Hapus Saja',
    onConfirm: () => deleteSession(session.id),
  })
}

function startNewSession() {
  sheetOpen.value = false
  openStudyForm({ date: selectedIso.value })
}
</script>

<template>
  <NuxtPage v-if="route.path !== '/agenda'" />
  <div v-else class="flex flex-col gap-4 pb-4">
    <!-- Top Motivation & Manga Speech Bubble Header -->
    <section class="flex flex-col space-y-2">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white border border-ink text-ink manga-shadow-sm">
          AKTIVITAS &amp; KONSISTENSI BELAJAR
        </span>
        <span class="text-[11px] font-bold text-ink-muted flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-primary inline-block" />
          <span>{{ formatIndonesianFull(todayIso) }}</span>
        </span>
      </div>

      <div class="relative bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-manga-red-soft text-primary border-2 border-ink flex items-center justify-center shrink-0 manga-shadow-sm">
          <Flame class="w-5 h-5" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bebas text-lg tracking-wider text-primary leading-none">KONTRIBUSI HARIAN</span>
          </div>
          <p class="text-xs font-semibold text-ink leading-snug mt-1">
            “Konsistensi kecil setiap hari kunci lolos UTBK! 一期一会 (Ichigo Ichie)”
          </p>
        </div>
      </div>
    </section>

    <!-- Month Bar Controller -->
    <div class="flex items-center justify-between bg-surface rounded-xl px-3 py-2 border-2 border-ink manga-shadow">
      <button
        type="button"
        aria-label="Bulan sebelumnya"
        class="w-9 h-9 rounded-lg bg-paper border-2 border-ink flex items-center justify-center text-ink active:translate-x-0.5 active:translate-y-0.5 transition-transform manga-shadow-sm cursor-pointer"
        @click="handlePrevMonth"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <div class="flex items-center gap-2">
        <span class="font-bebas text-2xl tracking-wider text-ink leading-none mt-0.5">
          {{ formatMonthYearUpper(viewYear, viewMonth) }}
        </span>
        <span class="text-[10px] font-bold px-1.5 py-0.5 bg-paper border border-ink rounded">
          {{ activeDaysCount || '—' }} HARI AKTIF
        </span>
      </div>
      <button
        type="button"
        aria-label="Bulan berikutnya"
        class="w-9 h-9 rounded-lg bg-paper border-2 border-ink flex items-center justify-center text-ink active:translate-x-0.5 active:translate-y-0.5 transition-transform manga-shadow-sm cursor-pointer"
        @click="handleNextMonth"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Main Responsive Split -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- LEFT: Heatmap Calendar Panel -->
      <section class="lg:col-span-7 bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow flex flex-col space-y-3">
        <div class="flex items-center justify-between pb-2 border-b-2 border-paper">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-primary rounded-full border border-ink" />
            <span class="font-bebas text-xl uppercase tracking-wide text-ink leading-none">KALENDER BELAJAR</span>
          </div>
          <span class="text-[11px] font-bold text-ink-muted">Klik tanggal untuk rincian</span>
        </div>

        <div class="grid grid-cols-7 gap-1 text-center font-bebas text-base text-ink-muted">
          <span class="py-0.5">SEN</span>
          <span class="py-0.5">SEL</span>
          <span class="py-0.5">RAB</span>
          <span class="py-0.5">KAM</span>
          <span class="py-0.5">JUM</span>
          <span class="py-0.5">SAB</span>
          <span class="py-0.5 text-primary">MIN</span>
        </div>

        <div class="grid grid-cols-7 gap-1.5">
          <template v-for="cell in cells" :key="cell.iso">
            <div
              v-if="!cell.inMonth"
              class="aspect-square rounded p-1 bg-surface-container-low/40 border border-dashed border-ink/15 opacity-40 flex flex-col justify-between"
            >
              <span class="text-[9px] font-semibold text-ink-muted">{{ cell.day }}</span>
            </div>
            <button
              v-else
              type="button"
              class="aspect-square rounded p-1 flex flex-col justify-between text-left transition-all cursor-pointer hover:scale-105 active:scale-95"
              :class="[
                getHeatStyles(minutesByDate[cell.iso] || 0, cell.iso > todayIso),
                selectedIso === cell.iso
                  ? 'ring-2 ring-ink border-[2.5px] border-ink manga-shadow-sm scale-105 z-10'
                  : '',
              ]"
              @click="selectDay(cell.iso)"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-[10px] font-bold leading-none tabular-nums">{{ cell.day }}</span>
                <span
                  v-if="cell.iso === todayIso"
                  class="w-1.5 h-1.5 bg-yellow-300 rounded-full border border-ink/40"
                />
              </div>
              <span class="text-[8px] font-extrabold leading-none tabular-nums">
                {{ (minutesByDate[cell.iso] || 0) > 0
                  ? formatDurationHHMM(minutesByDate[cell.iso])
                  : cell.iso > todayIso ? '' : '-' }}
              </span>
            </button>
          </template>
        </div>

        <!-- Legend -->
        <div class="flex items-center justify-between pt-2 border-t-2 border-paper">
          <span class="text-[10px] font-bold text-ink-muted uppercase">SEDIKIT</span>
          <div class="flex items-center gap-1.5">
            <div class="w-3.5 h-3.5 rounded-sm bg-paper border border-ink/30" title="0 jam" />
            <div class="w-3.5 h-3.5 rounded-sm bg-[#FCE8E7] border border-ink/50" title="< 1 jam" />
            <div class="w-3.5 h-3.5 rounded-sm bg-[#F3B3B0] border border-ink/50" title="1-2 jam" />
            <div class="w-3.5 h-3.5 rounded-sm bg-[#E26D72] border border-ink/70" title="2-3.5 jam" />
            <div class="w-3.5 h-3.5 rounded-sm bg-primary border border-ink" title="> 3.5 jam" />
          </div>
          <span class="text-[10px] font-bold text-ink uppercase">BANYAK</span>
        </div>
      </section>

      <!-- RIGHT: Selected Day Card + Monthly Stats + Tomorrow Schedule -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <!-- Selected Day Detail Card -->
        <section class="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 w-28 h-28 manga-dots opacity-10 pointer-events-none rounded-full" />
          <div class="flex items-center justify-between pb-2.5 border-b-2 border-ink">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary text-white tracking-wider border border-ink">
                TERPILIH
              </span>
              <span class="font-bebas text-xl uppercase text-ink leading-none mt-0.5">
                {{ selectedIso === todayIso ? 'HARI INI' : formatIndonesianSheetDate(selectedIso) }}
              </span>
            </div>
            <div v-if="selectedDayMinutes > 0" class="flex items-center gap-1 text-emerald-700 font-bold text-xs">
              <CheckCircle2 class="w-4 h-4" />
              <span>TERCATAT</span>
            </div>
          </div>

          <div v-if="selectedDaySessions.length === 0" class="py-4">
            <EmptyStateCard
              title="Belum Ada Sesi Belajar"
              description="Ceritamu dimulai dari satu sesi pertama. Langkah kecil hari ini adalah lompatan besar."
              cta-label="+ Mulai Sesi Pertama"
              :on-cta="() => openStudyForm({ date: selectedIso })"
            />
          </div>
          <template v-else>
            <div class="py-3 flex items-center justify-between gap-3">
              <div>
                <span class="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">DURASI BELAJAR</span>
                <div class="flex items-baseline gap-1.5 mt-0.5">
                  <span class="font-bebas text-4xl text-primary tracking-wide leading-none tabular-nums">
                    {{ formatDurationHHMM(selectedDayMinutes) }}
                  </span>
                  <span class="text-xs font-bold text-ink-muted tabular-nums">({{ selectedDayMinutes }} Menit)</span>
                </div>
              </div>
              <div class="text-right flex flex-col items-end">
                <span class="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">TARGET HARIAN</span>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="font-bebas text-xl text-ink leading-none tabular-nums">
                    {{ settings.dailyTargetMinutes ?? '—' }} MIN
                  </span>
                  <span v-if="targetPct !== null" class="text-[10px] font-extrabold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 rounded tabular-nums">
                    {{ targetPct }}%
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-paper rounded-lg p-2.5 border border-ink/30 flex flex-col space-y-1.5 mb-3">
              <span class="text-[10px] uppercase font-bold text-ink-muted">SUBTES YANG DIKERJAKAN:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="code in selectedSubtestsUnique"
                  :key="code"
                  class="px-2 py-1 rounded bg-white border border-ink text-ink text-xs font-semibold flex items-center gap-1.5 manga-shadow-sm"
                >
                  <span
                    class="w-2.5 h-2.5 rounded-full border border-ink/30"
                    :style="{ backgroundColor: getActivity(code)?.backgroundColor }"
                  />
                  <span>{{ getActivity(code)?.name || code }} ({{ code }})</span>
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                class="h-11 rounded-lg bg-surface text-ink border-2 border-ink manga-shadow-sm font-condensed text-base font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                @click="sheetOpen = true"
              >
                <Edit3 class="w-4 h-4" />
                <span>RINCIAN SESI</span>
              </button>
              <button
                type="button"
                class="h-11 rounded-lg bg-primary text-on-primary border-2 border-ink manga-shadow-sm font-condensed text-base font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                @click="openStudyForm({ date: selectedIso })"
              >
                <Plus class="w-4 h-4" />
                <span>+ CATAT SESI</span>
              </button>
            </div>
          </template>
        </section>

        <!-- Monthly Stats 3-Column Summary Bar -->
        <section class="grid grid-cols-3 gap-2">
          <div class="bg-surface rounded-xl p-2.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
            <div class="flex items-center gap-1 text-ink-muted">
              <Clock class="w-3.5 h-3.5" />
              <span class="text-[10px] uppercase font-bold tracking-tight">TOTAL JAM</span>
            </div>
            <div class="mt-2">
              <span class="font-bebas text-2xl text-ink leading-none block tabular-nums">
                {{ monthTotalMinutes ? formatDurationCompact(monthTotalMinutes) : '—' }}
              </span>
              <span class="text-[9px] text-emerald-700 font-bold block mt-0.5">Bulan Ini</span>
            </div>
          </div>

          <div class="bg-surface rounded-xl p-2.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
            <div class="flex items-center gap-1 text-ink-muted">
              <Gauge class="w-3.5 h-3.5" />
              <span class="text-[10px] uppercase font-bold tracking-tight">RATA-RATA</span>
            </div>
            <div class="mt-2">
              <span class="font-bebas text-2xl text-ink leading-none block tabular-nums">
                {{ avgDailyMinutes ? formatDurationCompact(avgDailyMinutes) : '—' }}
              </span>
              <span class="text-[9px] text-ink-muted font-semibold block mt-0.5">per hari aktif</span>
            </div>
          </div>

          <div class="bg-surface rounded-xl p-2.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between bg-gradient-to-b from-white to-manga-red-soft/30">
            <div class="flex items-center gap-1 text-primary">
              <Flame class="w-3.5 h-3.5" />
              <span class="text-[10px] uppercase font-bold tracking-tight">HARI AKTIF</span>
            </div>
            <div class="mt-2">
              <span class="font-bebas text-2xl text-primary leading-none block tabular-nums">{{ activeDaysCount ? `${activeDaysCount} HARI` : '—' }}</span>
              <span class="text-[9px] text-ink font-bold block mt-0.5">Sesi Tercatat</span>
            </div>
          </div>
        </section>

        <!-- Tomorrow's Schedule Preview -->
        <section class="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow flex flex-col space-y-3">
          <div class="flex items-center justify-between pb-2 border-b-2 border-paper">
            <div class="flex items-center gap-2">
              <Calendar class="w-5 h-5 text-primary" />
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-bebas text-xl uppercase tracking-wide text-ink leading-none">JADWAL BESOK!</span>
                  <span class="text-[9px] px-1.5 py-0.5 bg-primary text-white font-extrabold rounded uppercase tracking-wider">
                    TERJADWAL
                  </span>
                </div>
                <p class="text-[10px] text-ink-muted uppercase font-bold mt-0.5">
                  {{ formatIndonesianFull(tomorrowIso) }}
                </p>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-paper border border-ink text-ink">
              {{ tomorrowSchedule.length }} AKTIVITAS
            </span>
          </div>

          <div class="flex flex-col space-y-2">
            <div
              v-for="code in tomorrowSchedule"
              :key="code"
              class="bg-paper border-2 border-ink rounded-lg p-2.5 flex items-center gap-3 manga-shadow-sm"
            >
              <span
                class="w-9 h-9 rounded border border-ink font-bebas text-lg flex items-center justify-center shrink-0 leading-none"
                :style="{
                  backgroundColor: getActivity(code)?.backgroundColor,
                  color: getActivity(code)?.textColor,
                }"
              >
                {{ code }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-ink leading-tight truncate">{{ getActivity(code)?.name || code }}</p>
              </div>
            </div>
            <p v-if="tomorrowSchedule.length === 0" class="text-xs text-ink-muted py-2 text-center">
              Belum ada jadwal untuk besok.
            </p>
          </div>

          <button
            type="button"
            class="w-full py-2.5 px-3 rounded-lg bg-paper border-2 border-ink manga-shadow-sm text-xs font-bold text-ink text-center flex items-center justify-center gap-1.5 hover:bg-surface-container active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            @click="navigateTab('jadwal')"
          >
            <span>Lihat Seluruh Rencana di Jadwal</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>

    <!-- MANGA DETAIL BOTTOM SHEET -->
    <div
      v-if="sheetOpen"
      class="fixed inset-0 z-50 bg-ink/65 backdrop-blur-[2px] flex flex-col justify-end md:items-center md:justify-center md:p-4"
      @click="sheetOpen = false"
    >
      <div
        class="w-full md:max-w-lg max-h-[85vh] bg-surface border-t-[3px] md:border-[3px] border-ink rounded-t-2xl md:rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
        @click.stop
      >
        <!-- Grab Handle -->
        <div class="pt-3 pb-1 flex justify-center items-center bg-paper md:hidden">
          <div class="w-12 h-1.5 bg-ink rounded-full" />
        </div>

        <!-- Header -->
        <div class="px-4 py-3 bg-paper border-b-2 border-ink flex items-center justify-between relative overflow-hidden">
          <div class="absolute inset-0 manga-dots opacity-10 pointer-events-none" />
          <div class="flex flex-col relative z-10">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-extrabold px-1.5 py-0.5 bg-ink text-white rounded border border-ink uppercase">
                HISTORI BELAJAR
              </span>
              <span class="font-bebas text-xl text-ink tracking-wide leading-none mt-0.5">
                {{ formatIndonesianSheetDate(selectedIso) }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-xs font-bold text-ink-muted">TOTAL:</span>
              <span class="font-bebas text-lg text-primary leading-none tabular-nums">
                {{ formatDurationHHMM(selectedDayMinutes) }} ({{ selectedDayMinutes }} MENIT)
              </span>
              <span
                v-if="targetPct !== null && selectedDayMinutes > 0"
                class="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-400 px-1.5 rounded tabular-nums"
              >
                Target Tercapai {{ targetPct }}%
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            class="w-9 h-9 rounded-lg bg-surface border-2 border-ink flex items-center justify-center text-ink manga-shadow-sm z-10 cursor-pointer"
            @click="sheetOpen = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 space-y-4 overflow-y-auto">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bebas text-base uppercase text-ink tracking-wider">RINCIAN SESI BELAJAR</span>
              <span class="text-[11px] font-bold text-ink-muted">{{ selectedDaySessions.length }} Sesi Tercatat</span>
            </div>

            <p
              v-if="selectedDaySessions.length === 0"
              class="text-xs text-ink-muted bg-paper p-3 rounded-lg border border-ink/20"
            >
              Belum ada sesi belajar tercatat pada tanggal ini.
            </p>
            <div v-else class="space-y-2.5">
              <div
                v-for="session in selectedDaySessions"
                :key="session.id"
                class="bg-paper rounded-xl p-3 border-2 border-ink manga-shadow-sm space-y-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      v-for="code in session.subtests"
                      :key="code"
                      class="px-2 py-0.5 rounded border border-ink font-bebas text-sm leading-none"
                      :style="{
                        backgroundColor: getActivity(code)?.backgroundColor,
                        color: getActivity(code)?.textColor,
                      }"
                    >
                      {{ code }}
                    </span>
                    <span class="text-xs font-bold text-ink tabular-nums">
                      {{ session.startTime }} WIB · {{ session.durationMinutes }} Menit
                    </span>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Edit sesi"
                      class="w-8 h-8 rounded bg-surface border border-ink flex items-center justify-center text-ink hover:bg-surface-container cursor-pointer"
                      @click="editSession(session)"
                    >
                      <Edit3 class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus sesi"
                      class="w-8 h-8 rounded bg-manga-red-soft border border-ink flex items-center justify-center text-primary cursor-pointer"
                      @click="confirmDeleteSession(session)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div v-if="session.notes" class="relative mt-2">
                  <div class="bg-white rounded-xl border-2 border-ink p-3 text-xs text-ink leading-relaxed">
                    <div class="flex items-center justify-between pb-1 mb-1 border-b border-ink/15">
                      <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-primary text-white rounded">
                        NOTE!
                      </span>
                      <span class="text-[10px] font-extrabold text-manga-red-dark">#KONSISTEN</span>
                    </div>
                    <p class="font-medium text-ink">“{{ session.notes }}”</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              class="h-11 rounded-lg bg-surface border-2 border-ink manga-shadow-sm font-bebas text-lg uppercase tracking-wider text-ink flex items-center justify-center gap-1.5 cursor-pointer"
              @click="sheetOpen = false"
            >
              <ArrowLeft class="w-4 h-4" />
              <span>KEMBALI</span>
            </button>
            <button
              type="button"
              class="h-11 rounded-lg bg-primary text-on-primary border-2 border-ink manga-shadow-sm font-bebas text-lg uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              @click="startNewSession"
            >
              <Plus class="w-4 h-4" />
              <span>+ CATAT SESI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
