import { differenceInCalendarDays, parseISO } from "date-fns";
import type { ExerciseSet, MuscleGroup, MuscleFatigue } from "./types";

/**
 * Estimated one-rep max (PRD §4.6).
 *
 * Epley and Brzycki disagree at the edges — Epley reads high at low reps,
 * Brzycki reads high at very high reps — so the average of the two is steadier
 * than either alone. Both return the lifted weight exactly at 1 rep.
 */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  const epley = weight * (1 + reps / 30);
  // Brzycki's denominator collapses at 37 reps and goes negative beyond it.
  const brzycki = reps < 36 ? (weight * 36) / (37 - reps) : epley;
  return round((epley + brzycki) / 2);
}

/** The best estimated 1RM across a set of lifts — the headline number. */
export function bestOneRepMax(sets: ExerciseSet[]): number {
  return sets.reduce(
    (best, s) => Math.max(best, estimateOneRepMax(s.weight, s.reps)),
    0,
  );
}

/** Σ(weight × reps) — the standard tonnage measure. */
export function volume(sets: ExerciseSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

/**
 * Reference weekly tonnage per muscle group, in pounds. A week at this volume
 * with no rest reads as fully fatigued.
 *
 * ponytail: one global constant, not per-muscle calibration. Legs genuinely
 * tolerate more tonnage than arms; if the suggestions come out lopsided, make
 * this a per-muscle lookup rather than adding a new model.
 */
const REFERENCE_WEEKLY_VOLUME = 12000;

/** Days of rest after which a muscle is treated as fully recovered. */
export const FULL_RECOVERY_DAYS = 4;

/**
 * Fatigue per muscle group (PRD §4.6): recent volume weighed against days of
 * rest since that muscle was last worked. Feeds Bumstead's next suggestion —
 * don't hammer a fatigued muscle, push a fresh one.
 *
 * Returns 0 (fresh) … 1 (hammered).
 */
export function computeFatigue(
  muscleGroup: MuscleGroup,
  sets: ExerciseSet[],
  today: Date,
  windowDays = 7,
): MuscleFatigue {
  const recent = sets.filter(
    (s) => differenceInCalendarDays(today, parseISO(s.performedAt)) < windowDays,
  );

  const recentVolume = volume(recent);

  const daysRest = recent.length === 0 && sets.length === 0
    ? FULL_RECOVERY_DAYS
    : Math.min(
        FULL_RECOVERY_DAYS,
        sets.reduce(
          (min, s) =>
            Math.min(min, differenceInCalendarDays(today, parseISO(s.performedAt))),
          Number.POSITIVE_INFINITY,
        ),
      );

  const load = Math.min(1, recentVolume / REFERENCE_WEEKLY_VOLUME);
  // Linear recovery: every rest day sheds a quarter of the accumulated load.
  const recovery = 1 - Math.min(1, daysRest / FULL_RECOVERY_DAYS);

  return {
    muscleGroup,
    recentVolume: Math.round(recentVolume),
    daysRest: Number.isFinite(daysRest) ? daysRest : FULL_RECOVERY_DAYS,
    score: round(load * recovery),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
