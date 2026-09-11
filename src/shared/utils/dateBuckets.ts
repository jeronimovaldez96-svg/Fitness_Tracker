const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the Monday-anchored week containing `timestampMs`, at local midnight. */
export function startOfWeek(timestampMs: number): number {
  const d = new Date(timestampMs);
  d.setHours(0, 0, 0, 0);
  const isoDayIndex = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  return d.getTime() - isoDayIndex * DAY_MS;
}

export function startOfDay(timestampMs: number): number {
  const d = new Date(timestampMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(timestampMs: number, days: number): number {
  return timestampMs + days * DAY_MS;
}

export function addWeeks(timestampMs: number, weeks: number): number {
  return addDays(timestampMs, weeks * 7);
}

/** Start of the calendar month containing `timestampMs`, at local midnight on the 1st. */
export function startOfMonth(timestampMs: number): number {
  const d = new Date(timestampMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

export function addMonths(timestampMs: number, months: number): number {
  const d = new Date(timestampMs);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}
