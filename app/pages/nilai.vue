<script setup>
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
} from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from '#imports'
import { useApp } from '~/composables/useApp'
import { formatIndonesianShortDate, formatIndonesianTitleDate } from '~/utils/dateUtils.js'
import { SUBTEST_ORDER } from '~/utils/subtests.js'

const {
  tryouts,
  platforms,
  settings,
  openTryoutForm,
  navigateTab,
  getActivity,
} = useApp()
const route = useRoute()

const selectedPlatform = ref('ALL')
const selectedSubtest = ref('AVG')
const activePointId = ref(null)
const getScoreValue = (tryout) =>
  selectedSubtest.value === 'AVG'
    ? tryout.averageScore
    : tryout.scores[selectedSubtest.value]

const filteredTryouts = computed(() =>
  [...tryouts.value]
    .filter((tryout) => selectedPlatform.value === 'ALL' || tryout.applicationId === selectedPlatform.value)
    .filter((tryout) => getScoreValue(tryout) !== null)
    .sort((a, b) => a.date.localeCompare(b.date)),
)
const latest = computed(() => filteredTryouts.value[filteredTryouts.value.length - 1])
const prev = computed(() => filteredTryouts.value[filteredTryouts.value.length - 2])
const latestScore = computed(() => (latest.value ? getScoreValue(latest.value) : null))
const highestScore = computed(() =>
  filteredTryouts.value.length
    ? Math.max(...filteredTryouts.value.map((tryout) => getScoreValue(tryout)))
    : null,
)
const delta = computed(() =>
  latest.value && prev.value ? getScoreValue(latest.value) - getScoreValue(prev.value) : null,
)
const trend = computed(() => {
  if (delta.value > 0) {
    return {
      label: 'Kenaikan',
      cardClass: 'bg-tertiary-fixed border-tertiary/30',
      labelClass: 'text-on-tertiary-fixed',
      valueClass: 'text-tertiary',
    }
  }
  if (delta.value === null) {
    return {
      label: 'Belum ada pembanding',
      cardClass: 'bg-amber-muted/20 border-amber-muted/40',
      labelClass: 'text-ink',
      valueClass: 'text-ink',
    }
  }
  if (delta.value < 0) {
    return {
      label: 'Penurunan',
      cardClass: 'bg-error-container border-error/30',
      labelClass: 'text-on-error-container',
      valueClass: 'text-error',
    }
  }
  return {
    label: 'Stabil',
    cardClass: 'bg-amber-muted/20 border-amber-muted/40',
    labelClass: 'text-ink',
    valueClass: 'text-ink',
  }
})
const uniqueDates = computed(() =>
  Array.from(new Set(filteredTryouts.value.map((tryout) => tryout.date))).sort(),
)
const minX = 48
const maxX = 318
const xStep = computed(() =>
  uniqueDates.value.length > 1 ? (maxX - minX) / (uniqueDates.value.length - 1) : 0,
)
const yFromScore = (score) => {
  const clamped = Math.max(250, Math.min(950, score))
  return 190 - ((clamped - 250) / 700) * 160
}
const visiblePlatforms = computed(() =>
  platforms.value.filter(
    (platform) => selectedPlatform.value === 'ALL' || platform.id === selectedPlatform.value,
  ),
)
const activeRecord = computed(
  () =>
    (activePointId.value &&
      filteredTryouts.value.find((tryout) => tryout.id === activePointId.value)) ||
    latest.value,
)
const activePlatform = computed(() =>
  activeRecord.value
    ? platforms.value.find((platform) => platform.id === activeRecord.value.applicationId)
    : undefined,
)
const recentDescending = computed(() => [...filteredTryouts.value].reverse().slice(0, 5))
const axisValues = [900, 700, 500, 300]

const recordsForPlatform = (platformId) =>
  filteredTryouts.value.filter((tryout) => tryout.applicationId === platformId)
