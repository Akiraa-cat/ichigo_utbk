import { SUBTEST_ORDER } from './subtests.js'

const REPORT_TITLE = 'UTBK Study Journal - Score Progress Report'
const SUBTEST_NAMES = {
  PU: 'Penalaran Umum',
  PPU: 'Pengetahuan dan Pemahaman Umum',
  PBM: 'Pemahaman Bacaan dan Menulis',
  PK: 'Pengetahuan Kuantitatif',
  LBI: 'Literasi Bahasa Indonesia',
  LBE: 'Literasi Bahasa Inggris',
  PM: 'Penalaran Matematika',
}
const COLORS = {
  red: [217, 74, 80],
  redDark: [173, 41, 51],
  ink: [23, 23, 23],
  muted: [100, 100, 100],
  paper: [248, 245, 240],
  grid: [220, 216, 210],
  white: [255, 255, 255],
  series: [
    [217, 74, 80],
    [52, 102, 160],
    [74, 133, 92],
    [180, 118, 45],
    [116, 87, 150],
    [44, 133, 139],
    [186, 93, 122],
  ],
}
const SCORE_MIN = 100
const SCORE_MAX = 1000
const PAGE_MARGIN = 14

function parseScore(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const score = Number(value)
  return Number.isFinite(score) && score >= SCORE_MIN && score <= SCORE_MAX ? score : null
}

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
    ? date
    : null
}

function compareTryouts(a, b) {
  const dateA = parseIsoDate(a.date)?.getTime() ?? Number.NEGATIVE_INFINITY
  const dateB = parseIsoDate(b.date)?.getTime() ?? Number.NEGATIVE_INFINITY
  return dateA - dateB || String(a.date || '').localeCompare(String(b.date || ''))
}

function formatNumber(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(Number(value))
}

function formatScore(value) {
  const score = parseScore(value)
  return score === null ? '—' : formatNumber(score)
}

function formatDate(value, options = {}) {
  const date = parseIsoDate(value)
  if (!date) return 'Tanggal tidak tersedia'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(date)
}

function getTimestampParts(date, timeZone) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
  if (timeZone) options.timeZone = timeZone
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date)
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
}

function formatGeneratedAt(date, timeZone) {
  const options = { dateStyle: 'long', timeStyle: 'short' }
  if (timeZone) options.timeZone = timeZone
  return new Intl.DateTimeFormat('id-ID', options).format(date)
}

function summarize(values, orderedTryouts, selectValue) {
  const valid = values.filter((entry) => entry.value !== null)
  const latest = [...orderedTryouts].reverse().find((record) =>
    parseIsoDate(record.date) && selectValue(record) !== null,
  )
  return {
    count: valid.length,
    average: valid.length ? valid.reduce((sum, entry) => sum + entry.value, 0) / valid.length : null,
    highest: valid.length ? Math.max(...valid.map((entry) => entry.value)) : null,
    lowest: valid.length ? Math.min(...valid.map((entry) => entry.value)) : null,
    latest: latest
      ? { value: selectValue(latest), date: latest.date, title: latest.title || '' }
      : null,
  }
}

export function calculateTryoutReportMetrics(tryouts, targetScore = null) {
  const orderedTryouts = [...tryouts].sort(compareTryouts)
  const overallValues = orderedTryouts.map((record) => ({
    record,
    value: parseScore(record.averageScore),
  }))
  const overall = summarize(overallValues, orderedTryouts, (record) => parseScore(record.averageScore))
  const subtests = Object.fromEntries(SUBTEST_ORDER.map((code) => {
    const values = orderedTryouts.map((record) => ({
      record,
      value: parseScore(record.scores?.[code]),
    }))
    return [code, summarize(values, orderedTryouts, (record) => parseScore(record.scores?.[code]))]
  }))
  const validDates = orderedTryouts
    .map((record) => record.date)
    .filter((date) => parseIsoDate(date))

  return {
    orderedTryouts,
    overall,
    subtests,
    targetScore: parseScore(targetScore),
    period: validDates.length
      ? { start: validDates[0], end: validDates[validDates.length - 1] }
      : null,
  }
}

