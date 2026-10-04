/**
 * Companion domain types — derived from PRD §3 (Core data model).
 *
 * These are the contract between screens and `lib/data/`. They do not change
 * when the data source swaps from mock fixtures to Neon/Drizzle.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/**
 * Goal icons. PRD §4.2 — the approved assortment. Rendered by <GoalIcon />.
 *
 * The tuple is the single source of truth and the type is derived from it, so
 * `z.enum(ICON_KEYS)` keeps the literal union instead of widening to `string`.
 */
export const ICON_KEYS = [
  "book",
  "dumbbell",
  "laptop",
  "phone",
  "heart",
  "temple",
  "moon",
  "target",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/** ISO date, no time component: "2026-07-27". */
export type IsoDate = string;

/** Full ISO timestamp. */
export type IsoDateTime = string;

// ---------------------------------------------------------------------------
// Goals funnel — PRD §4.2 (Goals → Plans → Inputs)
// ---------------------------------------------------------------------------

/** year = Goals (identity), month = Plans (means), week = Inputs (key indicators). */
export type GoalTier = "year" | "month" | "week";

/**
 * Key-indicator unit. EXACTLY TWO EXIST (PRD §4.1a).
 * `days` is not a unit — "Scripture 7 days" is a `count` with target 7.
 * Do not add `tally` or `value`.
 */
export type KeyIndicatorUnit = "hours" | "count";

export interface Goal {
  id: string;
  title: string;
  tier: GoalTier;
  /** Line-of-sight link, chosen by the human during planning — never inferred. */
  parentId: string | null;
  icon: IconKey | null;
  /** Optional note that makes the goal actionable. */
  note: string | null;
  /** Letter badge (A/B/C/D) — yearly goals only, used as ladder targets. */
  badge: string | null;
  /** Weekly target. Only meaningful for tier "week" (an Input / key indicator). */
  target: number | null;
  unit: KeyIndicatorUnit | null;
  sortOrder: number;
}

/**
 * A weekly Input rendered as a Home "this week at a glance" tile.
 * Target → Planned → Done. PRD §4.1 / §4.1a.
 */
export interface KeyIndicator {
  goalId: string;
  title: string;
  icon: IconKey | null;
  unit: KeyIndicatorUnit;
  /** The weekly number. Grey base of the bar / the denominator. */
  target: number;
  /** Calendar blocks (and, for `count`, checked-off to-dos) assigned this week. */
  planned: number;
  /** The same, confirmed at night. Fills the bar solid. */
  done: number;
  /** Render the bar in clay instead of navy — used when behind pace. */
  behind: boolean;
}

/**
 * One row of the tile pop-up.
 * For `hours` units: calendar blocks grouped by name (name is the join key —
 * projects emerge from what's scheduled). For `count` units: the actual items.
 */
export interface AllocationRow {
  /** Block name for `hours`; item label for `count`. */
  label: string;
  planned: number;
  done: number;
  /** `count` rows only — where the item came from. PRD §4.1a. */
  origin?: "calendar" | "todo";
  /** `count` rows only — when it happened. */
  date?: IsoDate;
}

export interface Allocation {
  goalId: string;
  title: string;
  icon: IconKey | null;
  unit: KeyIndicatorUnit;
  target: number;
  rows: AllocationRow[];
  totalPlanned: number;
  totalDone: number;
}

// ---------------------------------------------------------------------------
// Calendar — PRD §4.3
// ---------------------------------------------------------------------------

export interface CalendarBlock {
  id: string;
  /** The event name. Blocks sharing a name inside a goal group into one allocation row. */
  name: string;
  start: IsoDateTime;
  end: IsoDateTime;
  goalId: string | null;
  /** Where it came from. Companion-planned blocks are written back to Google. */
  source: "companion" | "google";
  googleEventId: string | null;
  /** Confirmed real duration in minutes, written by the Nightly "Confirm & log hours". */
  confirmedMinutes: number | null;
  /** Free-text notes. Date planner writes 📍 lines here so places are navigable. */
  notes: string | null;
}

/** A gap between blocks on a given day. Derived, never stored. PRD §4.7. */
export interface OpenWindow {
  start: IsoDateTime;
  end: IsoDateTime;
  minutes: number;
}

// ---------------------------------------------------------------------------
// Habits — PRD §4.1 (weekly grid)
// ---------------------------------------------------------------------------

/** Grid grouping. "Standards of Excellence" items are daily; "Weekly" are once-a-week. */
export type HabitGroup = "required" | "standards" | "weekly";

export interface Habit {
  id: string;
  name: string;
  group: HabitGroup;
  sortOrder: number;
}

/** One habit's row across Mon–Sun. `days[0]` is Monday. PRD §4.10. */
export interface HabitRow {
  habit: Habit;
  days: boolean[];
}

export interface HabitGrid {
  /** Monday of the week being displayed. */
  weekStart: IsoDate;
  rows: HabitRow[];
}

// ---------------------------------------------------------------------------
// To-dos — PRD §4.2
// ---------------------------------------------------------------------------

export interface Todo {
  id: string;
  name: string;
  notes: string | null;
  /** Drives the length of the calendar event when scheduled. */
  durationMinutes: number | null;
  goalId: string | null;
  done: boolean;
  /** Set when "Schedule" turned this into a calendar block. */
  scheduledBlockId: string | null;
  createdAt: IsoDateTime;
  /**
   * When it was checked off. A completed to-do contributes to a `count` key
   * indicator (PRD §4.1a), and that contribution has to be attributable to a
   * week — so the completion needs its own timestamp, not `createdAt`.
   */
  completedAt: IsoDateTime | null;
}

// ---------------------------------------------------------------------------
// People — PRD §4.4
// ---------------------------------------------------------------------------

export type ContactChannel = "email" | "text" | "calendar";

export interface Person {
  id: string;
  name: string;
  relationship: string | null;
  /** What to do next with this person. */
  nextStep: string | null;
  /** Freshest of email / text / calendar. Null = never contacted. */
  lastContactAt: IsoDateTime | null;
  lastContactSource: ContactChannel | null;
  daysSinceContact: number | null;
  /** Past the cadence we want to keep with them. */
  overdue: boolean;
  /** Filtered out of the People list AND out of the iMessage scan itself. */
  excluded: boolean;
}

// ---------------------------------------------------------------------------
// Daily rhythm — PRD §4.8, §4.9
// ---------------------------------------------------------------------------

/** A section of the Morning Review reading. User-editable and reorderable. */
export interface MorningSection {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
}

/** PRD §4.9 — question order is LOCKED. */
export interface NightlyEntry {
  date: IsoDate;
  gratitude: string;
  whatHappened: string;
  repentAndImprove: string;
  prepareForTomorrow: string;
  /** Defined at night, carried into tomorrow's Plan Today. */
  topThree: string[];
  hoursConfirmed: boolean;
}

// ---------------------------------------------------------------------------
// Scripture — PRD §4.5
// ---------------------------------------------------------------------------

export interface ScriptureNote {
  id: string;
  date: IsoDate;
  /** Passage or reference, e.g. "Alma 32". */
  reference: string;
  body: string;
}

export interface CarriedQuestion {
  id: string;
  text: string;
  resolved: boolean;
}

export interface Reading {
  id: string;
  title: string;
  type: "scripture" | "book";
  /** Human-readable progress, e.g. "Ch. 7 of 42". */
  progress: string;
  /** 0–100, for the progress bar. */
  percent: number;
}

// ---------------------------------------------------------------------------
// Gym — PRD §4.6
// ---------------------------------------------------------------------------

export type MuscleGroup =
  "chest" | "back" | "shoulders" | "arms" | "legs" | "core";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** What Claude Bumstead suggested for today. */
  suggestedWeight: number | null;
  suggestedReps: number | null;
  suggestedSets: number | null;
}

