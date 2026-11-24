const MONTHS_ID = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

const MONTHS_TITLE_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTHS_SHORT_ID = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGU',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

const DAYS_ID = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

export const TODAY_ISO = '2026-11-23';

export function formatIsoDate(year: number, monthIndex0: number, day: number): string {
  const m = String(monthIndex0 + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatIndonesianFull(iso: string): string {
  const date = parseIsoDate(iso);
  const dayName = DAYS_ID[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

export function formatIndonesianSheetDate(iso: string): string {
  const date = parseIsoDate(iso);
  const dayName = DAYS_ID[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year} • ${dayName}`;
}

export function formatIndonesianTitleDate(iso: string): string {
  const date = parseIsoDate(iso);
  const day = date.getDate();
  const month = MONTHS_TITLE_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatIndonesianShortDate(iso: string): string {
  const date = parseIsoDate(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT_ID[date.getMonth()];
  return `${day} ${month}`;
}

export function formatMonthYearUpper(year: number, monthIndex0: number): string {
  return `${MONTHS_ID[monthIndex0]} ${year}`;
}

export function formatDurationHHMM(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatDurationReadable(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs} JAM ${mins} MENIT`;
}

export function formatDurationCompact(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs}j ${mins}m`;
}

export function getDaysRemaining(fromIso: string, toIso: string): number {
  const a = parseIsoDate(fromIso);
  const b = parseIsoDate(toIso);
  const diff = b.getTime() - a.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

export function buildMonthGrid(year: number, monthIndex0: number): CalendarCell[] {
  const firstDayOfMonth = new Date(year, monthIndex0, 1);
  // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex0, 0).getDate();

  const cells: CalendarCell[] = [];

  // Leading days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevDate = new Date(year, monthIndex0 - 1, day);
    cells.push({
      iso: formatIsoDate(prevDate.getFullYear(), prevDate.getMonth(), day),
      day,
      inMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      iso: formatIsoDate(year, monthIndex0, d),
      day: d,
      inMonth: true,
    });
  }

  // Trailing days to complete 7-column row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const trailingCount = 7 - remainder;
    for (let d = 1; d <= trailingCount; d++) {
      const nextDate = new Date(year, monthIndex0 + 1, d);
      cells.push({
        iso: formatIsoDate(nextDate.getFullYear(), nextDate.getMonth(), d),
        day: d,
        inMonth: false,
      });
    }
  }

  return cells;
}

export function addDaysIso(iso: string, delta: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + delta);
  return formatIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}
