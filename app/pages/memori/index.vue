<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowLeft, ChevronLeft, ChevronRight, FilePenLine, LoaderCircle, Search } from '@lucide/vue'
import { formatNoteDate, summarizeNoteContent } from '~/utils/noteContent.js'
import { SUBTEST_ORDER } from '~/utils/subtests.js'

const search = ref('')
const category = ref('ALL')
const subtest = ref('ALL')
const page = ref(1)
const result = ref(null)
const loading = ref(true)
const updating = ref(false)
const errorMessage = ref('')
let requestSequence = 0
let activeController
let debounceTimer
let skipPageWatch = false

const totalPages = computed(() => result.value?.total_pages || 1)
const totalItems = computed(() => result.value?.total_items || 0)
const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = result.value?.current_page || 1
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const candidates = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((value) => value >= 1 && value <= total)
    .sort((a, b) => a - b)
  const pages = []
  candidates.forEach((value, index) => {
    if (index && value - candidates[index - 1] > 1) pages.push('…')
    pages.push(value)
  })
  return pages
})

async function loadNotes() {
  const sequence = ++requestSequence
  const controller = new AbortController()
  activeController = controller
  loading.value = !result.value
  updating.value = true
  errorMessage.value = ''
  try {
    const data = await $fetch('/api/notes', {
      signal: controller.signal,
      timeout: 20000,
      query: {
        page: page.value,
        search: search.value.trim(),
        category: category.value,
        subtest_code: subtest.value === 'ALL' ? '' : subtest.value,
      },
    })
    if (sequence !== requestSequence) return
    result.value = data
    if (page.value !== data.current_page) {
      skipPageWatch = true
      page.value = data.current_page
    }
  } catch (error) {
    if (sequence !== requestSequence) return
    if (error?.name === 'AbortError') return
    errorMessage.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message ||
      'Catatan belum dapat dimuat. Coba lagi.'
  } finally {
    if (sequence === requestSequence) {
      loading.value = false
      updating.value = false
    }
  }
}

function scheduleLoad(debounce = false) {
  clearTimeout(debounceTimer)
  activeController?.abort()
  requestSequence += 1
  updating.value = true
  loading.value = !result.value
  if (debounce) debounceTimer = setTimeout(loadNotes, 350)
  else loadNotes()
}

function resetPage() {
  if (page.value !== 1) {
    skipPageWatch = true
    page.value = 1
  }
}

watch(search, () => {
  resetPage()
  scheduleLoad(true)
})
watch([category, subtest], ([value]) => {
  if (value === 'RANDOM' && subtest.value !== 'ALL') {
    subtest.value = 'ALL'
    return
  }
  resetPage()
  scheduleLoad()
})
watch(page, () => {
  if (skipPageWatch) {
    skipPageWatch = false
    return
  }
  scheduleLoad()
})
if (import.meta.client) loadNotes()

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  activeController?.abort()
})

