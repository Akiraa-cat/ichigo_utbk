<template>
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-paper px-6 text-center"
    role="status"
    aria-live="polite"
    aria-label="Menyiapkan aplikasi"
  >
    <div class="absolute inset-0 manga-dots opacity-10" />
    <div class="splash-speedlines pointer-events-none absolute inset-0" />
    <div class="relative flex flex-col items-center">
      <img
        src="/assets/images/ichigo-logo.png"
        alt=""
        class="mb-5 h-24 w-24 rounded-2xl border-2 border-ink object-cover manga-shadow"
      >
      <h1 class="font-bebas text-3xl tracking-wider text-ink">
        UTBK STUDY JOURNAL
      </h1>
      <p class="mt-2 font-bold text-primary">準備中...</p>
      <p class="mt-1 text-xs text-ink-muted">Preparing your study journey...</p>
      <span class="splash-loader mt-5" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.splash-speedlines {
  background: repeating-conic-gradient(
    from 8deg at 50% 50%,
    transparent 0deg 12deg,
    rgb(217 74 80 / 7%) 12.5deg 13deg,
    transparent 13.5deg 24deg
  );
  mask-image: radial-gradient(ellipse at center, transparent 0 25%, #000 78%);
}

.splash-loader {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgb(217 74 80 / 25%);
  border-top-color: #d94a50;
  border-radius: 50%;
  animation: splash-spin 0.9s linear infinite;
}

@keyframes splash-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .splash-loader {
    animation: none;
  }
}
</style>
