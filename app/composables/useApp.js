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

  const rawSettings = data.settings
  const settings = {
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
  const dataError = useState('ichigo-app-error', () => '')
  const activeTab = useState(
    'ichigo-active-tab',
    () => Object.keys(TAB_PATHS).find((tab) => TAB_PATHS[tab] === currentRoute.path) || 'beranda',
  )
  const toasts = useState('ichigo-toasts', () => [])
  const confirmDialog = useState('ichigo-confirm-dialog', () => null)
  const isAddPlatformOpen = useState('ichigo-add-platform-open', () => false)
  const editingApplication = useState('ichigo-edit-application', () => null)
  const route = computed(() => {
    if (currentRoute.path === '/settings') return { type: 'settings' }
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
    toastTimers.set(id, setTimeout(() => dismissToast(id), 3600))
  }

  async function loadData() {
    isLoadingSkeleton.value = true
    dataError.value = ''
    try {
      const data = await $fetch('/api/app-data')
      Object.assign(state.value, mapData(data))
      initialized.value = true
      return true
    } catch (error) {
      dataError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Data gagal dimuat.'
      return false
    } finally {
      isLoadingSkeleton.value = false
    }
  }

  async function mutate(action, params) {
    dataError.value = ''
    try {
      await requestMutation(action, params)
      if (!(await loadData())) {
        pushToast({
          type: 'error',
          title: 'Pembaruan Belum Tampil',
          subtitle: 'Perubahan telah dikirim, tetapi data terbaru gagal dimuat.',
        })
        return false
      }
      return true
    } catch (error) {
      dataError.value = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Perubahan gagal disimpan.'
      pushToast({ type: 'error', title: 'Gagal Menyimpan', subtitle: dataError.value })
      return false
    }
  }

  function requestMutation(action, params) {
    return $fetch('/api/apps-script', {
      method: 'POST',
      body: { action, ...params },
    })
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
      }
      for (const code of additions) {
        await requestMutation('saveScheduleEntry', {
          data: { schedule_date: date, activity_code: code },
        })
      }
      if (!(await loadData())) {
        pushToast({
          type: 'error',
          title: 'Pembaruan Belum Tampil',
          subtitle: 'Perubahan telah dikirim, tetapi data terbaru gagal dimuat.',
        })
        return false
      }
      pushToast({ type: 'success', title: 'Jadwal Tersimpan', subtitle: 'Perubahan jadwal tersimpan di database.' })
      return true
    } catch (error) {
      const message = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Jadwal gagal disimpan.'
      await loadData()
      dataError.value = message
      pushToast({ type: 'error', title: 'Gagal Menyimpan Jadwal', subtitle: dataError.value })
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

  function exportTryoutsCsv() {
    const header = ['tryout_date', 'application_name', 'tryout_name', 'overall_score', ...SUBTEST_CODES]
    const rows = state.value.tryouts.map((item) => [
      item.date,
      `"${item.applicationName || ''}"`,
      `"${String(item.title || '').replaceAll('"', '""')}"`,
      item.averageScore ?? '',
      ...SUBTEST_CODES.map((code) => item.scores[code] ?? ''),
    ].join(','))
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tryout-scores.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    pushToast({ type: 'success', title: 'Ekspor CSV Selesai', subtitle: `${state.value.tryouts.length} data tryout diekspor.` })
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
    exportTryoutsCsv,
    toasts,
    pushToast,
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
