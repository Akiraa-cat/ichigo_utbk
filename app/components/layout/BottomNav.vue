<script setup>
import { BookOpen, CalendarDays, FolderOpen, Home, LineChart } from '@lucide/vue'
import { useApp } from '~/composables/useApp'

const { activeTab, route, navigateTab } = useApp()
const tabs = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'nilai', label: 'Nilai', icon: LineChart },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'jadwal', label: 'Jadwal', icon: BookOpen },
  { id: 'data', label: 'Data', icon: FolderOpen },
]
</script>

<template>
  <nav
    v-if="route.type === 'tab'"
    class="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/95 backdrop-blur-xl border-t-2 border-ink shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
  >
    <div class="grid grid-cols-5 items-center h-16 px-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        @click="navigateTab(tab.id)"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        :class="activeTab === tab.id ? 'text-primary font-bold' : 'text-ink-muted hover:text-ink'"
        class="flex flex-col items-center justify-center min-h-[48px] py-1 transition-all cursor-pointer"
      >
        <div
          :class="activeTab === tab.id && tab.id === 'data'
            ? 'w-9 h-7 bg-manga-red-soft border-2 border-ink mb-0.5'
            : ''"
          class="flex items-center justify-center rounded-full transition-all"
        >
          <component :is="tab.icon" class="w-[22px] h-[22px]" />
        </div>
        <span class="text-[10px] font-bold uppercase tracking-wide mt-0.5 leading-none">
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>
