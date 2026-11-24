<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, Calendar, Check, Clock, Flag, GraduationCap, Hourglass, Save } from '@lucide/vue'
import { useApp } from '~/composables/useApp'
import { SUBTEST_ORDER } from '~/utils/subtests.js'

const { settings, activityTypes, updateSettings, goBackToTab } = useApp()
const draft = ref({ ...settings.value, focusSubtests: [...settings.value.focusSubtests] })
const availableSubtests = computed(() =>
  activityTypes.value.filter((activity) => SUBTEST_ORDER.includes(activity.code)),
)

function toggleFocusSubtest(code) {
  const focusSubtests = draft.value.focusSubtests.includes(code)
    ? draft.value.focusSubtests.filter((item) => item !== code)
    : [...draft.value.focusSubtests, code]
  draft.value = { ...draft.value, focusSubtests }
}

async function handleSave() {
  if (await updateSettings(draft.value)) goBackToTab()
}
</script>

<template>
  <div class="flex flex-col w-full max-w-3xl mx-auto pb-8">
    <div class="w-full bg-surface p-4 rounded-xl border-2 border-ink manga-shadow mb-5 relative overflow-hidden">
      <div class="absolute inset-0 manga-dots opacity-15 pointer-events-none" />
      <div class="relative z-10 flex flex-col gap-2">
        <button type="button" aria-label="Kembali" @click="goBackToTab" class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container border border-ink text-ink manga-shadow-sm cursor-pointer">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="mt-1">
          <h1 class="font-bebas text-[40px] uppercase text-ink tracking-tight leading-none">PENGATURAN</h1>
          <p class="text-xs text-ink-muted mt-1">Preferensi akademik tersimpan di database.</p>
        </div>
      </div>
    </div>

    <form class="flex flex-col gap-5" @submit.prevent="handleSave">
      <section class="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-4">
        <div class="flex items-center gap-2 pb-2 border-b border-ink/10">
          <span class="w-2 h-4 bg-primary rounded-full" />
          <h2 class="font-condensed text-[22px] font-bold uppercase text-ink">TARGET AKADEMIK</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-ink uppercase">
            Tanggal UTBK
            <span class="relative flex items-center">
              <Calendar class="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
              <input v-model="draft.targetDate" type="date" required class="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20">
            </span>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-ink uppercase">
            Target skor
            <span class="relative flex items-center">
              <Flag class="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
              <input v-model.number="draft.targetScore" type="number" min="100" max="1000" required class="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20">
            </span>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-ink uppercase">
            Perguruan tinggi
            <span class="relative flex items-center">
              <GraduationCap class="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
              <input v-model.trim="draft.targetUniversity" type="text" required class="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20">
            </span>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-ink uppercase">
            Program studi
            <input v-model.trim="draft.targetMajor" type="text" required class="w-full bg-surface-container text-ink text-sm px-3 py-2.5 rounded-lg border border-ink/20">
          </label>
        </div>
      </section>

      <section class="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-4">
        <div class="flex items-center gap-2 pb-2 border-b border-ink/10">
          <span class="w-2 h-4 bg-primary rounded-full" />
          <h2 class="font-condensed text-[22px] font-bold uppercase text-ink">PREFERENSI BELAJAR</h2>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-ink uppercase">Fokus subtes</span>
            <span class="text-xs text-ink-muted">Pilih prioritas</span>
          </div>
          <div v-if="availableSubtests.length" class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              v-for="activity in availableSubtests"
              :key="activity.code"
              type="button"
              :class="draft.focusSubtests.includes(activity.code) ? 'bg-primary text-on-primary border-ink manga-shadow-sm' : 'bg-surface-container text-ink border-ink/15'"
              class="relative min-h-16 p-2 rounded-lg flex flex-col items-center justify-center gap-1 border cursor-pointer"
              @click="toggleFocusSubtest(activity.code)"
            >
              <span class="font-bold text-sm">{{ activity.code }}</span>
              <span class="text-[10px] text-center">{{ activity.name }}</span>
              <Check v-if="draft.focusSubtests.includes(activity.code)" class="w-3.5 h-3.5 absolute top-1 right-1" />
            </button>
          </div>
          <p v-else class="text-sm text-ink-muted">Daftar subtes belum tersedia.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-ink uppercase">
            Target belajar harian (menit)
            <span class="relative flex items-center">
              <Clock class="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
              <input v-model.number="draft.dailyTargetMinutes" type="number" min="1" required class="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20">
            </span>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-ink uppercase">
            Durasi sesi pilihan (menit)
            <span class="relative flex items-center">
              <Hourglass class="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
              <input v-model.number="draft.pomodoroMinutes" type="number" min="1" required class="w-full bg-surface-container text-ink text-sm pl-9 pr-3 py-2.5 rounded-lg border border-ink/20">
            </span>
          </label>
        </div>
        <p v-if="settings.timezone" class="text-xs text-ink-muted">Zona waktu: {{ settings.timezone }}</p>
      </section>

      <div class="flex items-center gap-3">
        <button type="button" @click="goBackToTab" class="w-28 py-3 rounded-lg bg-surface-container text-ink font-condensed text-base font-bold border-2 border-ink manga-shadow-sm">
          BATAL
        </button>
        <button type="submit" class="flex-1 py-3 rounded-lg bg-primary text-on-primary font-condensed text-base font-bold border-2 border-ink manga-shadow flex items-center justify-center gap-2">
          <Save class="w-5 h-5" />
          SIMPAN PERUBAHAN
        </button>
      </div>
    </form>
  </div>
</template>
