<script setup>
import { useRoute } from '#imports'

const { dataError, isLoadingSkeleton, isRefreshing, refreshError, loadData } = useApp()
const currentRoute = useRoute()
const splashVisible = useState('ichigo-startup-splash', () => true)
</script>

<template>
  <div class="min-h-screen bg-paper text-ink flex flex-col">
    <HeaderBar v-if="!currentRoute.path.startsWith('/memori')" />
    <main
      class="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pb-24 md:pb-12"
      :class="currentRoute.path.startsWith('/memori') ? 'pt-5' : 'pt-20'"
    >
      <div v-show="isLoadingSkeleton">
        <SkeletonCard />
      </div>
      <section
        v-show="!isLoadingSkeleton && dataError"
        class="bg-surface p-5 rounded-xl border-2 border-ink manga-shadow flex flex-col items-center gap-3 text-center"
        role="alert"
      >
        <h1 class="font-bebas text-2xl uppercase text-ink">Data Gagal Dimuat</h1>
        <p class="text-sm text-ink-muted">{{ dataError }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-primary text-on-primary rounded-lg border-2 border-ink manga-shadow-sm font-bold"
          @click="loadData"
        >
          Coba Lagi
        </button>
      </section>
      <div v-show="!isLoadingSkeleton && !dataError">
        <div
          v-if="isRefreshing || refreshError"
          class="mb-4 flex items-center justify-between gap-3 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-xs text-ink-muted"
          role="status"
          aria-live="polite"
        >
          <span class="flex items-center gap-2">
            <span v-if="isRefreshing" class="h-3.5 w-3.5 animate-spin motion-reduce:animate-none rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
            {{ isRefreshing ? 'Memperbarui data...' : `Pembaruan gagal: ${refreshError}` }}
          </span>
          <button v-if="refreshError" type="button" class="shrink-0 font-bold text-primary underline" @click="loadData">
            Coba lagi
          </button>
        </div>
        <slot />
      </div>
    </main>
    <BottomNav />
    <MangaOverlays />
    <StartupSplash v-if="splashVisible" />
  </div>
</template>
