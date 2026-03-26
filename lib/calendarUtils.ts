import { HOURS_START, SLOT_MINUTES } from "./constants";

/** Converts an ISO UTC timestamp → 1-based CSS grid row index.
 *  Row 1 = 08:00, Row 2 = 08:30, ..., Row 20 = 17:30 */
export function slotToRow(iso: string): number {
  const d = new Date(iso);
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  return ((hour - HOURS_START) * 60 + minute) / SLOT_MINUTES + 1;
}

/** How many 30-min rows an appointment spans (minimum 1) */
export function durationToRowSpan(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, ms / (SLOT_MINUTES * 60_000));
}

/** Row index → "HH:MM" label. Only emit label on the hour (even rows). */
export function rowToLabel(row: number): string | null {
  const totalMinutes = (row - 1) * SLOT_MINUTES;
  if (totalMinutes % 60 !== 0) return null;
  const hour = HOURS_START + totalMinutes / 60;
  return `${String(hour).padStart(2, "0")}:00`;
}

/** All 30-min time string options for the form select (08:00 … 17:30) */
export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let row = 1; row <= 20; row++) {
    const totalMinutes = (row - 1) * SLOT_MINUTES;
    const hour = HOURS_START + Math.floor(totalMinutes / 60);
    const min  = totalMinutes % 60;
    options.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return options;
}

/** Formats ISO UTC → "HH:MM" display string */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
