/**
 * DATA SEAM — Home (PRD §4.1).
 *
 * Screens import these functions and never learn where the data came from.
 * Part C replaces the bodies with Drizzle queries; the signatures do not change.
 *
 * Everything here is DERIVED from the shared store — goals, blocks and
 * checked-off to-dos. Nothing on this page is a stored total (PRD §1).
 */
import type { Allocation, HabitGrid, HabitRow, KeyIndicator } from "../types";
import {
  blocksInWeek,
  computeAllocation,
  computeKeyIndicator,
  todoItemsInWeek,
} from "../rollup";
import { toIsoDate, weekStart } from "../week";
import { MOCK_HABITS } from "../mock/planner";
import { store } from "../mock/store";
import { getCountContributions } from "./todos";

/** Weeks other than the seeded one start empty rather than undefined. */
function weekState(weekStartIso: string): Record<string, boolean[]> {
  store.habitChecks[weekStartIso] ??= Object.fromEntries(
    MOCK_HABITS.map((h) => [h.id, Array(7).fill(false) as boolean[]]),
  );
  return store.habitChecks[weekStartIso];
}

export async function getPurposeStatement(): Promise<string> {
  return store.purpose;
}

/**
 * The "this week at a glance" tiles. These ARE the weekly Inputs from the Goals
 * funnel — creating or editing an Input on Goals changes these tiles.
 */
export async function getKeyIndicators(anchor: Date): Promise<KeyIndicator[]> {
  const weekBlocks = blocksInWeek(store.blocks, anchor);
  const weekTodos = todoItemsInWeek(getCountContributions(), anchor);
  return store.goals
    .filter((g) => g.tier === "week")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => computeKeyIndicator(g, weekBlocks, weekTodos));
}

/** The tile pop-up: grouped breakdown for `hours`, item list for `count`. */
export async function getAllocation(
  goalId: string,
  anchor: Date,
): Promise<Allocation | null> {
  const goal = store.goals.find((g) => g.id === goalId);
  if (!goal) return null;
  const weekBlocks = blocksInWeek(store.blocks, anchor);
  const weekTodos = todoItemsInWeek(getCountContributions(), anchor);
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
