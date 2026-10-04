/**
 * THE MOCK STORE — one shared, mutable world for every `lib/data/` module.
 *
 * Each data module used to clone the fixtures independently, which meant
 * modules that share a table each held a *different* copy: scheduling a to-do
 * created a block nobody else could see, and Home kept rendering the pristine
 * fixture no matter what you changed. Every data module's mutable state now
 * lives here, whether or not a second module reads it yet.
 *
 * This module is the stand-in for the database. In Part C it is deleted and the
 * `lib/data/` functions talk to Drizzle instead — the seam does not move.
 */
import type {
  CalendarBlock,
  CarriedQuestion,
  Exercise,
  ExerciseSet,
  FeedbackItem,
  Goal,
  MorningSection,
  NightlyEntry,
  Reading,
  ScriptureNote,
  Todo,
} from "../types";
import { MOCK_BLOCKS } from "./calendar";
import { MOCK_EXERCISES, MOCK_SETS } from "./gym";
import { MOCK_PEOPLE } from "./people";
import {
  MOCK_GOALS,
  MOCK_HABIT_CHECKS,
  MOCK_PURPOSE,
  MOCK_TODOS,
  MOCK_WEEK_START,
} from "./planner";
import {
  MOCK_MORNING_SECTIONS,
  MOCK_NIGHTLY,
  MOCK_QUESTIONS,
  MOCK_READINGS,
  MOCK_SCRIPTURE_NOTES,
} from "./rhythm";

export interface MockStore {
  goals: Goal[];
  blocks: CalendarBlock[];
  todos: Todo[];
  /** weekStart (YYYY-MM-DD) → habitId → Mon..Sun booleans. */
  habitChecks: Record<string, Record<string, boolean[]>>;
  purpose: string;
  exercises: Exercise[];
  sets: ExerciseSet[];
  morningSections: MorningSection[];
  /** The date (YYYY-MM-DD) the Morning Review was last marked done. */
  morningDoneOn: string | null;
  nightly: NightlyEntry[];
  scriptureNotes: ScriptureNote[];
  questions: CarriedQuestion[];
  readings: Reading[];
  /** Ids of people left out of the list and the iMessage scan. */
  excludedPeople: Set<string>;
  /** When the on-demand Mac agent last ran. Drives the "synced 2h ago" label. */
  lastSyncedAt: string;
  feedback: FeedbackItem[];
}

export const store: MockStore = {
  goals: structuredClone(MOCK_GOALS),
  blocks: structuredClone(MOCK_BLOCKS),
  todos: structuredClone(MOCK_TODOS),
  habitChecks: { [MOCK_WEEK_START]: structuredClone(MOCK_HABIT_CHECKS) },
  purpose: MOCK_PURPOSE,
  exercises: structuredClone(MOCK_EXERCISES),
  sets: structuredClone(MOCK_SETS),
  morningSections: structuredClone(MOCK_MORNING_SECTIONS),
  morningDoneOn: null,
  nightly: structuredClone(MOCK_NIGHTLY),
  scriptureNotes: structuredClone(MOCK_SCRIPTURE_NOTES),
  questions: structuredClone(MOCK_QUESTIONS),
  readings: structuredClone(MOCK_READINGS),
  excludedPeople: new Set(
    MOCK_PEOPLE.filter((p) => p.excluded).map((p) => p.id),
  ),
  lastSyncedAt: new Date().toISOString(),
  feedback: [],
};

let counter = 1000;
/** Monotonic ids so nothing collides with the fixture ids. */
export const nextId = (prefix: string) => `${prefix}${counter++}`;
