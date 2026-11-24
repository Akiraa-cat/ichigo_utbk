let deferredInstallPrompt = null
let installListenersInitialized = false
let installUiReady = false
let displayModeQuery = null
let installedEventReceived = false
let detectedManualInstructions = ''

export function usePwaInstall() {
  const canInstall = useState('pwa-can-install', () => false)
  const isInstalled = useState('pwa-is-installed', () => false)
  const manualInstallInstructions = useState('pwa-manual-instructions', () => '')

  function updateStandaloneState() {
    if (!installUiReady) return

    isInstalled.value =
      installedEventReceived ||
      displayModeQuery.matches ||
      window.navigator.standalone === true
    if (isInstalled.value) {
      deferredInstallPrompt = null
      canInstall.value = false
    }
  }

  function initializeInstallDetection() {
    if (!import.meta.client || installListenersInitialized) return
    installListenersInitialized = true

    const userAgent = window.navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(userAgent)
    const isAndroid = /android/i.test(userAgent)
    const isEdge = /edg/i.test(userAgent)
    const isChrome = /chrome|chromium/i.test(userAgent) && !isEdge
    const isDesktopSafari = /safari/i.test(userAgent) && !isIOS && !isChrome && !isEdge

    if (isIOS) {
      detectedManualInstructions =
        'Di Safari, tekan Bagikan lalu pilih Tambahkan ke Layar Utama.'
    } else if (isEdge) {
      detectedManualInstructions =
        'Buka menu Edge lalu pilih Apps → Install this site as an app.'
    } else if (isChrome && isAndroid) {
      detectedManualInstructions =
        'Buka menu Chrome ⋮ lalu pilih Install app atau Add to Home screen.'
    } else if (isChrome) {
      detectedManualInstructions =
        'Pilih ikon Install di bilah alamat, atau buka menu Chrome ⋮ lalu pilih Install page as app.'
    } else if (isDesktopSafari) {
      detectedManualInstructions =
        'Di Safari, buka menu File lalu pilih Add to Dock.'
    }

    displayModeQuery = window.matchMedia('(display-mode: standalone)')
    if (displayModeQuery.addEventListener) {
      displayModeQuery.addEventListener('change', updateStandaloneState)
    } else {
      displayModeQuery.addListener(updateStandaloneState)
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      if (installedEventReceived) return
      deferredInstallPrompt = event
      if (installUiReady) canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      installedEventReceived = true
      deferredInstallPrompt = null
      updateStandaloneState()
    })
  }

  function activateInstallUI() {
    if (!import.meta.client) return
    installUiReady = true
    manualInstallInstructions.value = detectedManualInstructions
    updateStandaloneState()
    canInstall.value = Boolean(deferredInstallPrompt) && !isInstalled.value
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) {
      return { outcome: 'unavailable' }
    }

    const installPrompt = deferredInstallPrompt
    deferredInstallPrompt = null
    canInstall.value = false

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      return choice
    } catch (error) {
      return { outcome: 'error', error }
    }
  }

  return {
    canInstall,
    isInstalled,
    manualInstallInstructions,
    initializeInstallDetection,
    activateInstallUI,
    promptInstall,
  }
}
