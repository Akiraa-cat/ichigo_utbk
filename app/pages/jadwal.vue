<script setup>
import { computed, ref } from 'vue'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Megaphone,
  PlusCircle,
  Save,
  Target,
  X,
  Zap,
} from '@lucide/vue'
import { useApp } from '~/composables/useApp'
import { SUBTEST_ORDER } from '~/utils/subtests.js'
import {
  buildMonthGrid,
  formatIndonesianSheetDate,
  formatMonthYearUpper,
  getTodayIso,
} from '~/utils/dateUtils.js'

const { schedules, activityTypes, settings, saveDaySchedule, getActivity } = useApp()
const todayIso = getTodayIso(settings.value.timezone || undefined)
const initialYear = Number(todayIso.slice(0, 4))
const initialMonth = Number(todayIso.slice(5, 7)) - 1
const viewYear = ref(initialYear)
const viewMonth = ref(initialMonth)
const selectedIso = ref(todayIso)
const sheetOpen = ref(false)
const draftActivities = ref([])
const savingSchedule = ref(false)

const cells = computed(() => buildMonthGrid(viewYear.value, viewMonth.value))
const selectedActivities = computed(() => schedules.value[selectedIso.value]?.activities ?? [])
const subtestActivities = computed(() =>
  activityTypes.value.filter((activity) => SUBTEST_ORDER.includes(activity.code)),
)
const otherActivities = computed(() =>
  activityTypes.value.filter((activity) => !SUBTEST_ORDER.includes(activity.code)),
)
const legendActivities = computed(() => activityTypes.value)
const monthPrefix = computed(
  () => `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}`,
)
const scheduledCountMonth = computed(() =>
  Object.entries(schedules.value)
    .filter(([date]) => date.startsWith(monthPrefix.value))
    .reduce((sum, [, schedule]) => sum + schedule.activities.length, 0),
)

function openScheduleEditor(iso) {
  selectedIso.value = iso
  draftActivities.value = [...(schedules.value[iso]?.activities ?? [])]
  sheetOpen.value = true
}

function toggleDraftActivity(code) {
  draftActivities.value = draftActivities.value.includes(code)
    ? draftActivities.value.filter((activity) => activity !== code)
    : [...draftActivities.value, code]
}

async function handleSaveSchedule() {
  if (savingSchedule.value) return
  savingSchedule.value = true
  try {
    if (await saveDaySchedule(selectedIso.value, draftActivities.value)) {
      sheetOpen.value = false
    }
  } finally {
    savingSchedule.value = false
  }
}

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
</script>

