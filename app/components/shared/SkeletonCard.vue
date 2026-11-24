<template>
  <div class="relative bg-surface rounded-xl p-4 border-2 border-ink manga-shadow space-y-4 overflow-hidden">
    <div class="flex items-center justify-between pb-2 border-b border-surface-container-high">
      <div class="flex items-center gap-2">
        <div class="h-4 w-28 bg-surface-container-highest rounded animate-pulse" />
        <div class="h-4 w-12 bg-manga-red-soft rounded animate-pulse" />
      </div>
      <div class="flex items-center gap-1.5 bg-surface-container-low px-2 py-0.5 rounded">
        <span class="w-2 h-2 rounded-full bg-amber-muted animate-pulse" />
        <span class="text-[10px] font-bold text-ink-muted uppercase">Memuat Data</span>
      </div>
    </div>

    <div class="p-3 bg-surface-container-low rounded-lg flex items-center justify-between gap-3">
      <div class="space-y-2 flex-1">
        <div class="h-3 w-20 bg-surface-container-highest rounded animate-pulse" />
        <div class="h-8 w-32 bg-surface-container-highest rounded animate-pulse" />
        <div class="h-2.5 w-40 bg-surface-container-highest rounded animate-pulse" />
      </div>
      <div class="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center animate-pulse">
        <div class="w-9 h-9 rounded-full bg-surface-container-low" />
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex justify-between items-center">
        <div class="h-3 w-32 bg-surface-container-highest rounded animate-pulse" />
        <div class="h-3 w-14 bg-surface-container-highest rounded animate-pulse" />
      </div>
      <div class="h-24 bg-surface-container-low rounded-lg p-3 flex items-end justify-between gap-2">
        <div class="w-1/6 bg-surface-container-highest rounded-t h-1/3 animate-pulse" />
        <div class="w-1/6 bg-surface-container-highest rounded-t h-2/3 animate-pulse" />
        <div class="w-1/6 bg-surface-container-highest rounded-t h-1/2 animate-pulse" />
        <div class="w-1/6 bg-surface-container-highest rounded-t h-4/5 animate-pulse" />
        <div class="w-1/6 bg-surface-container-highest rounded-t h-3/4 animate-pulse" />
        <div class="w-1/6 bg-primary-fixed rounded-t h-full animate-pulse" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 pt-1">
      <div class="h-9 bg-surface-container-low rounded-lg p-2 flex items-center gap-2">
        <div class="w-5 h-5 rounded-md bg-surface-container-highest animate-pulse" />
        <div class="h-3 w-20 bg-surface-container-highest rounded animate-pulse" />
      </div>
      <div class="h-9 bg-surface-container-low rounded-lg p-2 flex items-center gap-2">
        <div class="w-5 h-5 rounded-md bg-surface-container-highest animate-pulse" />
        <div class="h-3 w-16 bg-surface-container-highest rounded animate-pulse" />
      </div>
    </div>
  </div>
</template>