function setColor(doc, method, color) {
  doc[method](...color)
}

function drawTopRule(doc, pageWidth) {
  doc.setFillColor(...COLORS.red)
  doc.rect(0, 0, pageWidth, 4, 'F')
}

function drawSectionHeading(doc, number, title, subtitle = '') {
  const pageWidth = doc.internal.pageSize.getWidth()
  drawTopRule(doc, pageWidth)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, 'setTextColor', COLORS.redDark)
  doc.text(number, PAGE_MARGIN, 12)
  doc.setFontSize(18)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text(title, PAGE_MARGIN, 22)
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, 'setTextColor', COLORS.muted)
    doc.text(subtitle, PAGE_MARGIN, 29)
  }
  doc.setDrawColor(...COLORS.grid)
  doc.setLineWidth(0.25)
  doc.line(PAGE_MARGIN, 33, pageWidth - PAGE_MARGIN, 33)
}

function drawFooter(doc, pageNumber, pageCount) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...COLORS.grid)
  doc.setLineWidth(0.25)
  doc.line(PAGE_MARGIN, pageHeight - 10, pageWidth - PAGE_MARGIN, pageHeight - 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setColor(doc, 'setTextColor', COLORS.muted)
  doc.text('UTBK Study Journal  |  Laporan berdasarkan data Try Out tersimpan', PAGE_MARGIN, pageHeight - 6)
  doc.text(`${pageNumber} / ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 6, { align: 'right' })
}

function drawMetricCard(doc, x, y, width, height, label, value, caption) {
  doc.setFillColor(...COLORS.paper)
  doc.setDrawColor(...COLORS.grid)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setColor(doc, 'setTextColor', COLORS.muted)
  doc.text(label.toUpperCase(), x + 3, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(value.length > 14 ? 12 : 17)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text(value, x + 3, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  setColor(doc, 'setTextColor', COLORS.muted)
  doc.text(caption, x + 3, y + height - 3)
}

function drawScoreRange(doc, x, y, width, metrics) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text('Rentang nilai keseluruhan', x, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setColor(doc, 'setTextColor', COLORS.muted)
  doc.text('Berdasarkan nilai valid (100-1000)', x + width, y, { align: 'right' })

  const lineY = y + 12
  const lineStart = x + 2
  const lineEnd = x + width - 2
  doc.setLineWidth(1)
  doc.setDrawColor(...COLORS.grid)
  doc.line(lineStart, lineY, lineEnd, lineY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text('100', lineStart, lineY + 5)
  doc.text('1000', lineEnd, lineY + 5, { align: 'right' })

  const { lowest, highest, average, latest } = metrics.overall
  if (lowest === null || highest === null) {
    doc.setFontSize(8)
    doc.text('Data belum tersedia untuk membuat rentang nilai.', lineStart, lineY + 10)
    return
  }
  const toX = (value) => lineStart + ((value - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * (lineEnd - lineStart)
  doc.setDrawColor(...COLORS.red)
  doc.setLineWidth(2.2)
  doc.line(toX(lowest), lineY, toX(highest), lineY)
  doc.setFillColor(...COLORS.ink)
  doc.circle(toX(lowest), lineY, 1.5, 'F')
  doc.circle(toX(highest), lineY, 1.5, 'F')
  if (average !== null) {
    doc.setFillColor(...COLORS.redDark)
    doc.circle(toX(average), lineY, 2, 'F')
  }
  if (latest) {
    doc.setFillColor(...COLORS.white)
    doc.setDrawColor(...COLORS.ink)
    doc.setLineWidth(0.8)
    doc.circle(toX(latest.value), lineY, 2.2, 'FD')
  }
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text(`Terendah ${formatScore(lowest)}   Rata-rata ${formatScore(average)}   Tertinggi ${formatScore(highest)}`, x, lineY + 11)
  if (latest) {
    doc.setFontSize(6.5)
    setColor(doc, 'setTextColor', COLORS.muted)
    doc.text(`Lingkaran: nilai terbaru ${formatScore(latest.value)} (${formatDate(latest.date)})`, x, lineY + 16)
  }
}

function drawSummaryPage(doc, metrics, tryouts, options, generatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth()
  drawTopRule(doc, pageWidth)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, 'setTextColor', COLORS.redDark)
  doc.text('UTBK STUDY JOURNAL  /  SCORE PROGRESS REPORT', PAGE_MARGIN, 12)
  doc.setFontSize(17)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text(doc.splitTextToSize(REPORT_TITLE, pageWidth - PAGE_MARGIN * 2), PAGE_MARGIN, 23)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  setColor(doc, 'setTextColor', COLORS.muted)
  doc.text(`Dibuat ${formatGeneratedAt(generatedAt, options.timeZone)}`, PAGE_MARGIN, 32)
  const period = metrics.period
    ? `${formatDate(metrics.period.start)} - ${formatDate(metrics.period.end)}`
    : 'Tanggal tidak tersedia'
  doc.text(`Periode data: ${period}  |  ${tryouts.length} Try Out tercatat`, PAGE_MARGIN, 38)

  const cardGap = 4
  const cardWidth = (pageWidth - PAGE_MARGIN * 2 - cardGap) / 2
  const recordsLabel = (count) => count ? `${count} nilai valid` : 'Data belum tersedia'
  const cards = [
    ['Rata-rata keseluruhan', formatScore(metrics.overall.average), recordsLabel(metrics.overall.count)],
    ['Nilai tertinggi', formatScore(metrics.overall.highest), recordsLabel(metrics.overall.count)],
    ['Nilai terendah', formatScore(metrics.overall.lowest), recordsLabel(metrics.overall.count)],
    [
      'Nilai terbaru',
      formatScore(metrics.overall.latest?.value),
      metrics.overall.latest ? formatDate(metrics.overall.latest.date) : 'Data belum tersedia',
    ],
  ]
  cards.forEach((card, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    drawMetricCard(
      doc,
      PAGE_MARGIN + column * (cardWidth + cardGap),
      45 + row * 30,
      cardWidth,
      26,
      ...card,
    )
  })

  drawScoreRange(doc, PAGE_MARGIN, 111, pageWidth - PAGE_MARGIN * 2, metrics)

  const targetY = 151
  const targetHeight = 29
  doc.setFillColor(...COLORS.white)
  doc.setDrawColor(...COLORS.grid)
  doc.roundedRect(PAGE_MARGIN, targetY, pageWidth - PAGE_MARGIN * 2, targetHeight, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text('TARGET NILAI PENGGUNA', PAGE_MARGIN + 4, targetY + 7)
  if (metrics.targetScore === null) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, 'setTextColor', COLORS.muted)
    doc.text('Target nilai belum diatur pada profil.', PAGE_MARGIN + 4, targetY + 19)
  } else {
    const difference = metrics.overall.average === null ? null : metrics.overall.average - metrics.targetScore
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    setColor(doc, 'setTextColor', COLORS.redDark)
    doc.text(formatScore(metrics.targetScore), PAGE_MARGIN + 4, targetY + 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, 'setTextColor', COLORS.ink)
    doc.text(
      difference === null
        ? 'Belum cukup data untuk menghitung selisih dengan rata-rata.'
        : `Selisih rata-rata saat ini terhadap target: ${difference > 0 ? '+' : ''}${formatNumber(difference)}`,
      PAGE_MARGIN + 31,
      targetY + 19,
    )
  }

  const filters = [
    `Filter aplikasi: ${options.applicationFilter || 'Semua aplikasi'}`,
    options.searchTerm ? `Pencarian: "${options.searchTerm}"` : '',
  ].filter(Boolean)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setColor(doc, 'setTextColor', COLORS.muted)
  doc.text(doc.splitTextToSize(filters.join('  |  '), pageWidth - PAGE_MARGIN * 2), PAGE_MARGIN, 191)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.text('Ringkasan dan grafik hanya menghitung nilai valid; skor kosong atau di luar rentang 100-1000 tidak dianggap nol.', PAGE_MARGIN, 202)
}

function drawSubtestAnalysisPage(doc, metrics) {
  const pageWidth = doc.internal.pageSize.getWidth()
  drawSectionHeading(doc, '02  /  ANALISIS', 'Analisis Nilai per Subtes', 'Perhitungan per subtes menggunakan hanya nilai valid yang tersedia.')

  const x = PAGE_MARGIN
  const y = 40
  const widths = [45, 28, 28, 28, 32, 17]
  const headers = ['Subtes', 'Rata-rata', 'Tertinggi', 'Terendah', 'Terbaru', 'Data']
  const rowHeight = 11
  const tableWidth = widths.reduce((sum, width) => sum + width, 0)
  doc.setFillColor(...COLORS.ink)
  doc.rect(x, y, tableWidth, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setColor(doc, 'setTextColor', COLORS.white)
  let colX = x
  headers.forEach((header, index) => {
    doc.text(header, colX + 2, y + 6)
    colX += widths[index]
  })

  SUBTEST_ORDER.forEach((code, index) => {
    const rowY = y + 9 + index * rowHeight
    if (index % 2 === 0) {
      doc.setFillColor(...COLORS.paper)
      doc.rect(x, rowY, tableWidth, rowHeight, 'F')
    }
    doc.setDrawColor(...COLORS.grid)
    doc.setLineWidth(0.2)
    doc.line(x, rowY + rowHeight, x + tableWidth, rowY + rowHeight)
    const subtest = metrics.subtests[code]
    const cells = [
      `${code}  ${SUBTEST_NAMES[code]}`,
      formatScore(subtest.average),
      formatScore(subtest.highest),
      formatScore(subtest.lowest),
      formatScore(subtest.latest?.value),
      String(subtest.count),
    ]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.6)
    setColor(doc, 'setTextColor', COLORS.ink)
    colX = x
    cells.forEach((cell, cellIndex) => {
      const alignRight = cellIndex > 0
      doc.text(cell, colX + (alignRight ? widths[cellIndex] - 2 : 2), rowY + 7, {
        align: alignRight ? 'right' : 'left',
        maxWidth: widths[cellIndex] - 4,
      })
      colX += widths[cellIndex]
    })
  })

  const chartY = 139
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text('Perbandingan rata-rata subtes', x, chartY)
  const labelWidth = 39
  const barX = x + labelWidth
  const barWidth = pageWidth - PAGE_MARGIN * 2 - labelWidth - 14
  const startY = chartY + 12
  SUBTEST_ORDER.forEach((code, index) => {
    const rowY = startY + index * 17
    const metric = metrics.subtests[code]
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setColor(doc, 'setTextColor', COLORS.ink)
    doc.text(code, x, rowY + 4)
    doc.setFillColor(...COLORS.paper)
    doc.rect(barX, rowY, barWidth, 5, 'F')
    doc.setDrawColor(...COLORS.grid)
    doc.setLineWidth(0.2)
    doc.rect(barX, rowY, barWidth, 5)
    if (metric.average !== null) {
      const visibleRatio = (metric.average - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)
      doc.setFillColor(...COLORS.red)
      doc.rect(barX, rowY, Math.max(0.8, visibleRatio * barWidth), 5, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text(formatScore(metric.average), barX + barWidth + 3, rowY + 4)
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(6.5)
      setColor(doc, 'setTextColor', COLORS.muted)
      doc.text('Data belum tersedia', barX + 2, rowY + 4)
    }
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  setColor(doc, 'setTextColor', COLORS.muted)
  doc.text('Skala nilai 100-1000; bar menunjukkan rata-rata valid.', barX, startY + SUBTEST_ORDER.length * 17 + 3)
}

function chartY(value, top, height) {
  return top + height - ((value - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * height
}

function drawTrendGrid(doc, x, y, width, height, compact = false) {
  const ticks = compact ? [100, 1000] : [100, 400, 700, 1000]
  doc.setDrawColor(...COLORS.grid)
  doc.setLineWidth(0.2)
  ticks.forEach((score) => {
    const lineY = chartY(score, y, height)
    doc.line(x, lineY, x + width, lineY)
    if (!compact) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      setColor(doc, 'setTextColor', COLORS.muted)
      doc.text(String(score), x - 2, lineY + 2, { align: 'right' })
    }
  })
}

function drawTrendSeries(doc, records, selector, x, y, width, height, color, labelPoints = false) {
  let previous = null
  const validPoints = []
  records.forEach((record, index) => {
    const value = parseScore(selector(record))
    if (value === null) {
      previous = null
      return
    }
    const pointX = records.length === 1 ? x + width / 2 : x + (index / (records.length - 1)) * width
    const pointY = chartY(value, y, height)
    if (previous) {
      doc.setDrawColor(...color)
      doc.setLineWidth(0.8)
      doc.line(previous.x, previous.y, pointX, pointY)
    }
    doc.setFillColor(...color)
    doc.circle(pointX, pointY, 1, 'F')
    if (labelPoints) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.5)
      setColor(doc, 'setTextColor', color)
      doc.text(formatScore(value), pointX, pointY - 2, { align: 'center' })
    }
    previous = { x: pointX, y: pointY }
    validPoints.push({ x: pointX, y: pointY, value, record })
  })
  return validPoints
}

function drawMainTrendChart(doc, records, metrics) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const x = PAGE_MARGIN + 10
  const y = 47
  const width = pageWidth - PAGE_MARGIN * 2 - 12
  const height = 48
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text('Nilai keseluruhan dari waktu ke waktu', PAGE_MARGIN, 41)
  drawTrendGrid(doc, x, y, width, height)
  const recordsWithDate = metrics.orderedTryouts.filter((record) => parseIsoDate(record.date))
  const points = drawTrendSeries(
    doc,
    recordsWithDate,
    (record) => record.averageScore,
    x,
    y,
    width,
    height,
    COLORS.red,
    recordsWithDate.length <= 8,
  )

  if (points.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    setColor(doc, 'setTextColor', COLORS.muted)
    doc.text('Belum ada nilai keseluruhan valid untuk ditampilkan.', x + width / 2, y + height / 2, { align: 'center' })
  } else {
    const labelIndexes = new Set([0, recordsWithDate.length - 1])
    const step = Math.max(1, Math.ceil(recordsWithDate.length / 5))
    for (let index = step; index < recordsWithDate.length - 1; index += step) labelIndexes.add(index)
    labelIndexes.forEach((index) => {
      if (!recordsWithDate[index]) return
      const labelX = recordsWithDate.length === 1
        ? x + width / 2
        : x + (index / (recordsWithDate.length - 1)) * width
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      setColor(doc, 'setTextColor', COLORS.muted)
      doc.text(formatDate(recordsWithDate[index].date), labelX, y + height + 8, { align: 'center' })
    })
    const lastPoint = points[points.length - 1]
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    setColor(doc, 'setTextColor', COLORS.redDark)
    doc.text(`Terbaru ${formatScore(lastPoint.value)}`, x + width, y - 2, { align: 'right' })
  }
}

function drawSubtestTrendCard(doc, x, y, width, height, code, records, color) {
  doc.setFillColor(...COLORS.white)
  doc.setDrawColor(...COLORS.grid)
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, width, height, 1, 1, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text(`${code}  ${SUBTEST_NAMES[code]}`, x + 2, y + 5)

  const chartX = x + 3
  const chartYValue = y + 10
  const chartWidth = width - 6
  const chartHeight = height - 14
  drawTrendGrid(doc, chartX, chartYValue, chartWidth, chartHeight, true)
  const validPoints = drawTrendSeries(
    doc,
    records,
    (record) => record.scores?.[code],
    chartX,
    chartYValue,
    chartWidth,
    chartHeight,
    color,
  )
  if (validPoints.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(5.5)
    setColor(doc, 'setTextColor', COLORS.muted)
    doc.text('Data belum tersedia', chartX + chartWidth / 2, chartYValue + chartHeight / 2 + 1, { align: 'center' })
  } else {
    const last = validPoints[validPoints.length - 1]
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.5)
    setColor(doc, 'setTextColor', color)
    doc.text(formatScore(last.value), x + width - 2, y + 5, { align: 'right' })
  }
}

function drawTrendPage(doc, metrics) {
  const pageWidth = doc.internal.pageSize.getWidth()
  drawSectionHeading(doc, '03  /  PERKEMBANGAN', 'Grafik Perkembangan Nilai', 'Urutan kronologis tanggal Try Out; segmen kosong tidak dihubungkan.')
  drawMainTrendChart(doc, metrics.orderedTryouts, metrics)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, 'setTextColor', COLORS.ink)
  doc.text('Perkembangan per subtes', PAGE_MARGIN, 121)

  const gap = 4
  const cardWidth = (pageWidth - PAGE_MARGIN * 2 - gap) / 2
  const cardHeight = 36
  SUBTEST_ORDER.forEach((code, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    drawSubtestTrendCard(
      doc,
      PAGE_MARGIN + column * (cardWidth + gap),
      126 + row * (cardHeight + 3),
      cardWidth,
      cardHeight,
      code,
      metrics.orderedTryouts.filter((record) => parseIsoDate(record.date)),
      COLORS.series[index],
    )
  })
}

function drawDetailsTable(doc, autoTable, tryouts, metrics) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const subtitle = metrics.period
    ? `${formatDate(metrics.period.start)} - ${formatDate(metrics.period.end)}`
    : 'Tanggal tidak tersedia'
  autoTable(doc, {
    startY: 37,
    margin: { top: 37, right: 12, bottom: 15, left: 12 },
    head: [['Nama Try Out', 'Tanggal', ...SUBTEST_ORDER, 'Nilai keseluruhan']],
    body: [...metrics.orderedTryouts]
      .reverse()
      .map((record) => [
        record.title || 'Tanpa nama',
        formatDate(record.date),
        ...SUBTEST_ORDER.map((code) => formatScore(record.scores?.[code])),
        formatScore(record.averageScore),
      ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
      minCellWidth: 8,
      lineColor: COLORS.grid,
      lineWidth: 0.15,
      textColor: COLORS.ink,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: COLORS.ink,
      textColor: COLORS.white,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: COLORS.paper },
    columnStyles: {
      0: { minCellWidth: 50 },
      1: { minCellWidth: 22, halign: 'center' },
      2: { minCellWidth: 12, halign: 'right' },
      3: { minCellWidth: 12, halign: 'right' },
      4: { minCellWidth: 12, halign: 'right' },
      5: { minCellWidth: 12, halign: 'right' },
      6: { minCellWidth: 12, halign: 'right' },
      7: { minCellWidth: 12, halign: 'right' },
      8: { minCellWidth: 12, halign: 'right' },
      9: { minCellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: () => {
      drawSectionHeading(doc, '04  /  RINCIAN', 'Rincian Hasil Try Out', `Urutan terbaru ke terlama  |  Periode ${subtitle}`)
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  })
}

export async function buildTryoutScoreReport(tryouts, options = {}) {
  if (!Array.isArray(tryouts) || tryouts.length === 0) {
    throw new Error('Tidak ada data Try Out untuk dibuatkan laporan.')
  }

  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default
  if (typeof autoTable !== 'function') {
    throw new Error('Komponen tabel PDF tidak dapat dimuat.')
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const generatedAt = new Date()
  const metrics = calculateTryoutReportMetrics(tryouts, options.targetScore)

  drawSummaryPage(doc, metrics, tryouts, options, generatedAt)
  doc.addPage('a4', 'portrait')
  drawSubtestAnalysisPage(doc, metrics)
  doc.addPage('a4', 'portrait')
  drawTrendPage(doc, metrics)
  doc.addPage('a4', 'landscape')
  drawDetailsTable(doc, autoTable, tryouts, metrics)

  const pageCount = doc.internal.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    drawFooter(doc, pageNumber, pageCount)
  }

  const dateParts = getTimestampParts(generatedAt, options.timeZone)
  return {
    doc,
    filename: `UTBK-Score-Report-${dateParts.year}-${dateParts.month}-${dateParts.day}.pdf`,
    metrics,
  }
}
