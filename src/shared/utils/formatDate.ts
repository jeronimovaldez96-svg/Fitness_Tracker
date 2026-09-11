const MONTHS_UPPER = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];
const MONTHS_TITLE = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL_UPPER = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "05" */
export function getDayOfMonth(timestampMs: number): string {
  return pad2(new Date(timestampMs).getDate());
}

/** "SEP" */
export function getMonthAbbrevUpper(timestampMs: number): string {
  return MONTHS_UPPER[new Date(timestampMs).getMonth()];
}

/** "05 SEP" */
export function formatShortDate(timestampMs: number): string {
  const d = new Date(timestampMs);
  return `${pad2(d.getDate())} ${MONTHS_UPPER[d.getMonth()]}`;
}

/** "AUG 18" — used for chart axis labels. */
export function formatAxisDate(timestampMs: number): string {
  const d = new Date(timestampMs);
  return `${MONTHS_UPPER[d.getMonth()]} ${pad2(d.getDate())}`;
}

/** "Tue 01 Sep" */
export function formatWeekdayDate(timestampMs: number): string {
  const d = new Date(timestampMs);
  return `${WEEKDAYS[d.getDay()]} ${pad2(d.getDate())} ${MONTHS_TITLE[d.getMonth()]}`;
}

/** "SEP 2026" */
export function formatMonthYear(timestampMs: number): string {
  const d = new Date(timestampMs);
  return `${MONTHS_UPPER[d.getMonth()]} ${d.getFullYear()}`;
}

/** "TUESDAY 08 SEP" — Today screen's dateline. */
export function formatFullDateUpper(timestampMs: number): string {
  const d = new Date(timestampMs);
  return `${WEEKDAYS_FULL_UPPER[d.getDay()]} ${pad2(d.getDate())} ${MONTHS_UPPER[d.getMonth()]}`;
}
