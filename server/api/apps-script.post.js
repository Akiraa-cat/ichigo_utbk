import { createError, defineEventHandler, readBody } from 'h3'
import { callAppsScript } from '../utils/apps-script.js'

const ACTIONS = new Set([
  'saveSettings',
  'saveApplication',
  'deleteApplication',
  'saveTryout',
  'deleteTryout',
  'saveSession',
  'deleteSession',
  'saveScheduleEntry',
  'deleteScheduleEntry',
])

export default defineEventHandler(async (event) => {
  const payload = await readBody(event)
  const action = payload?.action

  if (!ACTIONS.has(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Action API tidak didukung.' })
  }

  const params = { ...payload }
  delete params.action
  return callAppsScript(event, action, params, 'POST')
})
