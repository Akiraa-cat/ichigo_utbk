<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from '#imports'
import { ArrowLeft, CalendarDays, Check } from '@lucide/vue'
import { getTodayIso } from '~/utils/dateUtils.js'
import { hasNoteText, formatNoteDate } from '~/utils/noteContent.js'
import { SUBTEST_ORDER } from '~/utils/subtests.js'
import { useApp } from '~/composables/useApp'

const route = useRoute()
const { tryouts, settings, pushToast, getRequestId, completeRequestId } = useApp()
const noteId = computed(() => typeof route.query.note_id === 'string' ? route.query.note_id : '')
const isEditing = computed(() => Boolean(noteId.value))
const date = ref(getTodayIso(settings.value.timezone || undefined))
const category = ref('UTBK')
const subtests = ref([])
const tryoutId = ref('')
const content = ref({ type: 'doc', content: [{ type: 'paragraph' }] })
const loading = ref(Boolean(noteId.value))
const saving = ref(false)
const saveError = ref('')
const noteLoadError = ref('')

const tryoutOptions = computed(() =>
  [...tryouts.value]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => ({
      id: item.id,
      label: `${item.title} — ${formatNoteDate(item.date, { short: true })}`,
    })),
)

watch(category, (value) => {
  if (value === 'RANDOM') {
    subtests.value = []
    tryoutId.value = ''
  }
})

onMounted(async () => {
  if (!noteId.value) return
  loading.value = true
  try {
    const note = await $fetch(`/api/notes/${encodeURIComponent(noteId.value)}`, { timeout: 20000 })
    date.value = note.note_date
    category.value = note.category
    subtests.value = [...(note.subtests || [])]
    tryoutId.value = note.tryout_id || ''
    content.value = note.content
  } catch (error) {
    noteLoadError.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message ||
      'Catatan gagal dimuat.'
  } finally {
    loading.value = false
  }
})

