import { computed, toRefs, watch } from 'vue'

const SUBTEST_CODES = ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM']
const TAB_PATHS = {
  beranda: '/',
  nilai: '/nilai',
  agenda: '/agenda',
  jadwal: '/jadwal',
  data: '/data',
}

function emptyState() {
  return {
    applications: [],
    platforms: [],
    tryouts: [],
    sessions: [],
    schedules: {},
    scheduleEntries: [],
    activityTypes: [],
    settings: {
      targetDate: '',
      targetScore: null,
      targetUniversity: '',
      targetMajor: '',
      focusSubtests: [],
      dailyTargetMinutes: null,
      pomodoroMinutes: null,
      timezone: '',
    },
  }
}

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function mapSettings(rawSettings) {
  return {
    targetDate: rawSettings.exam_date || '',
    targetScore: toNumberOrNull(rawSettings.target_score),
    targetUniversity: rawSettings.target_university || '',
    targetMajor: rawSettings.target_major || '',
    focusSubtests: String(rawSettings.focus_subtests || '')
      .split(',')
      .map((code) => code.trim())
      .filter(Boolean),
    dailyTargetMinutes: toNumberOrNull(rawSettings.daily_study_target),
    pomodoroMinutes: toNumberOrNull(rawSettings.preferred_session_duration),
    timezone: rawSettings.timezone || '',
  }
}

function mapData(data) {
  const applications = data.applications.map((item) => ({
    id: item.application_id,
    name: item.application_name,
    colorHex: item.chart_color,
  }))
  const applicationById = new Map(applications.map((item) => [item.id, item]))
  const activityTypes = data.activityTypes
    .filter((item) => String(item.is_active).toUpperCase() !== 'FALSE')
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((item) => ({
      code: item.activity_code,
      name: item.activity_name,
      backgroundColor: item.background_color,
      textColor: item.text_color,
      sortOrder: Number(item.sort_order || 0),
    }))
  const schedules = {}
  const scheduleEntries = data.schedules

  scheduleEntries.forEach((item) => {
    if (!schedules[item.schedule_date]) {
      schedules[item.schedule_date] = { date: item.schedule_date, activities: [] }
    }
    schedules[item.schedule_date].activities.push(item.activity_code)
  })

  const settings = mapSettings(data.settings)
  const tryouts = data.tryouts.map((item) => ({
    id: item.tryout_id,
    applicationId: item.application_id,
    applicationName: applicationById.get(item.application_id)?.name,
    applicationColor: applicationById.get(item.application_id)?.colorHex,
    title: item.tryout_name,
    date: item.tryout_date,
    averageScore: toNumberOrNull(item.overall_score),
    scores: Object.fromEntries(
      SUBTEST_CODES.map((code) => [code, toNumberOrNull(item[code])]),
    ),
    notes: item.notes || '',
  }))
  const sessions = data.sessions.map((item) => ({
    id: item.session_id,
    date: item.study_date,
    startTime: item.start_time,
    durationMinutes: toNumberOrNull(item.duration_minutes),
    subtests: item.subtests,
    notes: item.notes || '',
  }))

  return {
    applications,
    platforms: applications,
    tryouts,
    sessions,
    schedules,
    scheduleEntries,
    activityTypes,
    settings,
  }
}

