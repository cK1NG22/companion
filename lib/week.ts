import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  startOfWeek,
  parseISO,
} from "date-fns";
import type { IsoDate } from "./types";

/**
 * The week runs Monday → Sunday. Everywhere. PRD §4.10.
 * Every week calculation in the app must go through this module so that
 * invariant is stated exactly once.
 */
export const WEEK_STARTS_ON = 1 as const; // Monday

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** "2026-07-27" — date only, no timezone drift from toISOString(). */
export function toIsoDate(date: Date): IsoDate {
  return format(date, "yyyy-MM-dd");
}

/** "2026-07-27T09:00:00" → "2026-07-27" — the date part of a local-naive timestamp. */
export function datePart(iso: string): IsoDate {
  return iso.slice(0, 10);
}

export function fromIsoDate(iso: IsoDate): Date {
  return parseISO(iso);
}

/** The Monday on or before `date`. */
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
}

/** The seven days of the week containing `date`, Monday first. */
export function weekDays(date: Date): Date[] {
  const monday = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Step forward or back by whole weeks — the Home week stepper. */
export function shiftWeeks(date: Date, delta: number): Date {
  return weekStart(addWeeks(date, delta));
}

export function isSameWeek(a: Date, b: Date): boolean {
  return isSameDay(weekStart(a), weekStart(b));
}

/**
 * "week of Jul 13 – 19" / "week of Jun 29 – Jul 5" when the week spans months.
 * Matches the mockup's header format.
 */
export function formatWeekLabel(date: Date): string {
  const monday = weekStart(date);
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const left = format(monday, "MMM d");
  const right = sameMonth ? format(sunday, "d") : format(sunday, "MMM d");
  return `week of ${left} – ${right}`;
}

/** Index of a date within its Monday-first week: Monday = 0 … Sunday = 6. */
export function dayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Resolve the week being viewed from the `?w=YYYY-MM-DD` search param.
 * Falls back to today for a missing or unparseable value, so a hand-typed or
 * stale URL degrades to "this week" instead of rendering an Invalid Date.
 */
export function resolveAnchor(param?: string | string[]): Date {
  const raw = Array.isArray(param) ? param[0] : param;
  if (!raw) return new Date();
  const parsed = parseISO(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