function resetFilters() {
  search.value = ''
  category.value = 'ALL'
  subtest.value = 'ALL'
  page.value = 1
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-8">
    <div class="flex items-start justify-between gap-3">
      <div>
        <NuxtLink to="/" class="mb-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-surface px-3 py-2 text-xs font-bold uppercase text-ink manga-shadow-sm">
          <ArrowLeft class="h-4 w-4" />
          Kembali
        </NuxtLink>
        <h1 class="font-condensed text-3xl font-extrabold uppercase leading-none tracking-tight text-ink sm:text-4xl">
          Memori Kesalahan
        </h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
          Catat, pahami, dan pelajari kembali setiap kesalahan agar target UTBK tercapai.
        </p>
      </div>
      <NuxtLink
        to="/memori/tulis"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-ink bg-primary px-3 py-2.5 font-condensed text-sm font-bold uppercase tracking-wide text-on-primary manga-shadow-sm sm:px-4 sm:text-base"
      >
        <FilePenLine class="h-4 w-4" />
        <span class="hidden sm:inline">Tulis Catatan</span>
        <span class="sm:hidden">Tulis</span>
      </NuxtLink>
    </div>

    <div class="flex flex-col gap-2">
      <label class="relative block">
        <span class="sr-only">Cari isi catatan</span>
        <LoaderCircle v-if="updating" class="absolute left-3 top-3.5 h-4 w-4 animate-spin motion-reduce:animate-none text-primary" aria-hidden="true" />
        <Search v-else class="absolute left-3 top-3.5 h-4 w-4 text-ink-muted" aria-hidden="true" />
        <input
          v-model="search"
          type="search"
          maxlength="200"
          placeholder="Cari isi catatan atau refleksi..."
          class="h-12 w-full rounded-lg border-2 border-ink bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted manga-shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
      </label>
      <p v-if="updating && result" class="flex items-center gap-1.5 text-xs text-ink-muted" role="status">
        <LoaderCircle class="h-3.5 w-3.5 animate-spin motion-reduce:animate-none text-primary" />
        {{ search.trim() ? 'Mencari catatan...' : 'Memuat catatan...' }}
      </p>

      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="option in [{ value: 'ALL', label: 'Semua' }, { value: 'UTBK', label: 'UTBK' }, { value: 'RANDOM', label: 'Random' }]"
          :key="option.value"
          type="button"
          class="min-h-10 rounded-lg border-2 border-ink px-2 text-xs font-bold uppercase tracking-wide manga-shadow-sm"
          :class="category === option.value ? 'bg-primary text-on-primary' : 'bg-surface text-ink'"
          :aria-pressed="category === option.value"
          @click="category = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-if="category !== 'RANDOM'" class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          class="shrink-0 rounded border border-ink px-3 py-1.5 text-[11px] font-bold uppercase"
          :class="subtest === 'ALL' ? 'bg-ink text-surface' : 'bg-surface text-ink'"
          :aria-pressed="subtest === 'ALL'"
          @click="subtest = 'ALL'"
        >
          Semua subtes
        </button>
        <button
          v-for="code in SUBTEST_ORDER"
          :key="code"
          type="button"
          class="shrink-0 rounded border border-ink px-3 py-1.5 text-[11px] font-bold uppercase"
          :class="subtest === code ? 'bg-ink text-surface' : 'bg-surface text-ink'"
          :aria-pressed="subtest === code"
          @click="subtest = code"
        >
          {{ code }}
        </button>
      </div>
    </div>

    <section v-if="loading && !result && !errorMessage" class="flex flex-col gap-3" aria-live="polite">
      <div v-for="n in 3" :key="n" class="h-36 animate-pulse motion-reduce:animate-none rounded-xl border-2 border-ink/15 bg-surface/70" />
      <p class="text-center text-sm text-ink-muted">Membuka kembali lembaran catatan...</p>
    </section>

    <section v-else-if="errorMessage && !result" class="rounded-xl border-2 border-ink bg-surface p-6 text-center manga-shadow" role="alert">
      <p class="font-condensed text-xl font-bold uppercase text-manga-red-dark">Catatan belum terbaca</p>
      <p class="mt-1 text-sm text-ink-muted">{{ errorMessage }}</p>
      <button type="button" class="mt-4 rounded-lg border-2 border-ink bg-primary px-4 py-2 font-bold text-on-primary manga-shadow-sm" @click="loadNotes">
        Coba Lagi
      </button>
    </section>

    <template v-else>
      <section v-if="errorMessage && result" class="rounded-lg border border-error/30 bg-error-container px-3 py-2 text-sm text-on-error-container" role="alert">
        <div class="flex items-center justify-between gap-3">
          <span>{{ errorMessage }} Data yang ditampilkan masih hasil sebelumnya.</span>
          <button type="button" class="shrink-0 font-bold underline" @click="loadNotes">Coba lagi</button>
        </div>
      </section>

    <section v-if="errorMessage && !totalItems" class="rounded-xl border-2 border-ink bg-surface p-6 text-center manga-shadow">
      <p class="font-condensed text-lg font-bold uppercase text-manga-red-dark">Hasil sebelumnya tidak tersedia</p>
      <p class="mt-1 text-sm text-ink-muted">Pencarian gagal dan tidak ada daftar lama yang dapat ditampilkan.</p>
    </section>

    <section v-else-if="!errorMessage && !totalItems && search.trim()" class="rounded-xl border-2 border-ink bg-surface p-6 text-center manga-shadow">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-paper text-xl text-ink-muted">⌕</div>
      <h2 class="mt-3 font-condensed text-lg font-bold uppercase text-ink">Tidak ditemukan catatan</h2>
      <p class="mt-1 text-sm text-ink-muted">Tidak ditemukan catatan dengan kata kunci tersebut.</p>
      <button type="button" class="mt-3 rounded-lg border border-ink bg-surface px-3 py-1.5 text-xs font-bold uppercase" @click="resetFilters">
        Hapus kata kunci
      </button>
    </section>

    <section v-else-if="!errorMessage && !totalItems && (category !== 'ALL' || subtest !== 'ALL')" class="rounded-xl border-2 border-ink bg-surface p-6 text-center manga-shadow">
      <h2 class="font-condensed text-lg font-bold uppercase text-ink">Tidak ada catatan untuk filter yang dipilih</h2>
      <p class="mt-1 text-sm text-ink-muted">Coba kategori atau subtes lainnya.</p>
      <button type="button" class="mt-3 rounded-lg border border-ink bg-surface px-3 py-1.5 text-xs font-bold uppercase" @click="resetFilters">
        Reset filter
      </button>
    </section>

    <section v-else-if="!errorMessage && !totalItems" class="rounded-xl border-2 border-ink bg-surface px-6 py-10 text-center manga-shadow">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-2 border-ink bg-paper text-primary">
        <FilePenLine class="h-7 w-7" />
      </div>
      <p class="mt-4 inline-block rounded border border-manga-red/40 bg-manga-red-soft px-3 py-1 font-condensed text-sm font-bold uppercase text-manga-red-dark">
        Belum ada memori kesalahan
      </p>
      <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        Setiap kesalahan adalah bagian dari proses belajar. Mulai tulis catatan refleksi pertamamu hari ini.
      </p>
      <NuxtLink to="/memori/tulis" class="mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-primary px-5 py-3 font-condensed font-bold uppercase text-on-primary manga-shadow-sm">
        <FilePenLine class="h-4 w-4" />
        Tulis Catatan Baru
      </NuxtLink>
    </section>

    <template v-else-if="totalItems">
      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="note in result.items"
          :key="note.note_id"
          :to="`/memori/${encodeURIComponent(note.note_id)}`"
          class="block rounded-xl border-2 border-ink border-l-[5px] border-l-primary bg-surface p-4 manga-shadow-sm transition-transform hover:-translate-y-0.5 sm:p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <span class="font-condensed text-xs font-bold uppercase tracking-wider text-manga-red-dark">
              {{ note.category === 'RANDOM' ? '✦ Refleksi bebas' : '! Catatan UTBK' }}
            </span>
            <time class="shrink-0 text-[11px] font-semibold text-ink-muted">
              {{ formatNoteDate(note.note_date, { short: true }) }}
            </time>
          </div>
          <p class="mt-3 whitespace-pre-line text-sm leading-7 text-ink sm:text-base">
            {{ summarizeNoteContent(note.content) }}
          </p>
          <NoteMeta :category="note.category" :subtests="note.subtests" :tryout="note.tryout" class="mt-4" />
        </NuxtLink>
      </div>

      <nav v-if="totalItems" class="flex flex-col items-center gap-3 pt-1" aria-label="Pagination catatan">
        <div class="flex w-full items-center justify-between gap-2 text-xs text-ink-muted">
          <span>Menampilkan {{ (result.current_page - 1) * result.per_page + 1 }}–{{ Math.min(result.current_page * result.per_page, totalItems) }} dari <strong class="text-ink">{{ totalItems }}</strong> catatan</span>
          <span class="shrink-0 rounded border border-ink bg-surface px-2 py-1 font-bold uppercase text-ink">Hal. {{ result.current_page }} / {{ result.total_pages }}</span>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-1.5">
          <button type="button" :disabled="updating || result.current_page <= 1" aria-label="Halaman sebelumnya" class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-surface text-ink manga-shadow-sm disabled:cursor-not-allowed disabled:opacity-40" @click="page = result.current_page - 1">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <template v-for="(token, index) in pageNumbers" :key="`${token}-${index}`">
            <span v-if="token === '…'" class="px-1 text-ink-muted">…</span>
            <button v-else type="button" :disabled="updating" :aria-current="token === result.current_page ? 'page' : undefined" class="h-10 min-w-10 rounded-lg border-2 border-ink px-2 font-bold manga-shadow-sm disabled:opacity-50" :class="token === result.current_page ? 'bg-primary text-on-primary' : 'bg-surface text-ink'" @click="page = token">
              {{ token }}
            </button>
          </template>
          <button type="button" :disabled="updating || result.current_page >= result.total_pages" aria-label="Halaman berikutnya" class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-surface text-ink manga-shadow-sm disabled:cursor-not-allowed disabled:opacity-40" @click="page = result.current_page + 1">
            <ChevronRight class="h-5 w-5" />
          </button>
        </div>
      </nav>
    </template>
    </template>
  </div>
</template>
