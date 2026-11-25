<script setup>
import { onMounted, ref } from 'vue'
import { User, Volume2, VolumeX } from '@lucide/vue'
import { ICHIGO_LOGO_URL } from '~/utils/subtests.js'
import { useApp } from '~/composables/useApp'
import { useBackgroundMusic } from '~/composables/useBackgroundMusic.js'

const { route, activeTab, navigateTab, openSettings, pushToast } = useApp()
const { isPlaying, toggleMusic } = useBackgroundMusic()
const imgError = ref(false)

onMounted(() => {
  void toggleMusic()
})

const tabLabels = {
  beranda: 'Beranda',
  nilai: 'Nilai',
  agenda: 'Agenda',
  jadwal: 'Jadwal',
  data: 'Data Management',
}
const navItems = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'nilai', label: 'Nilai' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'data', label: 'Data' },
]

async function handleMusicToggle() {
  if (await toggleMusic()) return
  pushToast({
    type: 'error',
    title: 'Musik Gagal Diputar',
    subtitle: 'Periksa file audio dan coba lagi.',
  })
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-40 pt-safe bg-surface/95 backdrop-blur-xl border-b-2 border-ink shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
    <div class="max-w-6xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-4 relative overflow-hidden">
      <div class="absolute inset-0 manga-dots opacity-10 pointer-events-none" />

      <button
        type="button"
        @click="navigateTab('beranda')"
        class="flex items-center gap-2.5 relative z-10 text-left cursor-pointer shrink-0 group"
      >
        <img
          v-if="!imgError"
          :src="ICHIGO_LOGO_URL"
          alt="ICHIGO Manga Study Logo"
          referrerpolicy="no-referrer"
          @error="imgError = true"
          class="h-8 w-auto object-contain"
        />
        <div v-else class="w-8 h-8 rounded bg-primary border-2 border-ink flex items-center justify-center manga-shadow-sm shrink-0">
          <span class="font-bebas text-xl text-white leading-none mt-0.5">壱</span>
        </div>
        <div class="flex flex-col leading-none">
          <span class="font-bebas text-[22px] tracking-wide uppercase text-ink leading-none group-hover:text-primary transition-colors">
            ICHIGO UTBK
          </span>
          <span class="text-[10px] text-ink-muted font-bold uppercase tracking-wider mt-0.5">
            {{ route.type === 'settings' ? 'Pengaturan' : route.type === 'study_form' ? 'Sesi Belajar' : route.type === 'tryout_form' ? 'Input Nilai' : route.type.startsWith('note_') ? 'Memori Kesalahan' : tabLabels[activeTab] }}
          </span>
        </div>
        <span class="hidden sm:inline-block text-[10px] px-1.5 py-0.5 bg-manga-red-soft text-manga-red-dark font-bold tracking-wider rounded uppercase border border-primary/20">
          STUDY JOURNAL
        </span>
      </button>

      <nav class="hidden md:flex items-center gap-1 relative z-10">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          @click="navigateTab(item.id)"
          :class="(route.type === 'tab' || route.type.startsWith('note_')) && activeTab === item.id
            ? 'bg-primary text-on-primary manga-shadow-sm border border-ink'
            : 'text-ink-muted hover:text-ink hover:bg-surface-container'"
          class="px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-bold whitespace-nowrap transition-all cursor-pointer"
        >
          {{ item.label }}
        </button>
      </nav>

      <div class="flex items-center gap-2 relative z-10 shrink-0">
        <button
          type="button"
          :aria-label="isPlaying ? 'Pause Music' : 'Play Music'"
          :title="isPlaying ? 'Pause Music' : 'Play Music'"
          :class="isPlaying ? 'bg-primary text-on-primary' : 'bg-surface-container text-ink hover:bg-manga-red-soft'"
          class="relative w-10 h-10 rounded-full flex items-center justify-center border-2 border-ink manga-shadow-sm transition-transform active:translate-y-0.5 cursor-pointer"
          @click="handleMusicToggle"
        >
          <VolumeX v-if="isPlaying" class="w-5 h-5" />
          <Volume2 v-else class="w-5 h-5" />
          <span
            v-if="isPlaying"
            class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-ink bg-tertiary-fixed animate-pulse"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          aria-label="Buka Pengaturan"
          @click="openSettings"
          :class="route.type === 'settings'
            ? 'bg-ink text-surface'
            : 'bg-primary text-on-primary hover:brightness-105'"
          class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ink manga-shadow-sm transition-transform active:translate-y-0.5 cursor-pointer"
        >
          <User class="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
</template>
