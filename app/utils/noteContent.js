export function extractNoteText(node) {
  if (!node || typeof node !== 'object') return ''
  const ownText = typeof node.text === 'string' ? node.text : ''
  const children = Array.isArray(node.content)
    ? node.content.map(extractNoteText).filter(Boolean).join(' ')
    : ''
  return [ownText, children].filter(Boolean).join(' ')
}

export function summarizeNoteContent(content, maxLength = 260) {
  const text = extractNoteText(content).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

export function hasNoteText(content) {
  return Boolean(extractNoteText(content).trim())
}

export function formatNoteDate(value, options = {}) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: options.short ? 'short' : 'long',
    year: 'numeric',
  }).format(date)
}
