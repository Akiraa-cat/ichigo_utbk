import { createError, defineEventHandler, readBody } from 'h3'
import { callAppsScript } from '../utils/apps-script.js'

export default defineEventHandler(async (event) => {
  const payload = await readBody(event)
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createError({ statusCode: 400, statusMessage: 'Data catatan tidak valid.' })
  }
  if (payload.note_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Catatan baru tidak menerima note_id; gunakan endpoint update untuk mengubah catatan.',
    })
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
    data,
    request_id: requestId,
  }, 'POST')
})
