<script setup>
import {
  ArrowRight,
  BarChart3,
  Bolt,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  Hourglass,
  PlusSquare,
  Timer,
} from '@lucide/vue'
import { computed } from 'vue'
import { useApp } from '~/composables/useApp'
import {
  formatDurationReadable,
  formatIndonesianFull,
  formatIndonesianShortDate,
  formatIndonesianTitleDate,
  getDaysRemaining,
  getTodayIso,
} from '~/utils/dateUtils.js'
import { SUBTEST_ORDER } from '~/utils/subtests.js'

const {
  settings,
  sessions,
  tryouts,
  platforms,
  schedules,
  getActivity,
  navigateTab,
  openStudyForm,
  openTryoutForm,
} = useApp()
const todayIso = computed(() => getTodayIso(settings.value.timezone || undefined))

const daysLeft = computed(() =>
  settings.value.targetDate ? getDaysRemaining(todayIso.value, settings.value.targetDate) : null,
)
const totalMinutes = computed(() =>
  sessions.value.reduce((acc, session) => acc + session.durationMinutes, 0),
)
const sortedTryouts = computed(() =>
  [...tryouts.value].sort((a, b) => b.date.localeCompare(a.date)),
)
const latestTryout = computed(() => sortedTryouts.value[0])
const prevTryout = computed(() => sortedTryouts.value[1])
const latestPlatform = computed(() =>
  latestTryout.value
    ? platforms.value.find((platform) => platform.id === latestTryout.value.applicationId)
    : undefined,
)
const avgDelta = computed(() =>
  latestTryout.value?.averageScore !== null &&
  latestTryout.value?.averageScore !== undefined &&
  prevTryout.value?.averageScore !== null &&
  prevTryout.value?.averageScore !== undefined
    ? latestTryout.value.averageScore - prevTryout.value.averageScore
    : null,
)
const highlightSubtests = computed(() =>
  latestTryout.value
    ? SUBTEST_ORDER.filter((code) => latestTryout.value.scores[code] !== null)
        .slice(0, 3)
        .map((code) => {
          const currentVal = latestTryout.value.scores[code]
          const prevVal = prevTryout.value?.scores[code]
          return {
            code,
            label: getActivity(code)?.name || code,
            score: currentVal,
            delta: prevVal === null || prevVal === undefined ? null : currentVal - prevVal,
            isTarget: settings.value.focusSubtests.includes(code),
          }
        })
    : [],
)
const todaySchedule = computed(() => schedules.value[todayIso.value]?.activities ?? [])
</script>