const xForDate = (date) => {
  const index = uniqueDates.value.indexOf(date)
  return uniqueDates.value.length === 1 ? 180 : minX + index * xStep.value
}
const pointsForPlatform = (platformId) =>
  recordsForPlatform(platformId)
    .map((record) => `${xForDate(record.date)},${yFromScore(getScoreValue(record))}`)
    .join(' ')
</script>

<template>
  <div v-show="route.path === '/nilai'" class="flex flex-col gap-5 pb-4">
    <!-- Header Banner & Action CTA -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-3">
      <div class="flex flex-col">
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-[10px] w-fit uppercase font-bold tracking-wider mb-1 border border-primary/20">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>ANALISIS TRYOUT</span>
        </div>
        <h1 class="font-bebas text-[38px] uppercase text-ink tracking-tight leading-none">ANALISIS SKOR</h1>
        <p class="text-xs text-ink-muted mt-1">Evaluasi Capaian 7 Subtes UTBK &amp; Trajektori Multi-Platform</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden sm:flex bg-surface px-3 py-2 rounded-lg border-2 border-ink manga-shadow-sm text-ink text-xs font-bold uppercase tracking-wider">
          TARGET: {{ settings.targetScore ?? '—' }}+
        </div>
        <button type="button" @click="openTryoutForm()" class="w-full md:w-auto px-5 h-11 bg-primary hover:bg-manga-red-dark active:translate-x-0.5 active:translate-y-0.5 transition-all text-on-primary rounded-lg border-2 border-ink manga-shadow flex items-center justify-center gap-2 cursor-pointer">
          <PlusCircle class="w-5 h-5" />
          <span class="font-bebas text-[20px] leading-none tracking-wide uppercase">+ TAMBAH NILAI</span>
        </button>
      </div>
    </div>

    <!-- Metric Highlights Summary -->
    <div v-if="filteredTryouts.length" class="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow relative overflow-hidden">
      <div class="absolute -right-6 -bottom-6 w-28 h-28 manga-dots opacity-15 pointer-events-none rounded-full" />
      <div class="flex items-center justify-between pb-2.5 mb-3 bg-surface-container-low px-2.5 py-1.5 rounded-lg border border-ink/10">
        <div class="flex items-center gap-1.5">
          <Award class="w-4.5 h-4.5 text-primary" />
          <span class="text-xs uppercase tracking-wider text-ink font-bold">
            Ringkasan Tren {{ selectedSubtest === 'AVG' ? 'Keseluruhan' : `Subtes ${selectedSubtest}` }}
          </span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase">
          {{ settings.targetScore !== null && latestScore !== null && latestScore >= settings.targetScore ? 'Target tercapai' : 'Progres skor' }}
        </span>
      </div>

      <div class="grid grid-cols-3 gap-2.5 relative z-10 text-center">
        <div class="flex flex-col items-center justify-center p-2.5 rounded-lg bg-surface-container-lowest border border-ink/15 shadow-[1.5px_1.5px_0px_#171717]">
          <span class="text-[10px] text-ink-muted uppercase font-bold">Skor Terakhir</span>
          <div class="flex items-baseline justify-center gap-1 mt-1">
            <span class="font-bebas text-[34px] leading-none text-ink tabular-nums">{{ latestScore ?? '—' }}</span>
            <span class="text-[10px] text-ink-muted font-bold">pts</span>
          </div>
          <span class="text-[10px] text-ink-muted font-bold mt-1">{{ latest?.date }}</span>
        </div>

        <div class="flex flex-col items-center justify-center p-2.5 rounded-lg bg-primary-fixed border border-primary/30 shadow-[1.5px_1.5px_0px_#171717]">
          <span class="text-[10px] text-on-primary-fixed-variant uppercase font-bold">Tertinggi</span>
          <div class="flex items-baseline justify-center gap-1 mt-1">
            <span class="font-bebas text-[34px] leading-none text-primary tabular-nums">{{ highestScore ?? '—' }}</span>
            <span class="text-[10px] text-on-primary-fixed-variant font-bold">pts</span>
          </div>
          <span class="text-[10px] text-primary font-bold mt-1">Rekor Pribadi</span>
        </div>

        <div class="flex flex-col items-center justify-center p-2.5 rounded-lg border shadow-[1.5px_1.5px_0px_#171717]" :class="trend.cardClass">
          <span class="text-[10px] font-bold uppercase" :class="trend.labelClass">{{ trend.label }}</span>
          <div class="flex items-baseline justify-center gap-1 mt-1">
            <span class="font-bebas text-[34px] leading-none tabular-nums" :class="trend.valueClass">{{ delta === null ? '—' : delta >= 0 ? `+${delta}` : delta }}</span>
            <span v-if="delta !== null" class="text-[10px] font-bold" :class="trend.valueClass">pts</span>
          </div>
          <span v-if="delta !== null" class="text-[10px] font-bold mt-1" :class="trend.valueClass">vs Sesi Lalu</span>
        </div>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1.5">
          <Filter class="w-3.5 h-3.5" />
          <span>Platform Penyedia</span>
        </span>
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button type="button" @click="selectedPlatform = 'ALL'" class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold border border-ink cursor-pointer transition-colors" :class="selectedPlatform === 'ALL' ? 'bg-ink text-surface manga-shadow-sm' : 'bg-surface text-ink hover:bg-surface-container'">
            SEMUA
          </button>
          <button v-for="pf in platforms" :key="pf.id" type="button" @click="selectedPlatform = pf.id" class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider font-bold border border-ink flex items-center gap-1.5 cursor-pointer transition-colors" :class="selectedPlatform === pf.id ? 'bg-ink text-surface manga-shadow-sm' : 'bg-surface text-ink hover:bg-surface-container'">
            <span class="w-2.5 h-2.5 rounded-full inline-block border border-ink/30" :style="{ backgroundColor: pf.colorHex }" />
            <span>{{ pf.name }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] uppercase tracking-wider text-ink-muted font-bold flex items-center gap-1.5">
          <SlidersHorizontal class="w-3.5 h-3.5" />
          <span>Fokus Subtes</span>
        </span>
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button type="button" @click="selectedSubtest = 'AVG'" class="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] uppercase font-bold border border-ink cursor-pointer" :class="selectedSubtest === 'AVG' ? 'bg-primary text-on-primary manga-shadow-sm' : 'bg-surface text-ink hover:bg-surface-container'">
            KESELURUHAN
          </button>
          <button v-for="code in SUBTEST_ORDER" :key="code" type="button" @click="selectedSubtest = code" class="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] uppercase font-bold border flex items-center gap-1 cursor-pointer" :class="selectedSubtest === code ? 'bg-primary text-on-primary border-ink manga-shadow-sm' : settings.focusSubtests.includes(code) ? 'bg-manga-red-soft text-manga-red-dark border-primary/40' : 'bg-surface text-ink border-ink/30 hover:bg-surface-container'">
            <span>{{ code }}</span>
            <Check v-if="settings.focusSubtests.includes(code)" class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <EmptyStateCard
      v-if="filteredTryouts.length === 0"
      :title="tryouts.length ? 'Belum Ada Skor untuk Filter Ini' : 'Belum Ada Hasil Tryout'"
      :description="tryouts.length ? 'Tidak ada hasil dengan skor untuk subtes dan aplikasi yang dipilih.' : 'Catat hasil tryout untuk mulai melihat perkembangan skor.'"
      cta-label="+ Tambah Nilai Tryout"
      bubble-text="MULAI!"
      :on-cta="() => openTryoutForm()"
    />

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- LEFT: Multi-Series LINE CHART -->
      <div class="lg:col-span-7 bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <LineChartIcon class="w-5 h-5 text-ink" />
              <span class="font-bebas text-[22px] tracking-wide uppercase text-ink leading-none">TRAJEKTORI SKOR</span>
            </div>
            <span class="text-[10px] text-primary bg-primary-fixed px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-primary/20">{{ filteredTryouts.length }} SESI</span>
          </div>

          <!-- Legend -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div v-for="pf in visiblePlatforms" :key="pf.id" class="flex items-center gap-1.5">
              <span class="w-3.5 h-1.5 rounded-full" :style="{ backgroundColor: pf.colorHex }" />
              <span class="text-[11px] font-bold text-ink">{{ pf.name }}</span>
            </div>
          </div>
        </div>

        <!-- Active Point Tooltip Callout -->
        <div v-if="activeRecord" class="bg-surface-container-low text-ink px-3 py-1.5 rounded-lg border border-ink/20 flex items-center justify-between gap-2 max-w-70 ml-auto">
          <div class="flex items-center gap-1.5 truncate">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: activePlatform?.colorHex }" />
            <span class="text-xs font-bold text-ink truncate">{{ activePlatform?.name || 'Aplikasi tidak tersedia' }} • {{ formatIndonesianShortDate(activeRecord.date) }}</span>
          </div>
          <div class="text-right shrink-0 flex items-baseline gap-1">
            <span class="font-bebas text-xl text-primary leading-none tabular-nums">{{ getScoreValue(activeRecord) }}</span>
            <span class="text-[10px] text-ink-muted font-semibold">pts</span>
          </div>
        </div>

        <!-- Interactive SVG Chart -->
        <div class="w-full relative select-none">
          <svg class="w-full h-auto overflow-visible" viewBox="0 0 350 220">
            <defs>
              <pattern id="grid-dots-nilai" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#171717" opacity="0.1" />
              </pattern>
            </defs>
            <rect x="34" y="20" width="298" height="175" rx="2" fill="url(#grid-dots-nilai)" />

            <!-- Y Axis Reference Lines -->
            <g v-for="val in axisValues" :key="val">
              <line :x1="34" :x2="332" :y1="yFromScore(val)" :y2="yFromScore(val)" stroke="#171717" stroke-width="1" stroke-dasharray="2,3" opacity="0.2" />
              <text x="28" :y="yFromScore(val) + 3" font-size="9" font-weight="700" fill="#6F6A66" text-anchor="end">{{ val }}</text>
            </g>

            <!-- Target Label Badge -->
            <template v-if="settings.targetScore !== null">
              <rect x="258" :y="yFromScore(settings.targetScore) - 12" width="74" height="14" rx="2" fill="#ffdad8" />
              <text x="295" :y="yFromScore(settings.targetScore) - 2" font-size="8.5" font-weight="800" fill="#ad2933" text-anchor="middle">
                TARGET {{ settings.targetScore }}
              </text>
            </template>

            <!-- X Axis baseline -->
            <line x1="34" x2="332" y1="195" y2="195" stroke="#171717" stroke-width="1.5" />

            <!-- Vertical date guidelines + X labels -->
            <g v-for="(date, idx) in uniqueDates" :key="date">
              <line :x1="xForDate(date)" :x2="xForDate(date)" y1="20" y2="195" stroke="#171717" stroke-dasharray="1,4" stroke-width="0.8" opacity="0.18" />
              <text :x="xForDate(date)" y="211" font-size="8.5" :font-weight="idx === uniqueDates.length - 1 ? '800' : '700'" :fill="idx === uniqueDates.length - 1 ? '#ad2933' : '#171717'" text-anchor="middle">
                {{ formatIndonesianShortDate(date) }}
              </text>
            </g>

            <!-- Platform Polylines & Interactive Dots -->
            <g v-for="pf in visiblePlatforms" :key="pf.id">
              <template v-if="recordsForPlatform(pf.id).length > 0">
                <polyline v-if="recordsForPlatform(pf.id).length > 1" fill="none" :points="pointsForPlatform(pf.id)" :stroke="pf.colorHex" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <g v-for="record in recordsForPlatform(pf.id)" :key="record.id" class="cursor-pointer" @click="activePointId = record.id">
                  <circle v-if="activeRecord?.id === record.id" :cx="xForDate(record.date)" :cy="yFromScore(getScoreValue(record))" r="7.5" fill="none" :stroke="pf.colorHex" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.8" />
                  <circle :cx="xForDate(record.date)" :cy="yFromScore(getScoreValue(record))" :r="activeRecord?.id === record.id ? 5 : 4" :fill="activeRecord?.id === record.id ? pf.colorHex : '#FFFEFC'" :stroke="activeRecord?.id === record.id ? '#FFFEFC' : pf.colorHex" stroke-width="2.2" />
                </g>
              </template>
            </g>
          </svg>
        </div>

        <div class="bg-surface-container-low rounded-lg p-2.5 flex items-center gap-2 border border-ink/10">
          <Quote class="w-4 h-4 text-primary shrink-0" />
          <p class="text-xs text-ink leading-tight">
            <strong class="text-primary font-bold">一歩ずつ、前へ。</strong>
          </p>
        </div>
      </div>

      <!-- RIGHT: Recent Tryout List + Motivation -->
      <div class="lg:col-span-5 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <History class="w-4 h-4 text-ink" />
            <h2 class="font-bebas text-[20px] uppercase text-ink leading-none tracking-wide">RIWAYAT TRYOUT TERAKHIR</h2>
          </div>
          <button type="button" @click="navigateTab('data')" class="text-[11px] text-primary uppercase font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
            <span>Lihat Semua ({{ tryouts.length }})</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="flex flex-col gap-2.5">
          <button v-for="(item, idx) in recentDescending" :key="item.id" type="button" @click="openTryoutForm(item.id)" class="w-full text-left bg-surface rounded-xl p-3 border-2 border-ink manga-shadow-sm flex items-center justify-between gap-2 hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-lg border border-ink flex items-center justify-center shrink-0 text-white font-bebas text-lg" :style="{ backgroundColor: item.applicationColor }">
                {{ item.applicationName?.slice(0, 2).toUpperCase() || '—' }}
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5 truncate">
                  <span class="text-sm font-bold text-ink truncate">{{ item.title }}</span>
                </div>
                <span class="text-[11px] text-ink-muted mt-0.5">
                  {{ item.applicationName || 'Aplikasi tidak tersedia' }} · {{ formatIndonesianTitleDate(item.date) }}
                </span>
              </div>
            </div>

            <div class="flex flex-col items-end shrink-0">
              <div class="flex items-center gap-1.5">
                <div class="px-2 py-0.5 rounded font-bebas text-[22px] leading-none font-bold tabular-nums" :class="idx === 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-ink'">
                  {{ getScoreValue(item) }}
                </div>
              </div>
              <span v-if="recentDescending[idx + 1]" class="text-[10px] font-bold mt-1 tabular-nums" :class="getScoreValue(item) - getScoreValue(recentDescending[idx + 1]) >= 0 ? 'text-tertiary' : 'text-error'">
                {{ getScoreValue(item) - getScoreValue(recentDescending[idx + 1]) >= 0 ? `+${getScoreValue(item) - getScoreValue(recentDescending[idx + 1])}` : getScoreValue(item) - getScoreValue(recentDescending[idx + 1]) }} pts
              </span>
            </div>
          </button>
        </div>

        <!-- Bottom Insight Card -->
        <div class="bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow-sm flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-manga-red-soft border border-primary/30 flex items-center justify-center shrink-0 text-manga-red-dark">
            <Sparkles class="w-5 h-5" />
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="font-bebas text-[18px] uppercase text-ink leading-none">PESAN HARI INI</span>
              <span class="px-1.5 py-0.2 rounded bg-manga-red-soft text-manga-red-dark text-[9px] font-bold uppercase tracking-wider">MOTIVASI</span>
            </div>
            <p class="text-xs text-ink-muted leading-relaxed">
              <strong class="text-primary font-bold">一歩ずつ、前へ。</strong> Konsistensi kecil hari ini adalah lompatan besar menuju kampus impian.
              <strong class="text-ink">Keep moving forward!</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <NuxtPage />
</template>
