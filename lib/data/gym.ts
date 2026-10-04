/**
 * DATA SEAM — Gym (PRD §4.6).
 *
 * Claude Bumstead writes the day's suggestion; Carter logs the actuals here.
 * 1RM and per-muscle fatigue are DERIVED from the logged sets and feed
 * Bumstead's next suggestion.
 */
import type {
  Exercise,
  ExerciseSet,
  MuscleFatigue,
  MuscleGroup,
  OneRepMaxPoint,
} from "../types";
import { bestOneRepMax, computeFatigue, estimateOneRepMax } from "../strength";
import { datePart, toIsoDate } from "../week";
import { store } from "../mock/store";

const exercises = store.exercises;
const sets = store.sets;
let counter = 1;

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
];

export interface SessionExercise {
  exercise: Exercise;
  /** Sets logged today. */
  sets: ExerciseSet[];
  /** Best estimated 1RM across all history for this lift. */
  bestOneRepMax: number;
}

/** Today's session: Bumstead's suggestion plus whatever has been logged. */
export async function getTodaySession(): Promise<SessionExercise[]> {
  const today = toIsoDate(new Date());
  return exercises.map((exercise) => ({
    exercise,
    sets: sets.filter(
      (s) => s.exerciseId === exercise.id && datePart(s.performedAt) === today,
    ),
    bestOneRepMax: bestOneRepMax(
      sets.filter((s) => s.exerciseId === exercise.id),
    ),
  }));
}

export async function logSet(input: {
  exerciseId: string;
  weight: number;
  reps: number;
}): Promise<void> {
  const existing = sets.filter((s) => s.exerciseId === input.exerciseId);
  const previousBest = bestOneRepMax(existing);
  const estimate = estimateOneRepMax(input.weight, input.reps);
  sets.push({
    id: `s-new-${counter++}`,
    exerciseId: input.exerciseId,
    weight: input.weight,
    reps: input.reps,
    performedAt: `${toIsoDate(new Date())}T${new Date()
      .toTimeString()
      .slice(0, 8)}`,
    // A PR is a new best estimated max, not simply a heavier bar.
    isPr: estimate > previousBest,
  });
}

export async function deleteSet(id: string): Promise<void> {
  const i = sets.findIndex((s) => s.id === id);
  if (i >= 0) sets.splice(i, 1);
}

/** Per-lift estimated 1RM over time — one point per training day. */
export async function getOneRepMaxTrend(
  exerciseId: string,
): Promise<OneRepMaxPoint[]> {
  const byDate = new Map<string, number>();
  for (const s of sets.filter((x) => x.exerciseId === exerciseId)) {
    const date = datePart(s.performedAt);
    const estimate = estimateOneRepMax(s.weight, s.reps);
    byDate.set(date, Math.max(byDate.get(date) ?? 0, estimate));
  }
  return [...byDate.entries()]
    .map(([date, estimate]) => ({ date, estimate }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Fatigue per muscle group — recent volume against days of rest.
 * This is what stops Bumstead suggesting legs the morning after a heavy squat.
 */
export async function getFatigue(): Promise<MuscleFatigue[]> {
  const today = new Date();
  return MUSCLE_GROUPS.map((group) => {
    const ids = exercises
      .filter((e) => e.muscleGroup === group)
      .map((e) => e.id);
    return computeFatigue(
      group,
      sets.filter((s) => ids.includes(s.exerciseId)),
      today,
    );
  });
}

/** Lifts with any history, for the trend picker. */
export async function getTrackedExercises(): Promise<Exercise[]> {
  const trained = new Set(sets.map((s) => s.exerciseId));
  return exercises.filter((e) => trained.has(e.id));
}