<template>
  <div class="flex flex-col gap-5 select-none">
    <!-- Greeting Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex flex-col">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span class="text-[11px] text-ink-muted uppercase tracking-wider font-semibold">
            {{ formatIndonesianFull(todayIso) }}
          </span>
        </div>
        <h1 class="font-bebas text-[30px] md:text-[36px] uppercase tracking-normal text-ink mt-0.5 leading-none">
          MOSHI MOSHI, AKIRAA!
        </h1>
      </div>
      <div class="px-3 py-1.5 bg-surface rounded-lg border-2 border-ink manga-shadow-sm flex items-center gap-1.5 shrink-0">
        <span class="text-[11px] uppercase font-bold text-primary tracking-wide">
          UTBK STUDY JOURNAL
        </span>
      </div>
    </div>

    <!-- Main 2-column responsive layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- LEFT COLUMN -->
      <div class="lg:col-span-7 flex flex-col gap-4">
        <!-- Countdown Hero Panel with Manga Speedlines -->
        <div class="relative overflow-hidden bg-surface rounded-xl border-2 border-ink manga-shadow p-4 md:p-5">
          <div class="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center">
            <svg class="w-full h-full" fill="none" stroke="#171717" stroke-width="2" viewBox="0 0 400 400" preserveAspectRatio="none">
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

          <div class="relative z-10 flex justify-between items-center gap-2 flex-wrap">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper rounded border border-ink/20">
              <Timer class="w-3.5 h-3.5 text-primary" />
              <span class="text-[10px] uppercase font-bold text-ink tracking-wider">MENUJU UTBK</span>
            </div>
            <div class="bg-surface px-2.5 py-1 rounded-lg border border-ink/30 shadow-[1.5px_1.5px_0px_#171717] flex items-center gap-1.5 -rotate-1">
              <span class="text-[10px] font-bold text-ink">一歩ずつ、前へ。</span>
              <span class="text-[10px] text-primary font-bold italic">ichigo ichie</span>
            </div>
          </div>

          <div class="relative z-10 mt-4 flex items-baseline justify-between gap-2">
            <div class="flex items-baseline gap-2.5">
              <span v-if="daysLeft !== null" class="font-bebas text-[52px] md:text-[60px] leading-none tracking-tight text-ink drop-shadow-[2px_2px_0px_rgba(173,41,51,0.3)] tabular-nums">H-{{ daysLeft }}</span>
              <span v-else class="font-bebas text-[36px] text-ink">—</span>
            </div>
            <div class="text-right flex flex-col items-end">
              <span class="text-[10px] uppercase text-ink-muted block leading-none font-semibold">TANGGAL UTBK</span>
              <span class="font-bebas text-[22px] leading-tight text-ink mt-1 uppercase">{{ settings.targetDate ? formatIndonesianTitleDate(settings.targetDate) : '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Target & Focus Comic Bento Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-ink-muted uppercase font-bold tracking-wider">PILIHAN 1</span>
                <GraduationCap class="w-4 h-4 text-secondary" />
              </div>
              <div class="mt-1 font-bebas text-[22px] text-ink leading-tight tracking-wide">{{ settings.targetUniversity || '—' }}</div>
              <div class="text-xs text-ink-muted truncate">{{ settings.targetMajor }}</div>
            </div>
            <div class="mt-2.5 pt-2 border-t border-ink/10 flex items-center justify-between">
              <span class="text-[10px] text-ink-muted font-bold">TARGET SKOR</span>
              <span class="font-bebas text-[20px] text-primary leading-none tabular-nums">{{ settings.targetScore === null ? '—' : `>${settings.targetScore}` }}</span>
            </div>
          </div>

          <div class="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-ink-muted uppercase font-bold tracking-wider">FOKUS UTAMA</span>
                <Bolt class="w-4 h-4 text-primary" />
              </div>
              <div class="flex items-center flex-wrap gap-1.5 mt-1.5">
                <span v-for="code in settings.focusSubtests" :key="code" class="px-2 py-0.5 bg-manga-red-soft text-manga-red-dark font-bebas text-[15px] rounded leading-none border border-primary/20">{{ code }}</span>
              </div>
            </div>
            <div class="mt-2.5 pt-2 border-t border-ink/10 flex items-center justify-between">
              <span class="text-[10px] text-ink-muted font-bold">STATUS DRILL</span>
              <span v-if="settings.focusSubtests.length" class="text-[11px] text-tertiary font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                AKTIF
              </span>
              <span v-else class="text-[11px] text-ink-muted font-bold">BELUM DIATUR</span>
            </div>
          </div>
        </div>

        <!-- Study Duration Strip Panel -->
        <div class="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-surface-container border border-ink/20 flex items-center justify-center text-ink shrink-0">
              <Hourglass class="w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-ink-muted uppercase font-bold tracking-wider">TOTAL WAKTU BELAJAR</span>
              <span v-if="sessions.length" class="font-bebas text-[28px] text-ink leading-none mt-0.5 tabular-nums">{{ formatDurationReadable(totalMinutes) }}</span>
              <span v-else class="text-xs text-ink-muted mt-1">Belum ada sesi tercatat</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="px-2.5 py-1 bg-surface-container-high rounded text-ink text-[11px] font-bold tracking-wide border border-ink/15">{{ sessions.length ? `${sessions.length} Sesi` : 'Belum ada sesi' }}</span>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button type="button" @click="openTryoutForm()" class="h-12 bg-primary text-on-primary rounded-xl text-[13px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 border-2 border-ink manga-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
            <BarChart3 class="w-[18px] h-[18px]" />
            <span>CATAT NILAI</span>
          </button>
          <button type="button" @click="openStudyForm({ date: todayIso })" class="h-12 bg-surface text-ink rounded-xl text-[13px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 border-2 border-ink manga-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer hover:bg-surface-container-low">
            <Clock class="w-[18px] h-[18px] text-primary" />
            <span>CATAT BELAJAR</span>
          </button>
        </div>

        <NuxtLink to="/memori" class="group flex items-center justify-between gap-3 rounded-xl border-2 border-ink border-l-[5px] border-l-primary bg-surface p-3 manga-shadow-sm transition-colors hover:bg-manga-red-soft/30">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink/20 bg-manga-red-soft text-primary">
              <BookOpen class="h-[18px] w-[18px]" />
            </div>
            <div class="min-w-0">
              <span class="block font-condensed text-base font-bold uppercase leading-tight text-ink">Memori Kesalahan</span>
              <span class="block text-[11px] leading-snug text-ink-muted">Buka kembali refleksi latihanmu.</span>
            </div>
          </div>
          <ArrowRight class="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
        </NuxtLink>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <!-- Tryout Score Overview Panel -->
        <div class="bg-surface rounded-xl border-2 border-ink manga-shadow overflow-hidden">
          <div class="p-3 bg-surface flex items-center justify-between border-b border-ink/10">
            <div class="flex items-center gap-1.5">
              <PlusSquare class="w-[18px] h-[18px] text-primary" />
              <span class="text-[13px] text-ink uppercase font-bold tracking-wide">RINGKASAN SKOR</span>
            </div>
            <button type="button" @click="navigateTab('nilai')" class="text-[11px] text-secondary font-bold uppercase tracking-wider flex items-center gap-0.5 hover:underline cursor-pointer">
              <span>LIHAT NILAI</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <template v-if="latestTryout">
            <div class="p-3.5 bg-paper flex items-center justify-between border-b border-ink/10">
              <div class="flex flex-col min-w-0 pr-2">
                <div class="flex items-center gap-1.5">
                  <span v-if="latestPlatform" class="px-1.5 py-0.5 text-white rounded font-bebas text-[12px] leading-none tracking-wider shrink-0" :style="{ backgroundColor: latestPlatform.colorHex }">{{ latestPlatform.name }}</span>
                </div>
                <span class="text-xs text-ink-muted mt-1">Rata-rata Terkini</span>
              </div>
              <div class="flex items-baseline gap-1.5 shrink-0">
                <span class="font-bebas text-[38px] text-primary font-bold leading-none tabular-nums">{{ latestTryout.averageScore ?? '—' }}</span>
                <span v-if="avgDelta !== null" class="text-[11px] font-bold bg-surface px-1.5 py-0.5 rounded border border-ink/20 shadow-[1px_1px_0px_#171717] tabular-nums" :class="avgDelta >= 0 ? 'text-tertiary' : 'text-error'">{{ avgDelta >= 0 ? `+${avgDelta}` : avgDelta }}</span>
              </div>
            </div>

            <div class="grid grid-cols-3 p-3 gap-2">
              <div v-for="item in highlightSubtests" :key="item.code" class="rounded-lg p-2.5 flex flex-col items-center justify-between text-center border shadow-[1px_1px_0px_#171717]" :class="item.isTarget ? 'bg-manga-red-soft/45 border-primary/40' : 'bg-surface-container-low border-ink/15'">
                <div class="w-full flex items-center justify-between">
                  <span class="text-[9px] font-bold uppercase tracking-tight" :class="item.isTarget ? 'text-primary px-1 bg-surface rounded border border-primary/20' : 'text-ink-muted'">{{ item.isTarget ? 'TARGET' : item.code }}</span>
                  <span class="w-1.5 h-1.5 rounded-full" :class="item.delta === null ? 'bg-ink-muted' : item.delta >= 0 ? 'bg-tertiary' : 'bg-error'" />
                </div>
                <span class="text-[10px] uppercase font-bold mt-1 line-clamp-1" :class="item.isTarget ? 'text-manga-red-dark' : 'text-ink-muted'">{{ item.label }}</span>
                <span class="font-bebas text-[28px] leading-none mt-1.5 tabular-nums" :class="item.code === 'PK' ? 'text-primary' : 'text-ink'">{{ item.score }}</span>
                <div v-if="item.delta !== null" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border mt-2 text-[10px] font-bold leading-none tabular-nums" :class="item.delta >= 0 ? 'border-tertiary/30 bg-[#EAF4EC] text-[#56865D]' : 'border-error/30 bg-[#FDF0F0] text-[#C54A4A]'">
                  <span>{{ item.delta >= 0 ? '↑' : '↓' }}</span>
                  <span>{{ item.delta >= 0 ? `+${item.delta}` : item.delta }} pts</span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="p-5 text-center text-xs text-ink-muted">
            Belum ada catatan tryout. Klik <strong>CATAT NILAI</strong> untuk memulai.
          </div>
        </div>

        <!-- Today's Agenda Preview -->
        <div class="bg-surface rounded-xl border-2 border-ink manga-shadow p-3.5">
          <div class="flex items-center justify-between pb-2.5 border-b border-ink/10">
            <div class="flex items-center gap-2">
              <Calendar class="w-[18px] h-[18px] text-primary" />
              <div class="flex items-center gap-2">
                <span class="font-bebas text-[19px] tracking-wide text-ink leading-none">AGENDA HARI INI</span>
                <span class="text-[10px] uppercase font-bold text-ink-muted bg-surface-container px-1.5 py-0.5 rounded leading-none">{{ formatIndonesianShortDate(todayIso) }}</span>
              </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 bg-manga-red-soft text-manga-red-dark font-bold tracking-wider rounded uppercase">{{ todaySchedule.length }} AKTIVITAS</span>
          </div>

          <div class="flex flex-col gap-2.5 mt-3">
            <p v-if="todaySchedule.length === 0" class="text-xs text-ink-muted py-3 text-center">Belum ada jadwal untuk hari ini.</p>
            <template v-else>
              <div v-for="code in todaySchedule" :key="code" class="p-2.5 rounded-lg bg-surface-container-low border border-ink/15 flex items-center gap-3 shadow-[1px_1px_0px_#171717]">
                <div class="w-10 h-10 rounded flex items-center justify-center font-bebas text-[18px] text-white shrink-0 border border-ink shadow-[1px_1px_0px_#171717]" :style="{ backgroundColor: getActivity(code)?.backgroundColor, color: getActivity(code)?.textColor }">{{ code }}</div>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-[13px] font-bold text-ink tracking-wide uppercase leading-tight truncate">{{ getActivity(code)?.name || code }}</span>
                </div>
              </div>
            </template>
          </div>

          <div class="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-center">
            <button type="button" @click="navigateTab('jadwal')" class="text-[11px] text-ink font-bold uppercase tracking-wider flex items-center gap-1 hover:text-primary transition-colors py-1.5 px-3 rounded-lg bg-paper hover:bg-surface-container border border-ink/20 shadow-[1px_1px_0px_#171717] cursor-pointer">
              <span>LIHAT SEMUA JADWAL</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
