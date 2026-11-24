export default defineNuxtPlugin(() => {
  const { initialized, loadData } = useApp()
  const splashVisible = useState('ichigo-startup-splash', () => true)
  const { initializeInstallDetection, activateInstallUI } = usePwaInstall()

  initializeInstallDetection()

  if (!import.meta.dev && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.error('PWA service worker registration failed.', error)
    })
  }

  onNuxtReady(() => {
    activateInstallUI()
    const startedAt = Date.now()
    const maxSplashTimer = window.setTimeout(() => {
      splashVisible.value = false
    }, 5000)

    void (async () => {
      try {
        if (!initialized.value) await loadData()
      } finally {
        const remainingSplashTime = Math.max(0, 2000 - (Date.now() - startedAt))
        if (remainingSplashTime > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingSplashTime))
        }
        window.clearTimeout(maxSplashTimer)
        splashVisible.value = false
      }
    })()
  })
})
