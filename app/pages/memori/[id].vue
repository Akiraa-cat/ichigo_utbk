<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from '#imports'
import { ArrowLeft, FilePenLine, Trash2 } from '@lucide/vue'
import { extractNoteText, formatNoteDate } from '~/utils/noteContent.js'
import { useApp } from '~/composables/useApp'

const route = useRoute()
const { askConfirm, pushToast, getRequestId, completeRequestId } = useApp()
const note = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const deleting = ref(false)
const plainContent = computed(() => extractNoteText(note.value?.content))

async function loadNote() {
  loading.value = true
  errorMessage.value = ''
  try {
    note.value = await $fetch(`/api/notes/${encodeURIComponent(String(route.params.id))}`, { timeout: 20000 })
  } catch (error) {
    errorMessage.value =
      error?.data?.statusMessage || error?.statusMessage || error?.message ||
      'Catatan belum dapat dibuka. Coba lagi.'
  } finally {
    loading.value = false
  }
}

onMounted(loadNote)

function confirmDelete() {
  if (!note.value || deleting.value) return
  askConfirm({
    title: 'Hapus Memori Kesalahan?',
    description: 'Catatan dan relasi subtesnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Ya, Hapus Catatan',
    onConfirm: async () => {
      if (deleting.value) return
      deleting.value = true
      const payload = { note_id: note.value.note_id }
      const requestId = getRequestId('deleteNote', payload)
      try {
        await $fetch(`/api/notes/${encodeURIComponent(note.value.note_id)}`, {
          method: 'DELETE',
          body: { request_id: requestId },
          timeout: 30000,
        })
        completeRequestId('deleteNote', payload)
        pushToast({ type: 'success', title: 'Catatan Dihapus', subtitle: 'Lembaran catatan telah dihapus.' })
        await navigateTo('/memori')
        return true
      } catch (error) {
        const message =
          error?.data?.statusMessage || error?.statusMessage || error?.message ||
          'Catatan gagal dihapus.'
        pushToast({ type: 'error', title: 'Gagal Menghapus', subtitle: message })
        return false
      } finally {
        deleting.value = false
      }
    },
  })
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-8">
    <div class="flex items-center justify-between gap-2">
      <NuxtLink to="/memori" class="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-surface px-3 py-2 text-xs font-bold uppercase manga-shadow-sm">
        <ArrowLeft class="h-4 w-4" />
        Kembali
      </NuxtLink>
      <div v-if="note" class="flex items-center gap-2">
        <NuxtLink :to="{ path: '/memori/tulis', query: { note_id: note.note_id } }" aria-label="Edit catatan" class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-surface text-ink manga-shadow-sm">
          <FilePenLine class="h-5 w-5" />
        </NuxtLink>
        <button type="button" :disabled="deleting" aria-label="Hapus catatan" class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-surface text-error manga-shadow-sm disabled:opacity-50" @click="confirmDelete">
          <Trash2 class="h-5 w-5" />
        </button>
      </div>
    </div>

    <header>
      <h1 class="font-condensed text-3xl font-extrabold uppercase leading-none tracking-tight text-ink sm:text-4xl">Detail Catatan</h1>
      <p class="mt-2 text-sm text-ink-muted">Refleksi mendalam dan evaluasi mandiri hasil pengerjaan soal.</p>
      <p v-if="deleting" class="mt-2 text-xs font-semibold text-ink-muted" role="status">Menghapus catatan...</p>
    </header>

    <section v-if="loading" class="rounded-xl border-2 border-ink bg-surface p-6 text-center text-sm text-ink-muted manga-shadow" aria-live="polite">
      Membuka kembali lembaran catatan...
    </section>
    <section v-else-if="errorMessage" class="rounded-xl border-2 border-ink bg-surface p-6 text-center manga-shadow" role="alert">
      <p class="font-condensed text-xl font-bold uppercase text-manga-red-dark">Catatan belum terbaca</p>
      <p class="mt-1 text-sm text-ink-muted">{{ errorMessage }}</p>
      <button type="button" class="mt-4 rounded-lg border-2 border-ink bg-primary px-4 py-2 font-bold text-on-primary manga-shadow-sm" @click="loadNote">
        Coba Lagi
      </button>
    </section>
    <article v-else-if="note" class="overflow-hidden rounded-xl border-2 border-ink bg-surface manga-shadow">
      <div class="flex flex-col gap-3 border-b border-ink/10 bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span class="font-condensed text-sm font-bold uppercase tracking-wider text-ink">▣ Memori Kesalahan</span>
        <time class="text-xs font-semibold text-ink-muted">{{ formatNoteDate(note.note_date) }}</time>
      </div>
      <div class="flex flex-col gap-4 p-4 sm:p-6">
        <NoteMeta :category="note.category" :subtests="note.subtests" :tryout="note.tryout" />
        <hr class="border-ink/15">
        <ClientOnly>
          <NoteRichText v-model="note.content" :editable="false" />
          <template #fallback>
            <p class="whitespace-pre-line text-sm leading-7 text-ink">{{ plainContent }}</p>
          </template>
        </ClientOnly>
      </div>
    </article>
  </div>
</template>
