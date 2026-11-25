<script setup>
import { computed, ref } from 'vue'
import { useRoute } from '#imports'
import { ArrowLeft, Calendar, CheckCircle2, LoaderCircle, PlusCircle, Save, Trash2 } from '@lucide/vue'
import { useApp } from '~/composables/useApp'
import { SUBTEST_ORDER } from '~/utils/subtests.js'
import { getTodayIso } from '~/utils/dateUtils.js'

const route = useRoute()
const {
  tryouts,
  platforms,
  activityTypes,
  settings,
  saveTryout,
  deleteTryout,
  goBackToTab,
  openApplicationForm,
  askConfirm,
} = useApp()
const tryoutId = typeof route.query.tryoutId === 'string' ? route.query.tryoutId : undefined
const existing = computed(() => tryouts.value.find((tryout) => tryout.id === tryoutId))
const availableSubtests = computed(() =>
  SUBTEST_ORDER.map((code) => ({
    code,
    name: activityTypes.value.find((activity) => activity.code === code)?.name || code,
  })),
)
const platformId = ref(existing.value?.applicationId ?? '')
const title = ref(existing.value?.title ?? '')
const date = ref(existing.value?.date ?? getTodayIso(settings.value.timezone || undefined))
const scores = ref(existing.value?.scores ?? Object.fromEntries(SUBTEST_ORDER.map((code) => [code, null])))
const averageScore = ref(existing.value?.averageScore ?? null)
const notes = ref(existing.value?.notes ?? '')
const saving = ref(false)
const computedMean = computed(() => {
  const values = SUBTEST_ORDER.map((code) => scores.value[code])
  if (values.some((value) => value === null || value === undefined || value === '')) return null
  return Math.round(values.reduce((total, value) => total + Number(value), 0) / values.length)
})
const deltaTarget = computed(() =>
  averageScore.value === null || settings.value.targetScore === null
    ? null
    : Number(averageScore.value) - settings.value.targetScore,
)

function handleScoreChange(code, value) {
  scores.value = {
    ...scores.value,
    [code]: value === '' ? null : Number(value),
  }
}

async function handleSubmit() {
  if (!platformId.value || saving.value) return
  saving.value = true
  try {
    if (await saveTryout({
      id: existing.value?.id,
      applicationId: platformId.value,
      title: title.value.trim(),
      date: date.value,
      averageScore: Number(averageScore.value),
      scores: scores.value,
      notes: notes.value.trim(),
    })) {
      goBackToTab()
    }
  } finally {
    saving.value = false
  }
}

function confirmDelete() {
  askConfirm({
    title: 'Hapus Catatan Tryout?',
    description: `Nilai ${existing.value.title} akan dihapus permanen.`,
    confirmLabel: 'Ya, Hapus',
    onConfirm: async () => {
      const deleted = await deleteTryout(existing.value.id)
      if (deleted) goBackToTab()
      return deleted
    },
  })
}
</script>