export interface ExerciseSet {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  performedAt: IsoDateTime;
  /** Personal record for this lift. Derived, highlighted in the UI. */
  isPr: boolean;
}

/** Estimated one-rep max over time, per lift. Derived — see lib/one-rep-max.ts. */
export interface OneRepMaxPoint {
  date: IsoDate;
  estimate: number;
}

/** Recent volume weighed against days of rest. See lib/fatigue.ts. */
export interface MuscleFatigue {
  muscleGroup: MuscleGroup;
  /** Σ(weight × reps) over the recent window. */
  recentVolume: number;
  daysRest: number;
  /** 0–1. Higher = more fatigued. Feeds Bumstead's next suggestion. */
  score: number;
}

// ---------------------------------------------------------------------------
// Feedback loop — PRD §4.11
// ---------------------------------------------------------------------------

export type FeedbackKind = "app_edit" | "date_research";
export type FeedbackStatus = "queued" | "applied" | "rejected";

export interface FeedbackItem {
  id: string;
  text: string;
  kind: FeedbackKind;
  /** Which tab the feedback refers to. */
  tab: string | null;
  status: FeedbackStatus;
  createdAt: IsoDateTime;
  /** The commit/diff or researched idea the runner produced. */
  result: string | null;
}

// ---------------------------------------------------------------------------
// Date planner — PRD §4.12 (hybrid: food is live, activities are owned)
// ---------------------------------------------------------------------------

export type DateMode = "food" | "activity";

/** 1–4, rendered as $ – $$$$. */
export type PriceTier = 1 | 2 | 3 | 4;

/**
 * A restaurant. LIVE from Google Places — we persist NOTHING about it except
 * `placeId` in `place_history`. Google's TOS forbids caching venue data, which
 * conveniently enforces the no-owned-database principle.
 */
export interface FoodPlace {
  placeId: string;
  name: string;
  cuisine: string;
  priceTier: PriceTier | null;
  rating: number | null;
  address: string;
  lat: number;
  lng: number;
  /** Straight-line miles from the anchor. Free math, not an API call. */
  distanceMiles: number;
  openNow: boolean | null;
  phone: string | null;
  website: string | null;
  /** Photos are the one field with real cost — show 1–2, link out for the rest. */
  photoUrls: string[];
  /** From our own `place_history`. The only restaurant data we keep. */
  lastDone: IsoDate | null;
}

/**
 * A curated activity. FIRST-PARTY data we own, because Places APIs expose no
 * price and no niche category for activities.
 */
export interface Activity {
  id: string;
  name: string;
  category: string;
  priceTier: PriceTier;
  priceNote: string | null;
  lat: number;
  lng: number;
  notes: string | null;
  bookingUrl: string | null;
  lastDone: IsoDate | null;
  status: "active" | "pending_review";
  /** Straight-line miles from the anchor. Populated at query time. */
  distanceMiles: number;
}

/** Result of a Dice Roll — one stale cuisine + one stale activity. PRD §4.12. */
export interface DiceRoll {
  food: FoodPlace | null;
  activity: Activity | null;
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export interface HomeLocation {
  lat: number;
  lng: number;
  label: string;
}
