<script setup>
import { computed, ref } from 'vue'
import { useRoute } from '#imports'
import { AlarmClock, ArrowLeft, Calendar, Check, CheckCircle2, LoaderCircle, Timer } from '@lucide/vue'
import { useApp } from '~/composables/useApp'
import { SUBTEST_ORDER } from '~/utils/subtests.js'
import { getTodayIso } from '~/utils/dateUtils.js'

const route = useRoute()
const { sessions, activityTypes, settings, saveSession, goBackToTab } = useApp()
const initialDate = typeof route.query.date === 'string' ? route.query.date : undefined
const sessionId = typeof route.query.sessionId === 'string' ? route.query.sessionId : undefined
const existing = computed(() => sessions.value.find((session) => session.id === sessionId))
const availableSubtests = computed(() =>
  activityTypes.value.filter((activity) => SUBTEST_ORDER.includes(activity.code)),
)
const date = ref(existing.value?.date ?? initialDate ?? getTodayIso(settings.value.timezone || undefined))
const startTime = ref(existing.value?.startTime ?? '')
const durationMinutes = ref(existing.value?.durationMinutes ?? null)
const selectedSubtests = ref(existing.value?.subtests ?? [])
const notes = ref(existing.value?.notes ?? '')
const saving = ref(false)
const readableDuration = computed(() => {
  if (!durationMinutes.value) return ''
  const hours = Math.floor(durationMinutes.value / 60)
  const remainder = durationMinutes.value % 60
  return `${String(hours).padStart(2, '0')} jam ${String(remainder).padStart(2, '0')} menit`
})

function toggleSubtest(code) {
  selectedSubtests.value = selectedSubtests.value.includes(code)
    ? selectedSubtests.value.filter((item) => item !== code)
    : [...selectedSubtests.value, code]
}

async function handleSubmit() {
  if (saving.value) return
  saving.value = true
  try {
    if (await saveSession({
      id: existing.value?.id,
      date: date.value,
      startTime: startTime.value,
      durationMinutes: Number(durationMinutes.value),
      subtests: selectedSubtests.value,
      notes: notes.value.trim(),
    })) {
      goBackToTab()
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="flex flex-col w-full max-w-2xl mx-auto pb-28" @submit.prevent="handleSubmit">
    <div class="flex items-center gap-2.5 pb-4 pt-1 border-b-2 border-ink">
      <button type="button" aria-label="Kembali" @click="goBackToTab" class="w-10 h-10 flex items-center justify-center bg-surface border-2 border-ink rounded-lg manga-shadow-sm cursor-pointer">
        <ArrowLeft class="w-5 h-5 text-ink" />
      </button>
      <div>
        <h1 class="font-condensed text-[22px] font-bold uppercase text-ink">{{ existing ? 'Edit Sesi Belajar' : 'Catat Sesi Belajar' }}</h1>
        <p class="text-xs text-primary">一歩ずつ、前へ。</p>
      </div>
    </div>

    <section class="mt-5 bg-surface border-2 border-ink rounded-xl p-4 manga-shadow-sm flex flex-col gap-4">
      <h2 class="font-condensed text-[22px] font-bold uppercase text-ink">INFORMASI SESI</h2>
      <label for="study-date" class="text-xs font-bold uppercase text-ink flex items-center gap-1.5">
        <Calendar class="w-4 h-4" />
        Tanggal belajar
      </label>
      <input id="study-date" v-model="date" type="date" required class="h-11 bg-paper border-2 border-ink rounded-lg px-3 text-sm text-ink">

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label for="study-time" class="flex flex-col gap-1.5 text-xs font-bold uppercase text-ink">
          <span class="flex items-center gap-1.5"><AlarmClock class="w-4 h-4" />Waktu mulai</span>
          <input id="study-time" v-model="startTime" type="time" required class="h-11 bg-paper border-2 border-ink rounded-lg px-3 text-sm text-ink">
        </label>
        <label for="study-duration" class="flex flex-col gap-1.5 text-xs font-bold uppercase text-ink">
          <span class="flex items-center gap-1.5"><Timer class="w-4 h-4" />Durasi belajar (menit)</span>
          <input id="study-duration" v-model.number="durationMinutes" type="number" min="1" max="1440" required class="h-11 bg-paper border-2 border-ink rounded-lg px-3 text-sm text-ink">
          <span v-if="readableDuration" class="text-[11px] text-primary">{{ readableDuration }}</span>
        </label>
      </div>
    </section>

    <section class="mt-5 bg-surface border-2 border-ink rounded-xl p-4 manga-shadow-sm flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-condensed text-[22px] font-bold uppercase text-ink">SUBTES YANG DIPELAJARI</h2>
        <span class="text-[10px] text-ink-muted uppercase font-bold">Opsional</span>
      </div>
      <div v-if="availableSubtests.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          v-for="activity in availableSubtests"
          :key="activity.code"
          type="button"
          :style="{ backgroundColor: activity.backgroundColor, color: activity.textColor }"
          :class="selectedSubtests.includes(activity.code) ? 'border-primary manga-shadow' : 'border-ink manga-shadow-sm opacity-85'"
          class="relative text-left p-3 rounded-lg border-2 min-h-20 cursor-pointer"
          @click="toggleSubtest(activity.code)"
        >
          <span class="font-condensed text-xl font-bold">{{ activity.code }}</span>
          <span class="block text-xs font-semibold mt-1">{{ activity.name }}</span>
          <Check v-if="selectedSubtests.includes(activity.code)" class="w-4 h-4 absolute top-2 right-2" />
        </button>
      </div>
      <p v-else class="text-sm text-ink-muted">Daftar subtes belum tersedia.</p>
    </section>

    <section class="mt-5 bg-surface border-2 border-ink rounded-xl p-4 manga-shadow-sm">
      <label for="study-notes" class="text-xs font-bold uppercase text-ink">Catatan sesi (opsional)</label>
      <textarea id="study-notes" v-model="notes" rows="3" class="mt-2 w-full bg-paper border-2 border-ink rounded-lg p-3 text-sm text-ink resize-y" />
    </section>

    <button type="submit" :disabled="saving" class="mt-5 h-12 bg-primary text-on-primary font-condensed text-lg font-bold uppercase border-2 border-ink rounded-lg manga-shadow flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-60">
      <LoaderCircle v-if="saving" class="w-5 h-5 animate-spin motion-reduce:animate-none" />
      <CheckCircle2 v-else class="w-5 h-5" />
      {{ saving ? 'MENYIMPAN...' : 'SIMPAN SESI' }}
    </button>
  </form>
</template>
