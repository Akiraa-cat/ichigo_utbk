import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { callAppsScript } from '../../utils/apps-script.js'

export default defineEventHandler(async (event) => {
  const noteId = getRouterParam(event, 'id')
  const payload = await readBody(event)
  if (!noteId || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createError({ statusCode: 400, statusMessage: 'Data catatan tidak valid.' })
  }
  if (
    !payload.content ||
    typeof payload.content !== 'object' ||
    Array.isArray(payload.content) ||
    payload.content.type !== 'doc' ||
    !Array.isArray(payload.subtests)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Konten harus berupa rich text JSON dan subtests harus berupa array.',
    })
  }

  const { request_id: requestId, ...data } = payload
  return callAppsScript(event, 'saveNote', {
    request_id: requestId,
    data: {
      ...data,
      note_id: noteId,
    },
  }, 'POST')
})
