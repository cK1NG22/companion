/**
 * THE MOCK STORE — one shared, mutable world for every `lib/data/` module.
 *
 * Each data module used to clone the fixtures independently, which meant
 * `goals.ts`, `todos.ts`, `calendar.ts` and `home.ts` each held a *different*
 * copy: scheduling a to-do created a block nobody else could see, and Home kept
 * rendering the pristine fixture no matter what you changed.
 *
 * This module is the stand-in for the database. In Part C it is deleted and the
 * `lib/data/` functions talk to Drizzle instead — the seam does not move.
 */
import type { CalendarBlock, Goal, Todo } from "../types";
import { MOCK_BLOCKS } from "./calendar";
import {
  MOCK_GOALS,
  MOCK_HABIT_CHECKS,
  MOCK_PURPOSE,
  MOCK_TODOS,
  MOCK_WEEK_START,
} from "./planner";

export interface MockStore {
  goals: Goal[];
  blocks: CalendarBlock[];
  todos: Todo[];
  /** weekStart (YYYY-MM-DD) → habitId → Mon..Sun booleans. */
  habitChecks: Record<string, Record<string, boolean[]>>;
  purpose: string;
}

export const store: MockStore = {
  goals: structuredClone(MOCK_GOALS),
  blocks: structuredClone(MOCK_BLOCKS),
  todos: structuredClone(MOCK_TODOS),
  habitChecks: { [MOCK_WEEK_START]: structuredClone(MOCK_HABIT_CHECKS) },
  purpose: MOCK_PURPOSE,
};

let counter = 1000;
/** Monotonic ids so nothing collides with the fixture ids. */
export const nextId = (prefix: string) => `${prefix}${counter++}`;