<template>
  <form class="flex flex-col w-full max-w-2xl mx-auto pb-12 gap-5" @submit.prevent="handleSubmit">
    <div class="flex items-center justify-between gap-2">
      <button type="button" @click="goBackToTab" class="flex items-center gap-1.5 px-3 py-1.5 bg-surface text-ink text-xs font-bold rounded-lg border border-ink manga-shadow-sm cursor-pointer">
        <ArrowLeft class="w-4 h-4" />
        KEMBALI
      </button>
      <span class="px-2.5 py-1 bg-surface-container rounded-lg text-[10px] font-bold text-ink-muted uppercase">
        {{ existing ? 'Edit Tryout' : 'Tryout Baru' }}
      </span>
    </div>

    <section class="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <h1 class="font-condensed text-[22px] font-bold uppercase text-ink">APLIKASI TRYOUT</h1>
        <button type="button" @click="openApplicationForm()" class="text-xs font-bold text-primary underline cursor-pointer">
          <PlusCircle class="w-4 h-4 inline" /> Tambah aplikasi
        </button>
      </div>
      <div v-if="platforms.length" class="grid grid-cols-1 gap-2">
        <label
          v-for="application in platforms"
          :key="application.id"
          class="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer"
          :class="platformId === application.id ? 'bg-manga-red-soft border-ink manga-shadow-sm' : 'bg-surface-container-low border-ink/20'"
        >
          <span class="w-4 h-4 rounded-full border border-ink shrink-0" :style="{ backgroundColor: application.colorHex }" />
          <span class="text-sm font-bold text-ink flex-1">{{ application.name }}</span>
          <input v-model="platformId" type="radio" name="application" :value="application.id" required class="accent-primary">
        </label>
      </div>
      <p v-else class="text-sm text-ink-muted">Belum ada aplikasi. Tambahkan aplikasi tryout terlebih dahulu.</p>
    </section>

    <section class="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
      <h2 class="font-condensed text-[20px] font-bold uppercase text-ink">INFORMASI TRYOUT</h2>
      <label for="tryout-name" class="text-xs font-bold uppercase text-ink">Nama tryout</label>
      <input id="tryout-name" v-model.trim="title" type="text" required class="h-11 px-3 bg-surface-container-low text-ink text-sm rounded-lg border-2 border-ink">
      <label for="tryout-date" class="text-xs font-bold uppercase text-ink flex items-center gap-1.5">
        <Calendar class="w-4 h-4" />
        Tanggal tryout
      </label>
      <input id="tryout-date" v-model="date" type="date" required class="h-11 px-3 bg-surface-container-low text-ink text-sm rounded-lg border-2 border-ink">
    </section>

    <section class="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-condensed text-[20px] font-bold uppercase text-ink">SKOR SUBTES</h2>
        <span class="text-[10px] px-2 py-0.5 bg-surface-container rounded uppercase text-ink-muted font-bold">100–1000</span>
      </div>
      <div class="grid grid-cols-1 gap-2.5">
        <label v-for="item in availableSubtests" :key="item.code" class="flex items-center justify-between p-2.5 rounded-lg border border-ink/25 bg-surface-container-lowest">
          <span class="text-sm font-bold text-ink">{{ item.name }} ({{ item.code }})</span>
          <input
            type="number"
            min="100"
            max="1000"
            required
            :value="scores[item.code] ?? ''"
            class="w-24 h-10 px-2 text-center bg-surface font-condensed text-xl font-bold rounded border-2 border-ink tabular-nums"
            @input="handleScoreChange(item.code, $event.target.value)"
          >
        </label>
      </div>
    </section>

    <section class="bg-surface rounded-xl p-4 border-2 border-ink manga-shadow flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-condensed text-[20px] font-bold uppercase text-ink">SKOR KESELURUHAN</h2>
          <button v-if="computedMean !== null" type="button" class="text-xs underline font-bold text-primary" @click="averageScore = computedMean">
            Gunakan rata-rata subtes ({{ computedMean }})
          </button>
        </div>
        <label for="overall-score" class="sr-only">Skor keseluruhan</label>
        <input id="overall-score" v-model.number="averageScore" type="number" min="100" max="1000" required class="w-28 h-12 text-center font-bebas text-[32px] text-primary bg-surface rounded-lg border-2 border-ink tabular-nums">
      </div>
      <p v-if="deltaTarget !== null" class="text-xs font-bold" :class="deltaTarget >= 0 ? 'text-tertiary' : 'text-error'">
        Selisih dari target: {{ deltaTarget >= 0 ? `+${deltaTarget}` : deltaTarget }}
      </p>
      <label for="tryout-notes" class="text-xs font-bold uppercase text-ink">Catatan (opsional)</label>
      <textarea id="tryout-notes" v-model="notes" rows="3" class="w-full bg-paper border-2 border-ink rounded-lg p-3 text-sm text-ink resize-y" />
    </section>

    <div class="flex gap-2">
      <button type="submit" :disabled="saving || !platforms.length" class="flex-1 h-12 bg-primary text-on-primary font-condensed text-lg font-bold uppercase rounded-xl border-2 border-ink manga-shadow flex items-center justify-center gap-2 disabled:opacity-50">
        <LoaderCircle v-if="saving" class="w-5 h-5 animate-spin motion-reduce:animate-none" />
        <Save v-else class="w-5 h-5" />
        {{ saving ? 'MENYIMPAN...' : 'SIMPAN NILAI' }}
      </button>
      <button v-if="existing" type="button" class="h-12 px-4 bg-manga-red-soft text-manga-red-dark border-2 border-ink rounded-xl" @click="confirmDelete">
        <Trash2 class="w-5 h-5" />
      </button>
      <button v-if="existing" type="button" class="sr-only" @click="confirmDelete">Hapus catatan tryout</button>
    </div>
    <p v-if="existing" class="text-center text-xs text-primary underline cursor-pointer" @click="confirmDelete">Hapus catatan tryout</p>
    <p v-if="availableSubtests.length !== SUBTEST_ORDER.length" class="text-xs text-ink-muted">
      Beberapa nama subtes belum tersedia di daftar aktivitas database.
    </p>
  </form>
</template>
