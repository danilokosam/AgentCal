/**
 * All dates are stored and processed in UTC.
 * These utilities help convert, validate, and build time ranges.
 */

/**
 * Validates that a string is a parseable ISO 8601 date-time.
 */
export function isValidISODate(value: string): boolean {
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * Returns true if start is strictly before end.
 */
export function isValidTimeRange(start: string, end: string): boolean {
  return new Date(start) < new Date(end);
}

/**
 * Calculates duration in minutes between two ISO timestamps.
 */
export function durationMinutes(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
}

/**
 * Given a YYYY-MM-DD date string, returns the UTC boundaries for that day.
 * e.g. "2025-06-01" → { start: "2025-06-01T00:00:00.000Z", end: "2025-06-01T23:59:59.999Z" }
 */
export function dayBoundsUTC(date: string): { start: string; end: string } {
  return {
    start: `${date}T00:00:00.000Z`,
    end: `${date}T23:59:59.999Z`,
  };
}

/**
 * Generates candidate appointment slots for a given day and duration.
 * Slots start every `step` minutes (default: 30).
 * Returns an array of { start, end } ISO strings.
 */
export function generateSlots(
  date: string,
  durationMinutes: number,
  stepMinutes = 30,
  workdayStartHour = 8,
  workdayEndHour = 18
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  const base = new Date(`${date}T${String(workdayStartHour).padStart(2, "0")}:00:00.000Z`);
  const dayEnd = new Date(`${date}T${String(workdayEndHour).padStart(2, "0")}:00:00.000Z`);

  let cursor = base;
  while (cursor < dayEnd) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);
    if (slotEnd > dayEnd) break;
    slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
    cursor = new Date(cursor.getTime() + stepMinutes * 60_000);
  }

  return slots;
}

/**
 * Returns true if two time ranges overlap.
 * Ranges are considered inclusive of start and exclusive of end.
 */
export function rangesOverlap(
  a: { start: string; end: string },
  b: { start: string; end: string }
): boolean {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}
