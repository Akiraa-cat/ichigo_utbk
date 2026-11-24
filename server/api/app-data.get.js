import { createError, defineEventHandler } from 'h3'
import { callAppsScript } from '../utils/apps-script.js'

export default defineEventHandler(async (event) => {
  const [settings, applications, tryouts, sessions, activityTypes, schedules] =
    await Promise.all([
      callAppsScript(event, 'getSettings'),
      callAppsScript(event, 'listApplications'),
      callAppsScript(event, 'listTryouts'),
      callAppsScript(event, 'listSessions'),
      callAppsScript(event, 'listActivityTypes'),
      callAppsScript(event, 'listSchedule'),
    ])

  if (
    !settings ||
    typeof settings !== 'object' ||
    Array.isArray(settings) ||
    ![applications, tryouts, sessions, activityTypes, schedules].every(Array.isArray) ||
    !sessions.every((session) => Array.isArray(session.subtests))
  ) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Google Apps Script mengirim data dengan format yang tidak sesuai.',
    })
  }

  return { settings, applications, tryouts, sessions, activityTypes, schedules }
})
