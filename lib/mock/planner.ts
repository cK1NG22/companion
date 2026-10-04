/**
 * MOCK FIXTURES — planning domain (goals funnel, key indicators, habits, to-dos).
 *
 * Part C deletes this file and reimplements the matching `lib/data/` functions
 * against Drizzle. Nothing outside `lib/data/` may import from here.
 *
 * Dates are computed relative to the current week so the app always looks live.
 */
import { addDays } from "date-fns";
import type { Goal, Habit, Todo } from "../types";
import { toIsoDate, weekStart } from "../week";

const monday = weekStart(new Date());
export const MOCK_WEEK_START = toIsoDate(monday);
export const mockDay = (offset: number) => toIsoDate(addDays(monday, offset));

/**
 * The funnel: year = Goals (identity), month = Plans (means),
 * week = Inputs (the measurable weekly numbers that become Home tiles).
 */
export const MOCK_GOALS: Goal[] = [
  // ---- Year: who I'm becoming -------------------------------------------
  {
    id: "y1",
    title: "Grow Optimal to $30k MRR",
    tier: "year",
    parentId: null,
    icon: "laptop",
    note: null,
    badge: "A",
    target: null,
    unit: null,
    sortOrder: 0,
  },
  {
    id: "y2",
    title: "Be a present husband and father",
    tier: "year",
    parentId: null,
    icon: "heart",
    note: null,
    badge: "B",
    target: null,
    unit: null,
    sortOrder: 1,
  },
  {
    id: "y3",
    title: "Know God and receive personal revelation",
    tier: "year",
    parentId: null,
    icon: "book",
    note: "Grow my ability to receive personal revelation — a real desire to know people, not add contacts.",
    badge: "C",
    target: null,
    unit: null,
    sortOrder: 2,
  },
  {
    id: "y4",
    title: "Build a strong, durable body",
    tier: "year",
    parentId: null,
    icon: "dumbbell",
    note: null,
    badge: "D",
    target: null,
    unit: null,
    sortOrder: 3,
  },

  // ---- Month: the concrete means ----------------------------------------
  {
    id: "m1",
    title: "Ship Companion for daily use",
    tier: "month",
    parentId: "y1",
    icon: "laptop",
    note: null,
    badge: null,
    target: null,
    unit: null,
    sortOrder: 0,
  },
  {
    id: "m2",
    title: "Run 100 outreach conversations",
    tier: "month",
    parentId: "y1",
    icon: "phone",
    note: null,
    badge: null,
    target: null,
    unit: null,
    sortOrder: 1,
  },
  {
    id: "m3",
    title: "Weekly date night, no exceptions",
    tier: "month",
    parentId: "y2",
    icon: "heart",
    note: null,
    badge: null,
    target: null,
    unit: null,
    sortOrder: 2,
  },
  {
    id: "m4",
    title: "Finish the Book of Mormon",
    tier: "month",
    parentId: "y3",
    icon: "book",
    note: null,
    badge: null,
    target: null,
    unit: null,
    sortOrder: 3,
  },
  {
    id: "m5",
    title: "Bench 225 by October",
    tier: "month",
    parentId: "y4",
    icon: "dumbbell",
    note: null,
    badge: null,
    target: null,
    unit: null,
    sortOrder: 4,
  },

  // ---- Week: the Inputs. These ARE the Home tiles. -----------------------
  {
    id: "w1",
    title: "Deep work",
    tier: "week",
    parentId: "m1",
    icon: "laptop",
    note: null,
    badge: null,
    target: 20,
    unit: "hours",
    sortOrder: 0,
  },
  {
    id: "w2",
    title: "Outreach conversations",
    tier: "week",
    parentId: "m2",
    icon: "phone",
    note: null,
    badge: null,
    target: 10,
    unit: "count",
    sortOrder: 1,
  },
  {
    id: "w3",
    title: "Scripture study",
    tier: "week",
    parentId: "m4",
    icon: "book",
    note: null,
    badge: null,
    target: 7,
    unit: "count",
    sortOrder: 2,
  },
  {
    id: "w4",
    title: "Workouts",
    tier: "week",
    parentId: "m5",
    icon: "dumbbell",
    note: null,
    badge: null,
    target: 5,
    unit: "count",
    sortOrder: 3,
  },
  {
    id: "w5",
    title: "Family time",
    tier: "week",
    parentId: "m3",
    icon: "heart",
    note: null,
    badge: null,
    target: 8,
    unit: "hours",
    sortOrder: 4,
  },
];

