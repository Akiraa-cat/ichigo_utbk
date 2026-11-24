import { createError } from 'h3'

export async function callAppsScript(event, action, params = {}, method = 'GET') {
  const { appsScriptUrl } = useRuntimeConfig(event)
  const configuredUrl = appsScriptUrl || process.env.APPS_SCRIPT_URL
  if (!configuredUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'APPS_SCRIPT_URL belum dikonfigurasi di sisi server.',
    })
  }

  const url = new URL(configuredUrl)
  const options = { method, redirect: 'follow' }

  if (method === 'GET') {
    url.searchParams.set('action', action)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    })
  } else {
    options.headers = { 'content-type': 'application/json' }
    options.body = JSON.stringify({ action, ...params })
  }

  const response = await fetch(url, options)
  const responseText = await response.text()
  let result

  try {
    result = JSON.parse(responseText)
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Google Apps Script mengirim respons yang tidak valid.',
    })
  }

  if (
    !response.ok ||
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    result.success !== true ||
    !Object.hasOwn(result, 'data')
  ) {
    throw createError({
      statusCode: 502,
      statusMessage:
        (typeof result?.error === 'string' && result.error) ||
        'Permintaan ke Google Apps Script gagal.',
    })
  }

  return result.data
}