async function submitNote() {
  if (saving.value || loading.value || noteLoadError.value) return
  if (!date.value || !hasNoteText(content.value)) {
    saveError.value = 'Isi tanggal dan konten refleksi sebelum menyimpan.'
    return
  }

  saving.value = true
  saveError.value = ''
  const payload = {
    note_date: date.value,
    category: category.value,
    content: content.value,
    subtests: category.value === 'UTBK' ? subtests.value : [],
    tryout_id: category.value === 'UTBK' ? tryoutId.value : '',
  }
  const requestFingerprintPayload = isEditing.value
    ? { ...payload, note_id: noteId.value }
    : payload
  const requestId = getRequestId('saveNote', requestFingerprintPayload)

  try {
    const saved = isEditing.value
      ? await $fetch(`/api/notes/${encodeURIComponent(noteId.value)}`, {
          method: 'PUT',
          body: { ...payload, request_id: requestId },
          timeout: 30000,
        })
      : await $fetch('/api/notes', {
          method: 'POST',
          body: { ...payload, request_id: requestId },
          timeout: 30000,
        })
    completeRequestId('saveNote', requestFingerprintPayload)
    pushToast({
      type: 'success',
      title: 'Catatan Tersimpan',
      subtitle: 'Refleksi tersimpan di Memori Kesalahan.',
    })
    await navigateTo(`/memori/${encodeURIComponent(saved.note_id)}`)
  } catch (error) {
    saveError.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message ||
      'Catatan gagal disimpan. Isi formulir tetap tersimpan; silakan coba lagi.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8" @submit.prevent="submitNote">
    <div class="flex items-center justify-between gap-2">
      <NuxtLink to="/memori" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-surface px-3 py-2 text-xs font-bold uppercase manga-shadow-sm">
        <ArrowLeft class="h-4 w-4" />
        Kembali
      </NuxtLink>
      <span class="rounded border border-manga-red/40 bg-manga-red-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-manga-red-dark">
        {{ isEditing ? 'Edit Catatan' : 'Draft Baru' }}
      </span>
    </div>

    <header>
      <h1 class="font-condensed text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {{ isEditing ? 'Edit Catatan' : 'Tambah Catatan' }}
      </h1>
      <p class="mt-1 text-sm text-ink-muted">Refleksikan kesulitan, kesalahan soal, dan hal yang belum dipahami.</p>
    </header>

    <section v-if="loading" class="rounded-xl border-2 border-ink bg-surface p-5 text-sm text-ink-muted manga-shadow" aria-live="polite">
      Membuka catatan...
    </section>
    <section v-else-if="noteLoadError" class="rounded-xl border-2 border-ink bg-surface p-5 manga-shadow" role="alert">
      <p class="font-bold text-manga-red-dark">Catatan tidak dapat dibuka.</p>
      <p class="mt-1 text-sm text-ink-muted">{{ noteLoadError }}</p>
      <NuxtLink to="/memori" class="mt-3 inline-block text-sm font-bold text-primary underline">Kembali ke daftar</NuxtLink>
    </section>

    <template v-else>
      <aside class="flex items-start gap-3 rounded-xl border-2 border-ink bg-manga-red-soft p-4 manga-shadow-sm">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-primary text-on-primary">✦</span>
        <p class="text-sm leading-relaxed text-ink">
          <strong class="font-condensed uppercase text-manga-red-dark">Jurnal refleksi</strong><br>
          Kesalahan yang dicatat dan dipahami adalah batu loncatan menuju hasil yang lebih baik.
        </p>
      </aside>

      <section class="rounded-xl border-2 border-ink bg-surface p-4 manga-shadow-sm">
        <h2 class="mb-3 flex items-center gap-2 font-condensed text-lg font-bold uppercase text-ink">
          <CalendarDays class="h-5 w-5 text-primary" />
          A. Tanggal Catatan
        </h2>
        <label for="note-date" class="mb-1 block text-xs font-semibold text-ink-muted">Tanggal refleksi</label>
        <input id="note-date" v-model="date" type="date" required class="h-11 w-full rounded-lg border border-ink/30 bg-paper px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30">
      </section>

      <section class="rounded-xl border-2 border-ink bg-surface p-4 manga-shadow-sm">
        <h2 class="mb-3 font-condensed text-lg font-bold uppercase text-ink">B. Kategori Pilihan</h2>
        <div class="grid grid-cols-2 gap-2 rounded-lg border border-ink/25 bg-paper p-1.5">
          <button
            v-for="option in [{ value: 'UTBK', label: 'UTBK · Soal & Subtes' }, { value: 'RANDOM', label: 'Random · Fokus / Habit' }]"
            :key="option.value"
            type="button"
            :aria-pressed="category === option.value"
            class="min-h-11 rounded-md border px-2 text-xs font-bold uppercase leading-tight"
            :class="category === option.value ? 'border-2 border-ink bg-surface text-primary manga-shadow-sm' : 'border-transparent text-ink-muted'"
            @click="category = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section v-if="category === 'UTBK'" class="rounded-xl border-2 border-ink bg-surface p-4 manga-shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="font-condensed text-lg font-bold uppercase text-ink">C. Pilih Subtes Terkait</h2>
          <span class="rounded border border-ink/15 bg-paper px-2 py-1 text-[9px] font-bold uppercase text-ink-muted">Bisa lebih dari satu</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="code in SUBTEST_ORDER"
            :key="code"
            class="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase transition-colors"
            :class="subtests.includes(code) ? 'border-ink bg-manga-red-soft text-manga-red-dark' : 'border-ink/25 bg-paper text-ink-muted'"
          >
            <input v-model="subtests" type="checkbox" :value="code" class="h-4 w-4 accent-primary">
            {{ code }}
          </label>
        </div>
      </section>

      <section v-if="category === 'UTBK'" class="rounded-xl border-2 border-ink bg-surface p-4 manga-shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="font-condensed text-lg font-bold uppercase text-ink">D. Hubungkan dengan Try Out</h2>
          <span class="rounded border border-ink/15 bg-paper px-2 py-1 text-[9px] font-bold uppercase text-ink-muted">Opsional</span>
        </div>
        <label for="note-tryout" class="sr-only">Pilih Try Out</label>
        <select id="note-tryout" v-model="tryoutId" class="h-11 w-full rounded-lg border border-ink/30 bg-paper px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">Tanpa Try Out</option>
          <option v-for="tryout in tryoutOptions" :key="tryout.id" :value="tryout.id">{{ tryout.label }}</option>
        </select>
        <p v-if="!tryoutOptions.length" class="mt-2 text-xs text-ink-muted">Belum ada data Try Out tersimpan.</p>
      </section>

      <section class="rounded-xl border-2 border-ink bg-surface p-4 manga-shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="font-condensed text-lg font-bold uppercase text-ink">E. Apa Kesulitan &amp; Refleksi?</h2>
          <span class="rounded border border-manga-red/40 bg-manga-red-soft px-2 py-1 text-[9px] font-bold uppercase text-manga-red-dark">Rich journal</span>
        </div>
        <div class="overflow-hidden rounded-lg border-2 border-ink">
          <ClientOnly>
            <NoteRichText v-model="content" />
            <template #fallback>
              <div class="min-h-64 bg-paper p-4 text-sm text-ink-muted">Editor catatan sedang disiapkan...</div>
            </template>
          </ClientOnly>
        </div>
      </section>

      <p v-if="saveError" class="rounded-lg border border-error/30 bg-error-container p-3 text-sm text-on-error-container" role="alert">
        {{ saveError }}
      </p>

      <button type="submit" :disabled="saving || !hasNoteText(content)" class="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-primary px-4 font-condensed text-lg font-bold uppercase tracking-wide text-on-primary manga-shadow disabled:cursor-not-allowed disabled:opacity-60">
        <Check v-if="!saving" class="h-5 w-5" />
        <span v-else class="h-4 w-4 animate-spin motion-reduce:animate-none rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
        {{ saving ? 'Menyimpan...' : 'Simpan Catatan' }}
      </button>
      <button type="button" class="h-11 rounded-xl border-2 border-ink bg-surface font-condensed font-bold uppercase tracking-wide text-ink" @click="navigateTo('/memori')">
        Batal &amp; Kembali
      </button>
    </template>
  </form>
</template>