/** PRD §4.1 — Standards of Excellence are the three DAILY items. */
export const MOCK_HABITS: Habit[] = [
  { id: "h1", name: "Book of Mormon", group: "required", sortOrder: 0 },
  { id: "h2", name: "Daily plan", group: "required", sortOrder: 1 },
  { id: "h3", name: "Exercise", group: "required", sortOrder: 2 },
  { id: "h4", name: "Service", group: "standards", sortOrder: 3 },
  { id: "h5", name: "Reading", group: "standards", sortOrder: 4 },
  { id: "h6", name: "Outreach", group: "standards", sortOrder: 5 },
  { id: "h7", name: "Date night", group: "weekly", sortOrder: 6 },
  { id: "h8", name: "Weekly planning", group: "weekly", sortOrder: 7 },
  { id: "h9", name: "Temple", group: "weekly", sortOrder: 8 },
];

/** Mon-first checkmarks. Deterministic so screenshots are stable. */
export const MOCK_HABIT_CHECKS: Record<string, boolean[]> = {
  h1: [true, true, true, true, true, false, false],
  h2: [true, true, true, true, false, false, false],
  h3: [true, false, true, true, true, false, false],
  h4: [true, true, false, true, false, false, false],
  h5: [true, false, true, false, true, false, false],
  h6: [true, true, true, false, false, false, false],
  h7: [false, false, false, false, true, false, false],
  h8: [false, false, false, false, false, false, true],
  h9: [false, false, true, false, false, false, false],
};

export const MOCK_TODOS: Todo[] = [
  {
    id: "t1",
    name: "Ship Companion Phase 0 → deploy",
    notes: "Get the Vercel pipeline green before anything else.",
    durationMinutes: 90,
    goalId: "w1",
    done: false,
    scheduledBlockId: null,
    createdAt: `${mockDay(0)}T08:00:00`,
    completedAt: null,
  },
  {
    id: "t2",
    name: "Call Grandma before dinner",
    notes: null,
    durationMinutes: 20,
    goalId: "w5",
    done: false,
    scheduledBlockId: null,
    createdAt: `${mockDay(1)}T09:00:00`,
    completedAt: null,
  },
  {
    id: "t3",
    name: "Follow up with Adam on the pilot",
    notes: "He asked for the revised scope.",
    durationMinutes: 30,
    goalId: "w2",
    done: true,
    scheduledBlockId: null,
    createdAt: `${mockDay(1)}T11:00:00`,
    completedAt: `${mockDay(1)}T15:00:00`,
  },
  {
    id: "t4",
    name: "Book the temple session",
    notes: null,
    durationMinutes: 15,
    goalId: null,
    done: false,
    scheduledBlockId: null,
    createdAt: `${mockDay(2)}T14:00:00`,
    completedAt: null,
  },
  {
    id: "t5",
    name: "Text Ben — check in",
    notes: null,
    durationMinutes: 10,
    goalId: "w2",
    done: true,
    scheduledBlockId: null,
    createdAt: `${mockDay(2)}T16:30:00`,
    completedAt: `${mockDay(2)}T17:00:00`,
  },
];

export const MOCK_PURPOSE =
  "I am a son of God, sent here to become like Him — to build a family that " +
  "loves each other, a business that serves people honestly, and a mind that " +
  "stays teachable. Every week is one more repetition of becoming.";
