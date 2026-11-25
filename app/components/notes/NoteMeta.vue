<script setup>
import { formatNoteDate } from '~/utils/noteContent.js'

defineProps({
  category: { type: String, required: true },
  subtests: { type: Array, default: () => [] },
  tryout: { type: Object, default: null },
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <span
      class="inline-flex items-center rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
      :class="category === 'UTBK'
        ? 'border-manga-red/50 bg-manga-red-soft text-manga-red-dark'
        : 'border-ink/20 bg-surface-container text-ink-muted'"
    >
      {{ category }}
    </span>
    <span
      v-for="subtest in subtests"
      :key="subtest"
      class="inline-flex items-center rounded border border-ink bg-ink px-2 py-1 text-[10px] font-bold text-surface"
    >
      {{ subtest }}
    </span>
    <span
      v-if="tryout"
      class="inline-flex max-w-full items-center gap-1 truncate rounded border border-secondary/30 bg-secondary-fixed px-2 py-1 text-[10px] font-semibold text-on-secondary-container"
      :title="`${tryout.tryout_name} • ${formatNoteDate(tryout.tryout_date, { short: true })}`"
    >
      TO · {{ tryout.tryout_name }} · {{ formatNoteDate(tryout.tryout_date, { short: true }) }}
    </span>
  </div>
</template>
