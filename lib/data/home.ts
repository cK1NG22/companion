/**
 * DATA SEAM — Home (PRD §4.1).
 *
 * Screens import these functions and never learn where the data came from.
 * Part C replaces the bodies with Drizzle queries; the signatures do not change.
 */
import type { Allocation, HabitGrid, HabitRow, KeyIndicator } from "../types";
import {
  blocksInWeek,
  computeAllocation,
  computeKeyIndicator,
  todoItemsInWeek,
} from "../rollup";
import { toIsoDate, weekStart } from "../week";
import { MOCK_BLOCKS, MOCK_TODO_COUNT_ITEMS } from "../mock/calendar";
import {
  MOCK_GOALS,
  MOCK_HABITS,
  MOCK_HABIT_CHECKS,
  MOCK_PURPOSE,
  MOCK_WEEK_START,
} from "../mock/planner";

/**
 * In-memory habit state so the grid is genuinely clickable before the DB exists.
 *
 * Keyed by week FIRST: `{ "2026-07-27": { h1: [true, …] } }`. The grid is
 * week-addressed via the `?w=` stepper, so a flat habit→days map would make
 * every week share one row — toggling Wednesday in March would tick Wednesday
 * in July. In Part C this becomes `habit_entries(habit_id, date)`.
 */
const habitState: Record<string, Record<string, boolean[]>> = {
  [MOCK_WEEK_START]: structuredClone(MOCK_HABIT_CHECKS),
};

/** Weeks other than the seeded one start empty rather than undefined. */
function weekState(weekStartIso: string): Record<string, boolean[]> {
  habitState[weekStartIso] ??= Object.fromEntries(
    MOCK_HABITS.map((h) => [h.id, Array(7).fill(false) as boolean[]]),
  );
  return habitState[weekStartIso];
}

export async function getPurposeStatement(): Promise<string> {
  return MOCK_PURPOSE;
}

/**
 * The "this week at a glance" tiles. These ARE the weekly Inputs from the Goals
 * funnel — setting a weekly input in Goals is what populates a tile here.
 */
export async function getKeyIndicators(anchor: Date): Promise<KeyIndicator[]> {
  const weekBlocks = blocksInWeek(MOCK_BLOCKS, anchor);
  const weekTodos = todoItemsInWeek(MOCK_TODO_COUNT_ITEMS, anchor);
  return MOCK_GOALS.filter((g) => g.tier === "week")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => computeKeyIndicator(g, weekBlocks, weekTodos));
}

/** The tile pop-up: grouped breakdown for `hours`, item list for `count`. */
export async function getAllocation(
  goalId: string,
  anchor: Date,
): Promise<Allocation | null> {
  const goal = MOCK_GOALS.find((g) => g.id === goalId);
  if (!goal) return null;
  const weekBlocks = blocksInWeek(MOCK_BLOCKS, anchor);
  const weekTodos = todoItemsInWeek(MOCK_TODO_COUNT_ITEMS, anchor);
  return computeAllocation(goal, weekBlocks, weekTodos);
}

export async function getHabitGrid(anchor: Date): Promise<HabitGrid> {
  const weekStartIso = toIsoDate(weekStart(anchor));
  const state = weekState(weekStartIso);
  // Copy before sorting — Array.sort mutates, and this is a shared fixture.
  const rows: HabitRow[] = [...MOCK_HABITS]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((habit) => ({
      habit,
      days: state[habit.id] ?? Array(7).fill(false),
    }));
  return { weekStart: weekStartIso, rows };
}

/**
 * @param weekStartIso Monday of the week being viewed — without it, every week
 *   would share one set of checkmarks.
 * @param dayIndex     0 = Monday … 6 = Sunday
 */
export async function toggleHabit(
  habitId: string,
  dayIndex: number,
  weekStartIso: string,
): Promise<void> {
  if (dayIndex < 0 || dayIndex > 6) return;
  const row = weekState(weekStartIso)[habitId];
  if (!row) return;
  row[dayIndex] = !row[dayIndex];
}
