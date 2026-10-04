import { describe, expect, it } from "vitest";
import {
  FULL_RECOVERY_DAYS,
  bestOneRepMax,
  computeFatigue,
  estimateOneRepMax,
  volume,
} from "./strength";
import type { ExerciseSet } from "./types";

const TODAY = new Date(2026, 6, 27);

function set(
  id: string,
  weight: number,
  reps: number,
  daysAgo: number,
): ExerciseSet {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T07:00:00`;
  return { id, exerciseId: "e1", weight, reps, performedAt: iso, isPr: false };
}

describe("estimateOneRepMax", () => {
  it("returns the bar weight itself at a single rep", () => {
    expect(estimateOneRepMax(225, 1)).toBe(225);
  });

  it("estimates above the lifted weight for multi-rep sets", () => {
    // 185 x 5 is roughly a 210 lb max by both formulas.
    const est = estimateOneRepMax(185, 5);
    expect(est).toBeGreaterThan(205);
    expect(est).toBeLessThan(215);
  });

  it("increases monotonically with reps at the same weight", () => {
    const three = estimateOneRepMax(185, 3);
    const five = estimateOneRepMax(185, 5);
    const eight = estimateOneRepMax(185, 8);
    expect(five).toBeGreaterThan(three);
    expect(eight).toBeGreaterThan(five);
  });

  // Brzycki's denominator is (37 - reps): it explodes at 36 and goes negative
  // past 37, which would report a *negative* one-rep max.
  it("stays finite and positive at absurd rep counts", () => {
    const est = estimateOneRepMax(95, 40);
    expect(Number.isFinite(est)).toBe(true);
    expect(est).toBeGreaterThan(0);
  });

  it("treats zero or negative input as no lift", () => {
    expect(estimateOneRepMax(0, 5)).toBe(0);
    expect(estimateOneRepMax(185, 0)).toBe(0);
    expect(estimateOneRepMax(-10, 5)).toBe(0);
  });
});

describe("bestOneRepMax", () => {
  it("takes the strongest set, not the last or heaviest", () => {
    const sets = [
      set("a", 225, 1, 0), // 225
      set("b", 185, 8, 0), // ~230 — lighter bar, better max
    ];
    expect(bestOneRepMax(sets)).toBeGreaterThan(225);
  });

  it("is zero with no sets", () => {
    expect(bestOneRepMax([])).toBe(0);
  });
});

describe("volume", () => {
  it("sums weight x reps", () => {
    expect(volume([set("a", 100, 10, 0), set("b", 50, 4, 0)])).toBe(1200);
  });
});

describe("computeFatigue", () => {
  it("reads fully fresh when the muscle has never been worked", () => {
    const f = computeFatigue("chest", [], TODAY);
    expect(f.score).toBe(0);
    expect(f.daysRest).toBe(FULL_RECOVERY_DAYS);
  });

  it("reads fatigued after heavy volume worked today", () => {
    // 12,000 lb of tonnage today = the reference week in one session.
    const sets = Array.from({ length: 12 }, (_, i) => set(`s${i}`, 200, 5, 0));
    const f = computeFatigue("legs", sets, TODAY);
    expect(f.recentVolume).toBe(12000);
    expect(f.daysRest).toBe(0);
    expect(f.score).toBe(1);
  });

  it("sheds fatigue as rest days accumulate", () => {
    const heavy = (daysAgo: number) =>
      Array.from({ length: 12 }, (_, i) => set(`s${i}`, 200, 5, daysAgo));
    const day0 = computeFatigue("legs", heavy(0), TODAY).score;
    const day2 = computeFatigue("legs", heavy(2), TODAY).score;
    expect(day2).toBeLessThan(day0);
    // Four days of rest is full recovery, even after the same tonnage.
    expect(computeFatigue("legs", heavy(4), TODAY).score).toBe(0);
  });

  it("ignores volume outside the recent window", () => {
    const old = Array.from({ length: 12 }, (_, i) => set(`s${i}`, 200, 5, 10));
    expect(computeFatigue("back", old, TODAY).recentVolume).toBe(0);
  });
});
