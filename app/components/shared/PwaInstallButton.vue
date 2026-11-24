<script setup>
import { Download } from '@lucide/vue'
import { ref } from 'vue'
import { usePwaInstall } from '~/composables/usePwaInstall.js'

const {
  canInstall,
  isInstalled,
  manualInstallInstructions,
  promptInstall,
} = usePwaInstall()
const isPrompting = ref(false)
const statusMessage = ref('')

async function installApp() {
  if (isPrompting.value) return

  isPrompting.value = true
  statusMessage.value = ''
  try {
    const result = await promptInstall()
    if (result.outcome === 'accepted') {
      statusMessage.value = 'Permintaan diterima. Selesaikan pemasangan di perangkat.'
    } else if (result.outcome === 'dismissed') {
      statusMessage.value = 'Pemasangan dibatalkan.'
    } else if (result.outcome === 'unavailable') {
      statusMessage.value = 'Prompt instalasi tidak tersedia di browser ini.'
    } else {
      statusMessage.value = 'Prompt instalasi gagal dibuka. Coba melalui menu browser.'
    }
  } finally {
    isPrompting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <span
      v-if="isInstalled"
      class="inline-flex h-11 items-center gap-2 rounded-lg border-2 border-ink bg-surface-container px-4 font-bold text-ink"
      role="status"
    >
      <Download class="h-4 w-4" />
      App Installed
    </span>
    <button
      v-else-if="canInstall || isPrompting"
      type="button"
      :disabled="isPrompting"
      class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-manga-red-soft px-4 font-bold text-manga-red-dark manga-shadow-sm transition hover:bg-primary hover:text-on-primary active:translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      @click="installApp"
    >
      <Download class="h-4 w-4" />
      {{ isPrompting ? 'Menunggu...' : 'Install App' }}
    </button>
    <details
      v-else-if="manualInstallInstructions"
      class="group w-full sm:w-auto"
    >
      <summary
        class="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border-2 border-ink bg-manga-red-soft px-4 font-bold text-manga-red-dark manga-shadow-sm transition hover:bg-primary hover:text-on-primary active:translate-y-0.5"
      >
        <Download class="h-4 w-4" />
        Cara Install
      </summary>
      <p
        class="mt-2 max-w-sm rounded-lg border-2 border-ink bg-surface p-3 text-xs leading-relaxed text-ink manga-shadow-sm"
        role="note"
      >
        {{ manualInstallInstructions }}
      </p>
    </details>
    <p
      v-if="statusMessage"
      class="text-xs text-ink-muted"
      role="status"
    >
      {{ statusMessage }}
    </p>
  </div>
</template>