<template>
  <div class="flex flex-col gap-4 pb-4">
    <!-- Top Manga Announcement & Legend -->
    <section class="relative bg-surface rounded-xl p-3.5 border-2 border-ink manga-shadow overflow-hidden">
      <div class="absolute -right-6 -bottom-6 w-24 h-24 manga-dots opacity-15 pointer-events-none rounded-full" />
      <div class="flex items-start justify-between gap-2 relative z-10">
        <div class="space-y-1 flex-1 min-w-0">
          <div class="inline-flex items-center gap-1.5 bg-paper px-2 py-0.5 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
            <Zap class="w-3.5 h-3.5 text-primary" />
            <span class="font-condensed text-xs uppercase tracking-wider text-ink font-bold leading-none">
              JADWAL BELAJAR
            </span>
          </div>
          <h2 class="font-condensed text-lg uppercase text-ink tracking-wide leading-tight font-bold">
            “一歩ずつ、前へ。”
          </h2>
          <p class="text-xs text-ink-muted leading-tight">
            Jadwal yang tersimpan di database.
          </p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-manga-red-soft border-2 border-ink flex items-center justify-center shrink-0 manga-shadow-sm">
          <Calendar class="w-5 h-5 text-manga-red-dark" />
        </div>
      </div>

      <!-- Activity Legend -->
      <div class="mt-3 pt-2.5 border-t border-dashed border-ink flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span class="text-[10px] uppercase font-bold text-ink-muted shrink-0 mr-1">AKTIVITAS:</span>
        <span
          v-for="activity in legendActivities"
          :key="activity.code"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-condensed uppercase font-bold border border-ink shrink-0"
          :style="{ backgroundColor: activity.backgroundColor, color: activity.textColor }"
        >
          <span
            class="w-2 h-2 rounded-full border border-ink"
            :style="{ backgroundColor: activity.backgroundColor }"
          />
          <span>{{ activity.name }}</span>
        </span>
      </div>
    </section>

    <!-- Month Navigation Header -->
    <section class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <h2 class="font-condensed text-[26px] uppercase text-ink tracking-tight font-extrabold leading-none">
          {{ formatMonthYearUpper(viewYear, viewMonth) }}
        </h2>
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-on-primary font-condensed tracking-wider leading-none border border-ink">
          {{ scheduledCountMonth || 'BELUM ADA JADWAL' }}
        </span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          class="w-8 h-8 rounded bg-surface border border-ink flex items-center justify-center text-ink manga-shadow-sm hover:bg-surface-container cursor-pointer"
          @click="handlePrevMonth"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          class="w-8 h-8 rounded bg-surface border border-ink flex items-center justify-center text-ink manga-shadow-sm hover:bg-surface-container cursor-pointer"
          @click="handleNextMonth"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </section>

    <!-- Main Responsive Split: Calendar Matrix + Selected Day Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- 7-Column Manga Calendar Matrix -->
      <section class="lg:col-span-7 bg-surface rounded-xl p-2.5 md:p-3.5 border-2 border-ink manga-shadow overflow-hidden">
        <div class="grid grid-cols-7 gap-1 pb-2 mb-2 text-center border-b-2 border-ink">
          <div
            v-for="(dayName, idx) in ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN']"
            :key="dayName"
            class="font-condensed text-xs uppercase font-bold tracking-wider"
            :class="idx >= 5 ? 'text-primary' : 'text-ink'"
          >
            {{ dayName }}
          </div>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <template v-for="(cell, idx) in cells" :key="cell.iso">
            <div
              v-if="!cell.inMonth"
              class="min-h-14.5 p-1 bg-paper/60 rounded border border-ink/20 flex flex-col justify-between opacity-45"
            >
              <span class="font-condensed text-[10px] text-ink-muted">{{ cell.day }}</span>
            </div>
            <button
              v-else
              type="button"
              class="min-h-14.5 p-1 rounded flex flex-col justify-between text-left relative transition-all cursor-pointer"
              :class="selectedIso === cell.iso
                ? 'bg-[#FFF9E6] border-[2.5px] border-ink ring-1 ring-primary manga-shadow-sm z-10'
                : schedules[cell.iso]?.activities?.includes('TO')
                  ? 'bg-manga-red-soft/40 border border-ink hover:bg-manga-red-soft/70'
                  : 'bg-paper border border-ink hover:bg-surface-container'"
              @click="selectedIso = cell.iso"
              @dblclick="openScheduleEditor(cell.iso)"
            >
              <div
                v-if="selectedIso === cell.iso"
                class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary rounded-full border border-ink flex items-center justify-center text-[7px] text-on-primary font-bold"
              >
                ★
              </div>
              <span
                class="font-condensed text-[11px] font-bold leading-none"
                :class="selectedIso === cell.iso || idx % 7 >= 5 ? 'text-primary font-black' : 'text-ink'"
              >
                {{ cell.day }}
              </span>
              <div class="flex flex-col gap-0.5 mt-1 w-full">
                <span
                  v-for="code in (schedules[cell.iso]?.activities ?? []).slice(0, 3)"
                  :key="code"
                  class="text-[8px] font-condensed font-bold px-0.5 text-center rounded border border-ink leading-tight truncate"
                  :style="{
                    backgroundColor: getActivity(code)?.backgroundColor,
                    color: getActivity(code)?.textColor,
                  }"
                >
                  {{ code }}
                </span>
                <span
                  v-if="(schedules[cell.iso]?.activities?.length ?? 0) > 3"
                  class="text-[8px] font-bold text-ink-muted text-center"
                >
                  +{{ schedules[cell.iso].activities.length - 3 }}
                </span>
              </div>
            </button>
          </template>
        </div>
      </section>

      <!-- RIGHT: Selected Date Detailed Plan Panel + Footer Stamp -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <section class="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow relative overflow-hidden">
          <div class="absolute -right-12 -top-12 w-28 h-28 manga-dots opacity-15 pointer-events-none rounded-full" />
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-ink relative z-10">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 bg-primary rounded-full shrink-0" />
                <h3 class="font-condensed text-2xl uppercase text-ink font-extrabold tracking-tight leading-none">
                  {{ formatIndonesianSheetDate(selectedIso) }}
                </h3>
              </div>
              <p class="text-[10px] text-ink-muted uppercase font-bold mt-1 leading-none">
                {{ selectedActivities.length }} AKTIVITAS TERJADWAL
              </p>
            </div>
            <span class="font-condensed text-xs uppercase font-bold px-2 py-0.5 rounded bg-surface-container text-ink border border-ink shrink-0">
              {{ selectedActivities.length }}
            </span>
          </div>

          <div class="flex items-center justify-between mb-2 relative z-10">
            <span class="font-condensed text-xs uppercase font-bold text-ink tracking-wide">
              AKTIVITAS PADA TANGGAL INI
            </span>
          </div>

          <div
            v-if="selectedActivities.length === 0"
            class="p-4 bg-paper rounded-lg border border-dashed border-ink/30 text-center text-xs text-ink-muted"
          >
            Belum ada jadwal untuk tanggal ini.
          </div>
          <div v-else class="space-y-2 relative z-10">
            <div
              v-for="code in selectedActivities"
              :key="code"
              class="p-2.5 rounded-lg bg-paper border-2 border-ink flex items-center justify-between manga-shadow-sm"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="w-11 h-10 rounded shrink-0 border border-ink flex flex-col items-center justify-center shadow-[1px_1px_0px_#171717]"
                  :style="{
                    backgroundColor: getActivity(code)?.backgroundColor,
                    color: getActivity(code)?.textColor,
                  }"
                >
                  <span class="font-condensed text-base leading-none font-extrabold">
                    {{ code }}
                  </span>
                </div>
                <div class="min-w-0">
                  <h4 class="font-condensed text-sm uppercase font-bold text-ink leading-tight truncate">
                    {{ getActivity(code)?.name || code }}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-dashed border-ink relative z-10">
            <button
              type="button"
              class="w-full h-11 bg-primary text-on-primary rounded-lg border-2 border-ink flex items-center justify-center gap-1.5 font-condensed text-base uppercase font-bold tracking-wide manga-shadow active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
              @click="openScheduleEditor(selectedIso)"
            >
              <PlusCircle class="w-5 h-5" />
              <span>+ TAMBAH / ATUR JADWAL</span>
            </button>
          </div>
        </section>

        <section class="p-3 bg-surface rounded-lg border-2 border-ink manga-shadow-sm flex items-center gap-2.5">
          <div class="px-2 py-1 bg-ink text-surface font-condensed text-sm uppercase font-black tracking-widest rounded -rotate-2 shrink-0 leading-none">
            GANBATTE!
          </div>
          <p class="font-condensed text-sm uppercase text-ink font-bold leading-tight">
            Try Again, Fail Again, Fail Better.
          </p>
        </section>
      </div>
    </div>

    <!-- MANGA MULTI-SELECT SCHEDULE BOTTOM SHEET -->
    <div
      v-if="sheetOpen"
      class="fixed inset-0 z-50 bg-ink/55 backdrop-blur-[2px] flex flex-col justify-end md:items-center md:justify-center md:p-4"
      @click="sheetOpen = false"
    >
      <div
        class="relative w-full md:max-w-lg bg-paper rounded-t-2xl md:rounded-2xl border-t-2 md:border-2 border-ink shadow-[0_-6px_0px_0px_#171717] pt-3 max-h-[86vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
        @click.stop
      >
        <div class="w-12 h-1.5 bg-ink rounded-full mx-auto mb-2 opacity-80 md:hidden" />

        <!-- Sheet Header -->
        <div class="px-4 pb-3 border-b-2 border-ink bg-surface flex flex-col gap-2">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <h2 class="font-bebas text-[28px] text-ink tracking-tight uppercase leading-none">
                  ATUR JADWAL
                </h2>
                <span class="px-2 py-0.5 bg-manga-red-soft text-primary text-[10px] uppercase tracking-wider rounded font-bold">
                  JADWAL
                </span>
              </div>
              <div class="flex items-center gap-1.5 mt-1">
                <Calendar class="w-4 h-4 text-primary" />
                <span class="text-xs uppercase tracking-wider text-ink font-bold">
                  {{ formatIndonesianSheetDate(selectedIso) }}
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Tutup bottom sheet"
              class="w-8 h-8 rounded-full bg-paper hover:bg-surface-container border border-ink manga-shadow-sm flex items-center justify-center text-ink cursor-pointer"
              @click="sheetOpen = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="self-start bg-paper px-3 py-1.5 rounded-lg border border-ink manga-shadow-sm flex items-center gap-1.5">
            <Megaphone class="w-4 h-4 text-primary" />
            <span class="text-xs text-ink font-bold">Rencanakan aktivitas belajarmu hari ini!</span>
          </div>
        </div>

        <!-- Scrollable Tiles -->
        <div class="overflow-y-auto px-4 py-3 flex-1 flex flex-col gap-4">
          <!-- Subtes UTBK -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] uppercase tracking-wider text-ink font-bold">SUBTES</span>
              <span class="text-[10px] text-ink-muted font-medium">Pilih satu atau lebih</span>
            </div>
            <div class="grid grid-cols-2 gap-2.5 pt-1">
              <button
                v-for="activity in subtestActivities"
                :key="activity.code"
                type="button"
                :style="{
                  backgroundColor: activity.backgroundColor,
                  color: activity.textColor,
                }"
                class="relative text-left p-3 rounded-lg border-2 transition-all active:scale-95 cursor-pointer"
                :class="draftActivities.includes(activity.code)
                  ? 'border-primary manga-shadow ring-1 ring-ink'
                  : 'border-ink opacity-85 hover:opacity-100 manga-shadow-sm'"
                @click="toggleDraftActivity(activity.code)"
              >
                <div
                  v-if="draftActivities.includes(activity.code)"
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-surface flex items-center justify-center border-2 border-surface shadow-sm"
                >
                  <Check class="w-3.5 h-3.5 stroke-3" />
                </div>
                <span class="font-bebas text-[26px] tracking-wider uppercase leading-none block">{{ activity.code }}</span>
                <span class="text-xs font-semibold mt-0.5 line-clamp-1 block">
                  {{ activity.name }}
                </span>
              </button>
            </div>
          </div>

          <!-- Supporting & Recovery Activities -->
          <div class="flex flex-col gap-2">
            <span class="text-[11px] uppercase tracking-wider text-ink font-bold">
              AKTIVITAS PENDUKUNG &amp; RECOVERY
            </span>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                v-for="activity in otherActivities"
                  :key="activity.code"
                type="button"
                :style="{
                    backgroundColor: activity.backgroundColor,
                    color: activity.textColor,
                }"
                class="relative text-left p-3 rounded-lg border-2 transition-all active:scale-95 cursor-pointer"
                  :class="draftActivities.includes(activity.code)
                  ? 'border-primary manga-shadow ring-1 ring-ink'
                  : 'border-ink opacity-85 hover:opacity-100 manga-shadow-sm'"
                  @click="toggleDraftActivity(activity.code)"
              >
                <div
                    v-if="draftActivities.includes(activity.code)"
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-surface flex items-center justify-center border-2 border-surface shadow-sm"
                >
                  <Check class="w-3.5 h-3.5 stroke-3" />
                </div>
                <span class="font-bebas text-[24px] tracking-wider uppercase leading-none block">{{ activity.code }}</span>
                <span class="text-xs font-semibold mt-0.5 line-clamp-1 block">
                  {{ activity.name }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Badges Summary Bar -->
        <div class="px-4 pt-2.5 pb-2 bg-surface border-t-2 border-ink flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] uppercase tracking-wider text-ink font-bold">
                DIPILIH ({{ draftActivities.length }})
              </span>
            </div>
            <button
              type="button"
              class="text-[11px] text-ink-muted hover:text-primary underline font-bold cursor-pointer"
              @click="draftActivities = []"
            >
              Reset Pilihan
            </button>
          </div>
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <template v-if="draftActivities.length === 0">
              <span class="text-xs text-ink-muted italic">Belum ada aktivitas dipilih</span>
            </template>
            <template v-else>
              <button
                v-for="code in draftActivities"
                :key="code"
                type="button"
                :style="{
                  backgroundColor: getActivity(code)?.backgroundColor,
                  color: getActivity(code)?.textColor,
                }"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717] shrink-0 cursor-pointer"
                @click="toggleDraftActivity(code)"
              >
                <span class="font-bebas text-base leading-none">{{ code }}</span>
                <span class="text-[10px] font-semibold">{{ getActivity(code)?.name || code }}</span>
                <X class="w-3 h-3" />
              </button>
            </template>
          </div>
        </div>

        <!-- Sticky Sheet Buttons -->
        <div class="px-4 pt-2 pb-4 flex items-center gap-2.5 bg-surface border-t border-ink/10">
          <button
            type="button"
            class="w-24 h-12 rounded-lg bg-paper text-ink font-bebas text-lg tracking-wider uppercase border-2 border-ink manga-shadow-sm cursor-pointer"
            @click="sheetOpen = false"
          >
            BATAL
          </button>
          <button
            type="button"
            :disabled="savingSchedule"
            class="flex-1 h-12 rounded-lg bg-primary text-surface font-bebas text-lg tracking-wider uppercase border-2 border-ink manga-shadow flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-60"
            @click="handleSaveSchedule"
          >
            <LoaderCircle v-if="savingSchedule" class="w-5 h-5 animate-spin motion-reduce:animate-none" />
            <Save v-else class="w-5 h-5" />
            <span>{{ savingSchedule ? 'MENYIMPAN...' : `SIMPAN JADWAL (${draftActivities.length})` }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