export function useApp() {
  const state = useState('ichigo-app-state', emptyState)
  const currentRoute = useRoute()
  const initialized = useState('ichigo-app-initialized', () => false)
  const isLoadingSkeleton = useState('ichigo-app-loading', () => true)
  const isRefreshing = useState('ichigo-app-refreshing', () => false)
  const dataError = useState('ichigo-app-error', () => '')
  const refreshError = useState('ichigo-app-refresh-error', () => '')
  const loadRequestId = useState('ichigo-app-load-request', () => 0)
  const pendingRequestIds = useState('ichigo-pending-request-ids', () => ({}))
  const activeTab = useState(
    'ichigo-active-tab',
    () => currentRoute.path.startsWith('/memori')
      ? 'beranda'
      : Object.keys(TAB_PATHS).find((tab) => TAB_PATHS[tab] === currentRoute.path) || 'beranda',
  )
  const toasts = useState('ichigo-toasts', () => [])
  const confirmDialog = useState('ichigo-confirm-dialog', () => null)
  const isAddPlatformOpen = useState('ichigo-add-platform-open', () => false)
  const editingApplication = useState('ichigo-edit-application', () => null)
  const route = computed(() => {
    if (currentRoute.path === '/settings') return { type: 'settings' }
    if (currentRoute.path === '/memori') return { type: 'tab', tab: 'beranda' }
    if (currentRoute.path === '/memori/tulis') return { type: 'note_form' }
    if (currentRoute.path.startsWith('/memori/')) return { type: 'note_detail' }
    if (currentRoute.path === '/agenda/session') {
      return {
        type: 'study_form',
        date: currentRoute.query.date,
        sessionId: currentRoute.query.sessionId,
      }
    }
    if (currentRoute.path === '/nilai/tryout') {
      return { type: 'tryout_form', tryoutId: currentRoute.query.tryoutId }
    }
    return {
      type: 'tab',
      tab: Object.keys(TAB_PATHS).find((tab) => TAB_PATHS[tab] === currentRoute.path) || 'beranda',
    }
  })
  const toastTimers = new Map()
  const fields = toRefs(state.value)

  watch(
    () => currentRoute.path,
    () => {
      if (route.value.tab) activeTab.value = route.value.tab
      else if (currentRoute.path.startsWith('/memori')) activeTab.value = 'beranda'
      if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  )

  function dismissToast(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
    clearTimeout(toastTimers.get(id))
    toastTimers.delete(id)
  }

  function pushToast(toast) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    toasts.value = [...toasts.value.slice(-2), { ...toast, id }]
    if (toast.type !== 'error') {
      toastTimers.set(id, setTimeout(() => dismissToast(id), toast.type === 'warning' ? 6000 : 3600))
    }
  }

  function createRequestId() {
    const cryptoApi = globalThis.crypto
    if (cryptoApi?.randomUUID) return cryptoApi.randomUUID()
    if (!cryptoApi?.getRandomValues) throw new Error('Browser tidak mendukung pembuatan ID request yang aman.')
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  function requestFingerprint(params) {
    return JSON.stringify(params)
  }

  function getRequestId(action, params) {
    const fingerprint = requestFingerprint(params)
    const existing = pendingRequestIds.value[action]
    if (existing?.fingerprint === fingerprint) return existing.requestId
    const requestId = createRequestId()
    pendingRequestIds.value = {
      ...pendingRequestIds.value,
      [action]: { fingerprint, requestId },
    }
    return requestId
  }

  function completeRequestId(action, params) {
    const current = pendingRequestIds.value[action]
    if (!current || current.fingerprint !== requestFingerprint(params)) return
    const next = { ...pendingRequestIds.value }
    delete next[action]
    pendingRequestIds.value = next
  }

  async function loadData() {
    const requestId = ++loadRequestId.value
    const initialLoad = !initialized.value
    if (initialLoad) dataError.value = ''
    else refreshError.value = ''
    isLoadingSkeleton.value = initialLoad
    isRefreshing.value = !initialLoad
    try {
      const data = await $fetch('/api/app-data', { timeout: 30000 })
      if (requestId !== loadRequestId.value) return false
      Object.assign(state.value, mapData(data))
      initialized.value = true
      dataError.value = ''
      refreshError.value = ''
      return true
    } catch (error) {
      if (requestId !== loadRequestId.value) return false
      const message = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Data gagal dimuat.'
      if (initialLoad) dataError.value = message
      else refreshError.value = message
      return false
    } finally {
      if (requestId === loadRequestId.value) {
        isLoadingSkeleton.value = false
        isRefreshing.value = false
      }
    }
  }

  async function mutate(action, params) {
    try {
      const response = await requestMutation(action, params)
      applyMutationResult(action, params, response)
      await loadData()
      return true
    } catch (error) {
      const message = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Perubahan gagal disimpan.'
      pushToast({ type: 'error', title: 'Gagal Menyimpan', subtitle: message })
      return false
    }
  }

  async function requestMutation(action, params) {
    const requestId = getRequestId(action, params)
    const body = { action, ...params, request_id: requestId }
    const result = await $fetch('/api/apps-script', {
      method: 'POST',
      body,
      timeout: 30000,
    })
    completeRequestId(action, params)
    return result
  }

  function applyMutationResult(action, params, response) {
    if (action === 'saveSession' && response?.session_id) {
      const saved = {
        id: response.session_id,
        date: response.study_date,
        startTime: response.start_time,
        durationMinutes: toNumberOrNull(response.duration_minutes),
        subtests: response.subtests || [],
        notes: response.notes || '',
      }
      state.value.sessions = [
        ...state.value.sessions.filter((item) => item.id !== saved.id),
        saved,
      ]
      return
    }

    if (action === 'deleteSession') {
      state.value.sessions = state.value.sessions.filter((item) => item.id !== params.session_id)
      return
    }

    if (action === 'saveTryout' && response?.tryout_id) {
      const application = state.value.applications.find(
        (item) => item.id === response.application_id,
      )
      const saved = {
        id: response.tryout_id,
        applicationId: response.application_id,
        applicationName: application?.name,
        applicationColor: application?.colorHex,
        title: response.tryout_name,
        date: response.tryout_date,
        averageScore: toNumberOrNull(response.overall_score),
        scores: Object.fromEntries(
          SUBTEST_CODES.map((code) => [code, toNumberOrNull(response[code])]),
        ),
        notes: response.notes || '',
      }
      state.value.tryouts = [
        ...state.value.tryouts.filter((item) => item.id !== saved.id),
        saved,
      ]
      return
    }

    if (action === 'deleteTryout') {
      state.value.tryouts = state.value.tryouts.filter((item) => item.id !== params.tryout_id)
      return
    }

    if (action === 'saveApplication' && response?.application_id) {
      const saved = {
        id: response.application_id,
        name: response.application_name,
        colorHex: response.chart_color,
      }
      const applications = [
        ...state.value.applications.filter((item) => item.id !== saved.id),
        saved,
      ]
      state.value.applications = applications
      state.value.platforms = applications
      state.value.tryouts = state.value.tryouts.map((tryout) => {
        const application = applications.find((item) => item.id === tryout.applicationId)
        return {
          ...tryout,
          applicationName: application?.name,
          applicationColor: application?.colorHex,
        }
      })
      return
    }

    if (action === 'deleteApplication') {
      const applications = state.value.applications.filter((item) => item.id !== params.application_id)
      state.value.applications = applications
      state.value.platforms = applications
      state.value.tryouts = state.value.tryouts.map((tryout) => (
        tryout.applicationId === params.application_id
          ? { ...tryout, applicationName: undefined, applicationColor: undefined }
          : tryout
      ))
      return
    }

    if (action === 'saveSettings' && response) {
      state.value.settings = mapSettings(response)
    }
  }

  function rebuildScheduleIndex() {
    const schedules = {}
    state.value.scheduleEntries.forEach((entry) => {
      if (!schedules[entry.schedule_date]) {
        schedules[entry.schedule_date] = { date: entry.schedule_date, activities: [] }
      }
      schedules[entry.schedule_date].activities.push(entry.activity_code)
    })
    state.value.schedules = schedules
  }

  function navigateTab(tab) {
    activeTab.value = tab
    return navigateTo(TAB_PATHS[tab] || '/')
  }

  function openStudyForm(opts = {}) {
    return navigateTo({
      path: '/agenda/session',
      query: {
        ...(opts.date ? { date: opts.date } : {}),
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
      },
    })
  }

  function openTryoutForm(tryoutId) {
    return navigateTo({
      path: '/nilai/tryout',
      query: tryoutId ? { tryoutId } : {},
    })
  }

  function openSettings() {
    return navigateTo('/settings')
  }

  function getActivity(code) {
    return state.value.activityTypes.find((activity) => activity.code === code)
  }

  function goBackToTab() {
    return navigateTo(TAB_PATHS[activeTab.value] || '/')
  }

  async function saveSession(payload) {
    const saved = await mutate('saveSession', {
      data: {
        ...(payload.id ? { session_id: payload.id } : {}),
        study_date: payload.date,
        start_time: payload.startTime,
        duration_minutes: payload.durationMinutes,
        subtests: payload.subtests,
        notes: payload.notes,
      },
    })
    if (saved) pushToast({ type: 'success', title: 'Sesi Tersimpan', subtitle: 'Data sesi belajar tersimpan di database.' })
    return saved
  }

  async function deleteSession(id) {
    const deleted = await mutate('deleteSession', { session_id: id })
    if (deleted) pushToast({ type: 'success', title: 'Sesi Dihapus', subtitle: 'Catatan sesi belajar telah dihapus.' })
    return deleted
  }

  async function saveTryout(payload) {
    const saved = await mutate('saveTryout', {
      data: {
        ...(payload.id ? { tryout_id: payload.id } : {}),
        application_id: payload.applicationId,
        tryout_name: payload.title,
        tryout_date: payload.date,
        ...payload.scores,
        overall_score: payload.averageScore,
        notes: payload.notes,
      },
    })
    if (saved) pushToast({ type: 'success', title: 'Nilai Tersimpan', subtitle: 'Data tryout tersimpan di database.' })
    return saved
  }

  async function deleteTryout(id) {
    const deleted = await mutate('deleteTryout', { tryout_id: id })
    if (deleted) pushToast({ type: 'success', title: 'Tryout Dihapus', subtitle: 'Catatan nilai telah dihapus.' })
    return deleted
  }

  function openApplicationForm(application = null) {
    editingApplication.value = application
    isAddPlatformOpen.value = true
  }

  async function saveApplication(payload) {
    const saved = await mutate('saveApplication', {
      data: {
        ...(payload.id ? { application_id: payload.id } : {}),
        application_name: payload.name,
        chart_color: payload.colorHex,
      },
    })
    if (saved) pushToast({ type: 'success', title: 'Aplikasi Tersimpan', subtitle: 'Aplikasi tryout tersimpan di database.' })
    return saved
  }

  async function deletePlatform(id) {
    const deleted = await mutate('deleteApplication', { application_id: id })
    if (deleted) pushToast({ type: 'success', title: 'Aplikasi Dihapus', subtitle: 'Data aplikasi telah dihapus.' })
    return deleted
  }

  async function saveDaySchedule(date, activities) {
    const currentEntries = state.value.scheduleEntries.filter((entry) => entry.schedule_date === date)
    const currentCodes = new Set(currentEntries.map((entry) => entry.activity_code))
    const selectedCodes = new Set(activities)
    try {
      const removals = currentEntries.filter((entry) => !selectedCodes.has(entry.activity_code))
      const additions = activities.filter((code) => !currentCodes.has(code))
      for (const entry of removals) {
        await requestMutation('deleteScheduleEntry', { schedule_id: entry.schedule_id })
        state.value.scheduleEntries = state.value.scheduleEntries.filter(
          (item) => item.schedule_id !== entry.schedule_id,
        )
        rebuildScheduleIndex()
      }
      for (const code of additions) {
        const saved = await requestMutation('saveScheduleEntry', {
          data: { schedule_date: date, activity_code: code },
        })
        if (saved?.schedule_id) {
          state.value.scheduleEntries = [
            ...state.value.scheduleEntries.filter((item) => item.schedule_id !== saved.schedule_id),
            saved,
          ]
          rebuildScheduleIndex()
        }
      }
      await loadData()
      pushToast({ type: 'success', title: 'Jadwal Tersimpan', subtitle: 'Perubahan jadwal tersimpan di database.' })
      return true
    } catch (error) {
      const message = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Jadwal gagal disimpan.'
      pushToast({ type: 'error', title: 'Gagal Menyimpan Jadwal', subtitle: message })
      return false
    }
  }

  async function updateSettings(next) {
    const saved = await mutate('saveSettings', {
      settings: {
        exam_date: next.targetDate,
        target_score: next.targetScore,
        target_university: next.targetUniversity,
        target_major: next.targetMajor,
        focus_subtests: next.focusSubtests.join(','),
        daily_study_target: next.dailyTargetMinutes,
        preferred_session_duration: next.pomodoroMinutes,
      },
    })
    if (saved) pushToast({ type: 'success', title: 'Pengaturan Tersimpan', subtitle: 'Perubahan tersimpan di database.' })
    return saved
  }

  return {
    ...fields,
    initialized,
    dataError,
    route,
    activeTab,
    navigateTab,
    openStudyForm,
    openTryoutForm,
    openSettings,
    goBackToTab,
    loadData,
    isRefreshing,
    refreshError,
    getActivity,
    saveSession,
    deleteSession,
    saveTryout,
    deleteTryout,
    openApplicationForm,
    editingApplication,
    saveApplication,
    deletePlatform,
    saveDaySchedule,
    updateSettings,
    toasts,
    pushToast,
    getRequestId,
    completeRequestId,
    dismissToast,
    confirmDialog,
    askConfirm: (dialog) => {
      confirmDialog.value = dialog
    },
    closeConfirm: () => {
      confirmDialog.value = null
    },
    isAddPlatformOpen,
    setAddPlatformOpen: (open) => {
      isAddPlatformOpen.value = open
      if (!open) editingApplication.value = null
    },
    isLoadingSkeleton,
  }
}
