import { differenceInMinutes, isWithinInterval, parseISO } from "date-fns";
import type {
  Allocation,
  AllocationRow,
  CalendarBlock,
  Goal,
  KeyIndicator,
} from "./types";
import { weekDays } from "./week";

/** A `count` contribution that came from a checked-off to-do, not the calendar. */
export interface TodoCountItem {
  goalId: string;
  label: string;
  date: string;
}

const hoursOf = (b: CalendarBlock) =>
  differenceInMinutes(parseISO(b.end), parseISO(b.start)) / 60;

const confirmedHoursOf = (b: CalendarBlock) =>
  b.confirmedMinutes === null ? 0 : b.confirmedMinutes / 60;

/** Blocks that start inside the Monday–Sunday week containing `anchor`. */
export function blocksInWeek(
  blocks: CalendarBlock[],
  anchor: Date,
): CalendarBlock[] {
  const days = weekDays(anchor);
  const start = days[0];
  const end = new Date(days[6]);
  end.setHours(23, 59, 59, 999);
  return blocks.filter((b) =>
    isWithinInterval(parseISO(b.start), { start, end }),
  );
}

/**
 * Target → Planned → Done for one weekly Input. PRD §4.1a.
 *
 * - `hours` — Σ durations of contributing blocks; Done is the confirmed duration.
 * - `count` — NUMBER of contributing items, drawn from calendar blocks AND
 *   checked-off to-dos. A to-do is already an accomplished act, so it counts
 *   toward Done as well as Planned.
 *
 * Note `count` counts *items*, so two scripture blocks on one day read as 2.
 * PRD §4.1a says do not pre-emptively fix that with a third unit — if it ever
 * bites, add a single "count once per day" boolean.
 */
export function computeKeyIndicator(
  goal: Goal,
  weekBlocks: CalendarBlock[],
  todoItems: TodoCountItem[],
): KeyIndicator {
  const unit = goal.unit ?? "hours";
  const target = goal.target ?? 0;
  const mine = weekBlocks.filter((b) => b.goalId === goal.id);
  const myTodos = todoItems.filter((t) => t.goalId === goal.id);

  let planned: number;
  let done: number;

  if (unit === "hours") {
    planned = mine.reduce((sum, b) => sum + hoursOf(b), 0);
    done = mine.reduce((sum, b) => sum + confirmedHoursOf(b), 0);
  } else {
    planned = mine.length + myTodos.length;
    done =
      mine.filter((b) => b.confirmedMinutes !== null).length + myTodos.length;
  }

  return {
    goalId: goal.id,
    title: goal.title,
    icon: goal.icon,
    unit,
    target,
    planned: round(planned),
    done: round(done),
    // "Behind" means you haven't even scheduled enough to hit the target —
    // an actionable signal during planning, unlike a pace estimate.
    behind: target > 0 && planned < target,
  };
}

/**
 * The tile pop-up. For `hours`, blocks are grouped by name — the name is the
 * join key, so projects emerge from what's actually scheduled (PRD §3).
 * For `count`, the rows are the individual items, labelled by origin.
 */
export function computeAllocation(
  goal: Goal,
  weekBlocks: CalendarBlock[],
  todoItems: TodoCountItem[],
): Allocation {
  const unit = goal.unit ?? "hours";
  const mine = weekBlocks.filter((b) => b.goalId === goal.id);
  const myTodos = todoItems.filter((t) => t.goalId === goal.id);
  let rows: AllocationRow[];

  if (unit === "hours") {
    const byName = new Map<string, AllocationRow>();
    for (const b of mine) {
      const row = byName.get(b.name) ?? { label: b.name, planned: 0, done: 0 };
      row.planned += hoursOf(b);
      row.done += confirmedHoursOf(b);
      byName.set(b.name, row);
    }
    rows = [...byName.values()]
      .map((r) => ({ ...r, planned: round(r.planned), done: round(r.done) }))
      .sort((a, b) => b.planned - a.planned);
  } else {
    rows = [
      ...mine.map((b) => ({
        label: b.name,
        planned: 1,
        done: b.confirmedMinutes !== null ? 1 : 0,
        origin: "calendar" as const,
        date: b.start.slice(0, 10),
      })),
      ...myTodos.map((t) => ({
        label: t.label,
        planned: 1,
        done: 1,
        origin: "todo" as const,
        date: t.date,
      })),
    ].sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  return {
    goalId: goal.id,
    title: goal.title,
    icon: goal.icon,
    unit,
    target: goal.target ?? 0,
    rows,
    totalPlanned: round(rows.reduce((s, r) => s + r.planned, 0)),
    totalDone: round(rows.reduce((s, r) => s + r.done, 0)),
  };
}

/** One decimal is enough for hours; counts stay integers. */
function round(n: number): number {
  return Math.round(n * 10) / 10;
}
