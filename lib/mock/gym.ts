/**
 * MOCK FIXTURES — Gym (PRD §4.6).
 *
 * The suggested weights/reps are what Claude Bumstead proposed; the logged sets
 * are what Carter actually did. That gap is the calibration loop.
 */
import { subDays } from "date-fns";
import type { Exercise, ExerciseSet } from "../types";
import { toIsoDate } from "../week";

export const MOCK_EXERCISES: Exercise[] = [
  {
    id: "e1",
    name: "Bench press",
    muscleGroup: "chest",
    suggestedWeight: 195,
    suggestedReps: 5,
    suggestedSets: 4,
  },
  {
    id: "e2",
    name: "Incline dumbbell press",
    muscleGroup: "chest",
    suggestedWeight: 70,
    suggestedReps: 10,
    suggestedSets: 3,
  },
  {
    id: "e3",
    name: "Barbell row",
    muscleGroup: "back",
    suggestedWeight: 155,
    suggestedReps: 8,
    suggestedSets: 4,
  },
  {
    id: "e4",
    name: "Overhead press",
    muscleGroup: "shoulders",
    suggestedWeight: 115,
    suggestedReps: 6,
    suggestedSets: 3,
  },
  {
    id: "e5",
    name: "Back squat",
    muscleGroup: "legs",
    suggestedWeight: 245,
    suggestedReps: 5,
    suggestedSets: 4,
  },
  {
    id: "e6",
    name: "Romanian deadlift",
    muscleGroup: "legs",
    suggestedWeight: 185,
    suggestedReps: 8,
    suggestedSets: 3,
  },
  {
    id: "e7",
    name: "Barbell curl",
    muscleGroup: "arms",
    suggestedWeight: 75,
    suggestedReps: 10,
    suggestedSets: 3,
  },
];

let n = 0;
const at = (daysAgo: number, hour = 7) =>
  `${toIsoDate(subDays(new Date(), daysAgo))}T${String(hour).padStart(2, "0")}:00:00`;

const s = (
  exerciseId: string,
  weight: number,
  reps: number,
  daysAgo: number,
  isPr = false,
): ExerciseSet => ({
  id: `s${++n}`,
  exerciseId,
  weight,
  reps,
  performedAt: at(daysAgo),
  isPr,
});

/** A few weeks of history so the trend lines have something to say. */
export const MOCK_SETS: ExerciseSet[] = [
  // Bench — climbing toward the 225 goal
  s("e1", 175, 5, 21),
  s("e1", 175, 5, 21),
  s("e1", 175, 4, 21),
  s("e1", 180, 5, 14),
  s("e1", 180, 5, 14),
  s("e1", 180, 4, 14),
  s("e1", 185, 5, 7),
  s("e1", 185, 5, 7),
  s("e1", 185, 5, 7),
  s("e1", 190, 5, 2),
  s("e1", 190, 5, 2),
  s("e1", 195, 3, 2, true),

  // Squat
  s("e5", 225, 5, 19),
  s("e5", 225, 5, 19),
  s("e5", 225, 5, 19),
  s("e5", 235, 5, 12),
  s("e5", 235, 5, 12),
  s("e5", 235, 4, 12),
  s("e5", 245, 5, 5),
  s("e5", 245, 5, 5),
  s("e5", 245, 5, 5, true),

  // Row
  s("e3", 145, 8, 18),
  s("e3", 145, 8, 18),
  s("e3", 155, 8, 11),
  s("e3", 155, 8, 11),
  s("e3", 155, 7, 11),
  s("e3", 155, 8, 4),
  s("e3", 155, 8, 4),

  // Overhead press
  s("e4", 105, 6, 16),
  s("e4", 105, 6, 16),
  s("e4", 110, 6, 9),
  s("e4", 110, 5, 9),
  s("e4", 115, 6, 3, true),

  // Arms — deliberately fresh, so fatigue reads low
  s("e7", 70, 10, 13),
  s("e7", 70, 10, 13),
];
