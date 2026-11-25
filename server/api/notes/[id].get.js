import { createError, defineEventHandler, getRouterParam } from 'h3'
import { callAppsScript } from '../../utils/apps-script.js'

export default defineEventHandler(async (event) => {
  const noteId = getRouterParam(event, 'id')
  if (!noteId) {
    throw createError({ statusCode: 400, statusMessage: 'ID catatan wajib diisi.' })
  }

  return callAppsScript(event, 'getNote', { note_id: noteId })
})
