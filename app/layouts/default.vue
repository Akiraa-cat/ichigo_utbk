<script setup>
const { dataError, isLoadingSkeleton, loadData } = useApp()
const splashVisible = useState('ichigo-startup-splash', () => true)
</script>

<template>
  <div class="min-h-screen bg-paper text-ink flex flex-col">
    <HeaderBar />
    <main class="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-24 md:pb-12">
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
        <slot />
      </div>
    </main>
    <BottomNav />
    <MangaOverlays />
    <StartupSplash v-if="splashVisible" />
  </div>
</template>
