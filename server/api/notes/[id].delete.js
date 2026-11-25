import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { callAppsScript } from '../../utils/apps-script.js'

export default defineEventHandler(async (event) => {
  const noteId = getRouterParam(event, 'id')
  if (!noteId) {
    throw createError({ statusCode: 400, statusMessage: 'ID catatan wajib diisi.' })
  }

  const payload = await readBody(event)
  return callAppsScript(event, 'deleteNote', {
    note_id: noteId,
    request_id: payload?.request_id,
  }, 'POST')
})
