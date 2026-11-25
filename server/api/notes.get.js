import { createError, defineEventHandler, getQuery } from 'h3'
import { callAppsScript } from '../utils/apps-script.js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const queryValue = (key, fallback = '') => {
    const value = query[key]
    if (value === undefined || value === '') return fallback
    if (typeof value !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `Parameter ${key} tidak valid.` })
    }
    return value.trim()
  }
  const positiveInteger = (key, fallback) => {
    const value = queryValue(key, '')
    if (!value) return fallback
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw createError({ statusCode: 400, statusMessage: `Parameter ${key} harus bilangan bulat positif.` })
    }
    return parsed
  }
  const category = queryValue('category').toUpperCase()
  const subtestCode = queryValue('subtest_code').toUpperCase()
  const search = queryValue('search')
  const allowedSubtests = new Set(['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'])

  if (category && category !== 'ALL' && category !== 'UTBK' && category !== 'RANDOM') {
    throw createError({ statusCode: 400, statusMessage: 'Kategori catatan tidak valid.' })
  }
  if (subtestCode && !allowedSubtests.has(subtestCode)) {
    throw createError({ statusCode: 400, statusMessage: 'Filter subtes tidak valid.' })
  }
  if (search.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Pencarian maksimal 200 karakter.' })
  }

  const perPage = Math.min(10, positiveInteger('per_page', 10))
  const data = await callAppsScript(event, 'listNotes', {
    page: positiveInteger('page', 1),
    per_page: perPage,
    search,
    category: category === 'ALL' ? '' : category,
    subtest_code: subtestCode,
  })

  if (
    !data ||
    !Array.isArray(data.items) ||
    !Number.isInteger(data.current_page) ||
    !Number.isInteger(data.per_page) ||
    !Number.isInteger(data.total_items) ||
    !Number.isInteger(data.total_pages)
  ) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Google Apps Script mengirim daftar catatan dengan format yang tidak sesuai.',
    })
  }

  return data
})
