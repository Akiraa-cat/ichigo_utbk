<script setup>
import { ref, watch } from 'vue'
import { AlertTriangle, CheckCircle2, Info, LoaderCircle, Palette, Save, Trash2, X } from '@lucide/vue'
import { useApp } from '~/composables/useApp'

const {
  toasts,
  dismissToast,
  confirmDialog,
  closeConfirm,
  isAddPlatformOpen,
  setAddPlatformOpen,
  editingApplication,
  saveApplication,
  pushToast,
} = useApp()

const pfName = ref('')
const pfColorHex = ref('#D94A50')
const savingApplication = ref(false)
const confirmPending = ref(false)

watch(
  [isAddPlatformOpen, editingApplication],
  ([isOpen, application]) => {
    if (!isOpen) return
    pfName.value = application?.name || ''
    pfColorHex.value = application?.colorHex || '#D94A50'
  },
  { immediate: true },
)

async function handleSavePlatform() {
  if (savingApplication.value) return
  const name = pfName.value.trim()
  if (!name) {
    pushToast({ type: 'error', title: 'Nama Aplikasi Kosong', subtitle: 'Masukkan nama aplikasi.' })
    return
  }
  savingApplication.value = true
  try {
    if (await saveApplication({
      id: editingApplication.value?.id,
      name,
      colorHex: pfColorHex.value,
    })) {
      setAddPlatformOpen(false)
      pfName.value = ''
    }
  } finally {
    savingApplication.value = false
  }
}

async function runConfirm() {
  if (confirmPending.value || !confirmDialog.value) return
  confirmPending.value = true
  try {
    const completed = await confirmDialog.value.onConfirm()
    if (completed !== false) closeConfirm()
  } catch (error) {
    pushToast({
      type: 'error',
      title: 'Tindakan Gagal',
      subtitle: error?.message || 'Tindakan gagal diproses. Silakan coba lagi.',
    })
  } finally {
    confirmPending.value = false
  }
}

function dismissConfirm() {
  if (!confirmPending.value) closeConfirm()
}

function closeApplicationModal() {
  if (!savingApplication.value) setAddPlatformOpen(false)
}
</script>

<template>
  <div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-md flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto bg-surface p-3 rounded-xl border-2 border-ink manga-shadow flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-ink"
          :class="toast.type === 'success' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : toast.type === 'info' ? 'bg-surface-container text-ink' : toast.type === 'warning' ? 'bg-manga-red-soft text-manga-red-dark' : 'bg-manga-red-soft text-primary'"
        >
          <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5" />
          <Info v-else-if="toast.type === 'info'" class="w-5 h-5" />
          <AlertTriangle v-else class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <span class="text-xs font-bold text-ink uppercase tracking-wide">{{ toast.title }}</span>
          <p v-if="toast.subtitle" class="text-xs text-ink-muted">{{ toast.subtitle }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          v-if="toast.actionLabel && toast.onAction"
          type="button"
          class="px-2.5 py-1 bg-surface-container-high rounded text-ink text-[11px] font-bold border border-ink/20 cursor-pointer"
          @click="() => { toast.onAction(); dismissToast(toast.id) }"
        >
          {{ toast.actionLabel }}
        </button>
        <button type="button" aria-label="Tutup notifikasi" class="p-1 text-ink-muted cursor-pointer" @click="dismissToast(toast.id)">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
    </TransitionGroup>
  </div>

  <div
    v-if="confirmDialog"
    class="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
    @click="dismissConfirm"
  >
    <div class="relative w-full max-w-sm bg-surface rounded-xl p-5 border-2 border-ink manga-shadow-lg" @click.stop>
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 border-2 border-ink">
          <Trash2 class="w-5 h-5" />
        </div>
        <div>
          <h2 class="font-bebas text-xl text-primary uppercase">{{ confirmDialog.title }}</h2>
          <p class="text-xs text-ink mt-1.5 leading-relaxed">{{ confirmDialog.description }}</p>
        </div>
      </div>
      <div class="flex gap-2.5 justify-end pt-4 mt-3 border-t border-ink/10">
        <button type="button" :disabled="confirmPending" class="px-4 py-2 bg-surface-container text-ink rounded-lg text-xs font-bold uppercase border border-ink cursor-pointer disabled:opacity-50" @click="dismissConfirm">
          {{ confirmDialog.cancelLabel || 'Batal' }}
        </button>
        <button
          type="button"
          :disabled="confirmPending"
          class="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase border border-ink flex items-center gap-1.5 cursor-pointer disabled:cursor-wait disabled:opacity-60"
          @click="runConfirm"
        >
          <LoaderCircle v-if="confirmPending" class="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
          <Trash2 v-else class="w-3.5 h-3.5" />
          <span>{{ confirmPending ? 'Memproses...' : confirmDialog.confirmLabel }}</span>
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="isAddPlatformOpen"
    class="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex flex-col justify-end md:justify-center md:items-center md:p-4"
    @click="closeApplicationModal"
  >
    <form class="w-full md:max-w-md bg-surface rounded-t-2xl md:rounded-2xl border-t-2 md:border-2 border-ink p-5 flex flex-col gap-4" @submit.prevent="handleSavePlatform" @click.stop>
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="px-1.5 py-0.5 bg-manga-red-soft text-manga-red-dark text-[10px] rounded uppercase font-bold tracking-wider">DATABASE</span>
          <h2 class="font-condensed text-[26px] font-bold uppercase text-ink">{{ editingApplication ? 'Edit Aplikasi Tryout' : 'Tambah Aplikasi Tryout' }}</h2>
        </div>
        <button type="button" aria-label="Tutup modal" :disabled="savingApplication" class="w-9 h-9 flex items-center justify-center bg-surface-container text-ink rounded-lg border border-ink cursor-pointer disabled:opacity-50" @click="closeApplicationModal">
          <X class="w-5 h-5" />
        </button>
      </div>

      <label class="flex flex-col gap-1.5 text-xs font-bold uppercase text-ink">
        Nama aplikasi
        <input v-model="pfName" type="text" required class="w-full h-11 px-3 bg-paper text-ink text-sm font-medium rounded-lg border-2 border-ink focus:outline-none focus:bg-surface">
      </label>

      <label class="flex flex-col gap-2 text-xs font-bold uppercase text-ink">
        <span class="flex items-center gap-1.5">
          <Palette class="w-4 h-4 text-primary" />
          Warna grafik
        </span>
        <input v-model="pfColorHex" type="color" class="w-full h-11 bg-surface border-2 border-ink rounded-lg p-1 cursor-pointer">
      </label>

      <button type="submit" :disabled="savingApplication" class="w-full h-12 bg-primary text-on-primary font-condensed text-base font-bold uppercase rounded-xl border-2 border-ink manga-shadow flex items-center justify-center gap-2 cursor-pointer disabled:cursor-wait disabled:opacity-60">
        <LoaderCircle v-if="savingApplication" class="w-5 h-5 animate-spin motion-reduce:animate-none" />
        <Save v-else class="w-5 h-5" />
        {{ savingApplication ? 'Menyimpan...' : editingApplication ? 'Simpan Perubahan' : 'Simpan Aplikasi' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition: opacity 160ms ease, transform 160ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
}
</style>
