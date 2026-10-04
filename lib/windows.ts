import { addMinutes, differenceInMinutes, format, parseISO } from "date-fns";
import type { CalendarBlock, OpenWindow } from "./types";

/**
 * All timestamps in this app are LOCAL-NAIVE ISO ("2026-07-13T09:00:00"),
 * never UTC. `toISOString()` would shift them by the timezone offset and make
 * a 9am block render at 3am.
 */
export const toLocalIso = (d: Date): string =>
  format(d, "yyyy-MM-dd'T'HH:mm:ss");

/** Helper for scheduling: end time for a start + duration. */
export function endFor(start: string, durationMinutes: number): string {
  return toLocalIso(addMinutes(parseISO(start), durationMinutes));
}

/**
 * Does this block occupy any part of `dayIso`?
 *
 * Overlap, not "starts on this date" — an overnight block (10 PM–7 AM) belongs
 * to both days. Timestamps are local-naive and fixed-width, so lexicographic
 * comparison is chronological.
 */
export function overlapsDay(block: CalendarBlock, dayIso: string): boolean {
  return (
    block.start <= `${dayIso}T23:59:59` && block.end > `${dayIso}T00:00:00`
  );
}

/** Gaps shorter than this are not schedulable time; don't offer them. */
const MIN_WINDOW_MINUTES = 15;

/**
 * The free gaps in a day, between `startHour` and `endHour` (PRD §4.7).
 *
 * Pure so it can be tested without the store. `blocks` must already be the
 * blocks for `dayIso`, sorted by start.
 */
export function computeOpenWindows(
  blocks: CalendarBlock[],
  dayIso: string,
  startHour = 6,
  endHour = 23,
  /**
   * Ignore time before this instant. Pass `new Date()` when the day is today,
   * so a free 6–8 AM slot isn't offered at 3 PM — scheduling into it would
   * create a block in the past.
   */
  notBefore?: Date,
): OpenWindow[] {
  const bound = (h: number) =>
    parseISO(`${dayIso}T${String(h).padStart(2, "0")}:00:00`);

  const windows: OpenWindow[] = [];
  const end = bound(endHour);
  let cursor = bound(startHour);
  if (notBefore && notBefore > cursor) cursor = notBefore;

  const push = (from: Date, to: Date) => {
    // Clamp at the day's end. A block starting after `endHour` (say 23:30 when
    // the day ends at 23:00) would otherwise open a window running past the
    // boundary, and the scheduler would happily book into it.
    const bounded = to > end ? end : to;
    if (bounded <= from) return;
    const minutes = differenceInMinutes(bounded, from);
    if (minutes >= MIN_WINDOW_MINUTES) {
      windows.push({
        start: toLocalIso(from),
        end: toLocalIso(bounded),
        minutes,
      });
    }
  };

  for (const b of blocks) {
    const s = parseISO(b.start);
    const e = parseISO(b.end);
    if (s > cursor) push(cursor, s);
    if (e > cursor) cursor = e;
  }
  if (cursor < end) push(cursor, end);

  return windows;
}
