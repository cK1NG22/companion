/**
 * DATA SEAM — Calendar (PRD §4.3).
 *
 * Blocks are the input surface: creating one is how "Planned" gets filled.
 * Confirming a block's real duration at night is how "Done" gets filled.
 */
import { addMinutes, parseISO } from "date-fns";
import type { CalendarBlock, OpenWindow } from "../types";
import { blocksInWeek } from "../rollup";
import { toIsoDate } from "../week";
import { computeOpenWindows, overlapsDay, toLocalIso } from "../windows";
import { nextId, store } from "../mock/store";

export { toLocalIso };

const blocks = store.blocks;

export async function getWeekBlocks(anchor: Date): Promise<CalendarBlock[]> {
  return blocksInWeek(blocks, anchor).sort((a, b) =>
    a.start < b.start ? -1 : 1,
  );
}

export async function getDayBlocks(day: Date): Promise<CalendarBlock[]> {
  const iso = toIsoDate(day);
  return blocks
    .filter((b) => overlapsDay(b, iso))
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
    id: nextId("b"),
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
  // A to-do that was scheduled into this block still points at it. Left
  // dangling, the UI keeps showing "On cal" with a disabled button, so the
  // to-do could never be rescheduled. Cleared here rather than in todos.ts so
  // there's no import cycle — both modules share the store.
  for (const todo of store.todos) {
    if (todo.scheduledBlockId === id) todo.scheduledBlockId = null;
  }
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
  const now = new Date();
  // Only today's windows are clipped to "from now on"; other days show in full.
  const notBefore = toIsoDate(day) === toIsoDate(now) ? now : undefined;
  return computeOpenWindows(
    await getDayBlocks(day),
    toIsoDate(day),
    dayStartHour,
    dayEndHour,
    notBefore,
  );
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
