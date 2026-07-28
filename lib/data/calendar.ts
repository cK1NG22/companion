/**
 * DATA SEAM — Calendar (PRD §4.3).
 *
 * Blocks are the input surface: creating one is how "Planned" gets filled.
 * Confirming a block's real duration at night is how "Done" gets filled.
 */
import { addMinutes, differenceInMinutes, format, parseISO } from "date-fns";

/**
 * All timestamps in this app are LOCAL-NAIVE ISO ("2026-07-13T09:00:00") —
 * never UTC. `toISOString()` would shift them by the timezone offset and make
 * a 9am block render at 3am. Use this everywhere a Date becomes a timestamp.
 */
export const toLocalIso = (d: Date): string =>
  format(d, "yyyy-MM-dd'T'HH:mm:ss");
import type { CalendarBlock, OpenWindow } from "../types";
import { blocksInWeek } from "../rollup";
import { toIsoDate } from "../week";
import { MOCK_BLOCKS } from "../mock/calendar";

const blocks: CalendarBlock[] = structuredClone(MOCK_BLOCKS);
let nextId = 5000;

export async function getWeekBlocks(anchor: Date): Promise<CalendarBlock[]> {
  return blocksInWeek(blocks, anchor).sort((a, b) =>
    a.start < b.start ? -1 : 1,
  );
}

export async function getDayBlocks(day: Date): Promise<CalendarBlock[]> {
  const iso = toIsoDate(day);
  return blocks
    .filter((b) => b.start.slice(0, 10) === iso)
    .sort((a, b) => (a.start < b.start ? -1 : 1));
}

export interface NewBlockInput {
  name: string;
  start: string;
  end: string;
  goalId: string | null;
  notes?: string | null;
}

export async function createBlock(input: NewBlockInput): Promise<CalendarBlock> {
  const block: CalendarBlock = {
    id: `b${nextId++}`,
    name: input.name,
    start: input.start,
    end: input.end,
    goalId: input.goalId,
    source: "companion",
    googleEventId: null,
    confirmedMinutes: null,
    notes: input.notes ?? null,
  };
  blocks.push(block);
  return block;
}

export async function updateBlock(
  id: string,
  patch: Partial<Pick<CalendarBlock, "name" | "start" | "end" | "goalId" | "confirmedMinutes" | "notes">>,
): Promise<void> {
  const block = blocks.find((b) => b.id === id);
  if (!block) return;
  Object.assign(block, patch);
}

export async function deleteBlock(id: string): Promise<void> {
  const i = blocks.findIndex((b) => b.id === id);
  if (i >= 0) blocks.splice(i, 1);
}

/**
 * Schedule something of `durationMinutes` into the first gap that fits.
 * Used by Plan Today's "add to calendar" and the to-do "Schedule" button —
 * the to-do's duration drives the length of the event (PRD §4.2).
 */
export async function findOpenWindows(
  day: Date,
  dayStartHour = 6,
  dayEndHour = 23,
): Promise<OpenWindow[]> {
  const iso = toIsoDate(day);
  const dayBlocks = await getDayBlocks(day);
  const bound = (h: number) =>
    parseISO(`${iso}T${String(h).padStart(2, "0")}:00:00`);

  const windows: OpenWindow[] = [];
  let cursor = bound(dayStartHour);
  const end = bound(dayEndHour);

  for (const b of dayBlocks) {
    const s = parseISO(b.start);
    const e = parseISO(b.end);
    if (s > cursor) push(cursor, s);
    if (e > cursor) cursor = e;
  }
  if (cursor < end) push(cursor, end);

  function push(from: Date, to: Date) {
    const minutes = differenceInMinutes(to, from);
    // Sub-15-minute slivers are not schedulable time; don't offer them.
    if (minutes >= 15) {
      windows.push({
        start: toLocalIso(from),
        end: toLocalIso(to),
        minutes,
      });
    }
  }
  return windows;
}

/** The first window that fits, or null when the day is full. */
export async function firstWindowFitting(
  day: Date,
  durationMinutes: number,
): Promise<OpenWindow | null> {
  const windows = await findOpenWindows(day);
  return windows.find((w) => w.minutes >= durationMinutes) ?? null;
}

/** Helper for scheduling: end time for a start + duration. */
export function endFor(start: string, durationMinutes: number): string {
  return toLocalIso(addMinutes(parseISO(start), durationMinutes));
}
