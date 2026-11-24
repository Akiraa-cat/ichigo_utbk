<script setup>
import { Lightbulb, PlusCircle } from '@lucide/vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ctaLabel: { type: String, required: true },
  onCta: { type: Function, required: true },
  tip: { type: String, default: '' },
  bubbleText: { type: String, default: 'BABAK BARU!' },
})
</script>

<template>
  <div class="relative bg-surface rounded-xl p-6 border-2 border-ink manga-shadow flex flex-col items-center text-center overflow-hidden">
    <div class="absolute inset-0 manga-dots opacity-5 pointer-events-none" />

    <div class="relative w-full max-w-[240px] h-36 mx-auto mb-3 flex items-center justify-center">
      <svg
        class="w-full h-full max-h-36 drop-shadow"
        fill="none"
        viewBox="0 0 240 140"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 20 L60 50 M230 20 L180 50 M120 10 L120 40 M20 120 L65 95 M220 120 L175 95" opacity="0.35" stroke="#171717" stroke-dasharray="2 3" stroke-linecap="round" stroke-width="1.2" />
        <ellipse cx="120" cy="118" fill="#eae7e7" rx="80" ry="10" />
        <path d="M60 85 L115 92 L115 50 L60 45 Z" fill="#FFFEFC" stroke="#171717" stroke-linejoin="round" stroke-width="2" />
        <path d="M180 85 L125 92 L125 50 L180 45 Z" fill="#F7F4EF" stroke="#171717" stroke-linejoin="round" stroke-width="2" />
        <line stroke="#ad2933" stroke-linecap="round" stroke-width="2.5" x1="120" x2="120" y1="48" y2="94" />
        <line stroke="#8c706f" stroke-dasharray="1 3" stroke-width="1.2" x1="68" x2="108" y1="58" y2="61" />
        <line stroke="#8c706f" stroke-dasharray="1 3" stroke-width="1.2" x1="68" x2="108" y1="68" y2="71" />
        <line stroke="#8c706f" stroke-dasharray="1 3" stroke-width="1.2" x1="68" x2="108" y1="78" y2="81" />
        <line stroke="#8c706f" stroke-dasharray="1 3" stroke-width="1.2" x1="132" x2="172" y1="61" y2="58" />
        <line stroke="#8c706f" stroke-dasharray="1 3" stroke-width="1.2" x1="132" x2="172" y1="71" y2="68" />
        <path d="M145 32 L168 18 L174 24 L151 38 Z" fill="#171717" />
        <path d="M145 32 L139 40 L146 38 Z" fill="#ad2933" />
        <circle cx="136" cy="45" fill="#ad2933" r="2.5" />
        <circle cx="132" cy="51" fill="#ad2933" opacity="0.6" r="1.5" />
        <g transform="translate(140, 5)">
          <rect fill="#FFFEFC" height="24" rx="4" stroke="#171717" stroke-width="1.8" width="80" x="0" y="0" />
          <polygon fill="#FFFEFC" points="12,24 18,29 20,24" stroke="#171717" stroke-width="1.8" />
          <text fill="#ad2933" font-family="'Barlow Condensed', sans-serif" font-size="12" font-weight="700" letter-spacing="0.5" text-anchor="middle" x="40" y="16">
            {{ bubbleText }}
          </text>
        </g>
      </svg>
    </div>

    <h3 class="font-condensed text-[26px] font-bold text-ink uppercase tracking-wider leading-tight">
      {{ title }}
    </h3>
    <p class="text-sm text-ink-muted max-w-xs mt-1.5 leading-relaxed">{{ description }}</p>

    <div class="mt-5 w-full max-w-xs">
      <button
        type="button"
        @click="onCta"
        class="w-full h-12 bg-primary text-on-primary rounded-xl font-condensed text-base font-bold border-2 border-ink manga-shadow active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
      >
        <PlusCircle class="w-5 h-5" />
        <span>{{ ctaLabel }}</span>
      </button>
    </div>

    <div v-if="tip" class="flex items-center gap-1.5 mt-3 text-ink-muted">
      <Lightbulb class="w-3.5 h-3.5 text-amber-muted" />
      <span class="text-[11px] font-semibold">{{ tip }}</span>
    </div>
  </div>
</template>
