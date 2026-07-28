/**
 * DATA SEAM — Home (PRD §4.1).
 *
 * Screens import these functions and never learn where the data came from.
 * Part C replaces the bodies with Drizzle queries; the signatures do not change.
 */
import type { Allocation, HabitGrid, HabitRow, KeyIndicator } from "../types";
import { blocksInWeek, computeAllocation, computeKeyIndicator } from "../rollup";
import { toIsoDate, weekStart } from "../week";
import { MOCK_BLOCKS, MOCK_TODO_COUNT_ITEMS } from "../mock/calendar";
import {
  MOCK_GOALS,
  MOCK_HABITS,
  MOCK_HABIT_CHECKS,
  MOCK_PURPOSE,
} from "../mock/planner";

/** In-memory habit state so the grid is genuinely clickable before the DB exists. */
const habitState: Record<string, boolean[]> = structuredClone(MOCK_HABIT_CHECKS);

export async function getPurposeStatement(): Promise<string> {
  return MOCK_PURPOSE;
}

/**
 * The "this week at a glance" tiles. These ARE the weekly Inputs from the Goals
 * funnel — setting a weekly input in Goals is what populates a tile here.
 */
export async function getKeyIndicators(anchor: Date): Promise<KeyIndicator[]> {
  const weekBlocks = blocksInWeek(MOCK_BLOCKS, anchor);
  return MOCK_GOALS.filter((g) => g.tier === "week")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => computeKeyIndicator(g, weekBlocks, MOCK_TODO_COUNT_ITEMS));
}

/** The tile pop-up: grouped breakdown for `hours`, item list for `count`. */
export async function getAllocation(
  goalId: string,
  anchor: Date,
): Promise<Allocation | null> {
  const goal = MOCK_GOALS.find((g) => g.id === goalId);
  if (!goal) return null;
  const weekBlocks = blocksInWeek(MOCK_BLOCKS, anchor);
  return computeAllocation(goal, weekBlocks, MOCK_TODO_COUNT_ITEMS);
}

export async function getHabitGrid(anchor: Date): Promise<HabitGrid> {
  const rows: HabitRow[] = MOCK_HABITS.sort(
    (a, b) => a.sortOrder - b.sortOrder,
  ).map((habit) => ({
    habit,
    days: habitState[habit.id] ?? Array(7).fill(false),
  }));
  return { weekStart: toIsoDate(weekStart(anchor)), rows };
}

/** @param dayIndex 0 = Monday … 6 = Sunday */
export async function toggleHabit(
  habitId: string,
  dayIndex: number,
): Promise<void> {
  const row = habitState[habitId];
  if (!row || dayIndex < 0 || dayIndex > 6) return;
  row[dayIndex] = !row[dayIndex];
}
