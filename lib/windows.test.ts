import { describe, expect, it } from "vitest";
import { computeOpenWindows } from "./windows";
import type { CalendarBlock } from "./types";

const DAY = "2026-07-27";

function block(id: string, from: string, to: string): CalendarBlock {
  return {
    id,
    name: id,
    start: `${DAY}T${from}:00`,
    end: `${DAY}T${to}:00`,
    goalId: null,
    source: "companion",
    googleEventId: null,
    confirmedMinutes: null,
    notes: null,
  };
}

describe("computeOpenWindows", () => {
  it("returns the whole day when nothing is scheduled", () => {
    const [w] = computeOpenWindows([], DAY);
    expect(w.start).toBe(`${DAY}T06:00:00`);
    expect(w.end).toBe(`${DAY}T23:00:00`);
    expect(w.minutes).toBe(17 * 60);
  });

  it("finds the gaps between blocks", () => {
    const windows = computeOpenWindows(
      [block("a", "09:00", "12:00"), block("b", "14:00", "15:00")],
      DAY,
    );
    expect(windows.map((w) => [w.start.slice(11, 16), w.end.slice(11, 16)])).toEqual([
      ["06:00", "09:00"],
      ["12:00", "14:00"],
      ["15:00", "23:00"],
    ]);
  });

  it("drops slivers shorter than 15 minutes", () => {
    const windows = computeOpenWindows(
      [block("a", "06:00", "09:00"), block("b", "09:10", "23:00")],
      DAY,
    );
    expect(windows).toEqual([]);
  });

  // Regression: a late block pushed a window past the day boundary, and the
  // scheduler would then book a to-do after 11 PM.
  it("never opens a window past the day's end", () => {
    const windows = computeOpenWindows([block("late", "23:30", "23:59")], DAY);
    for (const w of windows) {
      expect(w.end <= `${DAY}T23:00:00`).toBe(true);
    }
    expect(windows.at(-1)?.end).toBe(`${DAY}T23:00:00`);
  });

  it("handles a block that runs past the day's end", () => {
    const windows = computeOpenWindows([block("a", "22:00", "23:59")], DAY);
    expect(windows.map((w) => w.end.slice(11, 16))).toEqual(["22:00"]);
  });

  it("ignores overlapping blocks rather than emitting negative gaps", () => {
    const windows = computeOpenWindows(
      [block("a", "09:00", "13:00"), block("b", "10:00", "11:00")],
      DAY,
    );
    expect(windows.every((w) => w.minutes > 0)).toBe(true);
    expect(windows.map((w) => w.start.slice(11, 16))).toEqual(["06:00", "13:00"]);
  });

  it("respects a custom hour window", () => {
    const [w] = computeOpenWindows([], DAY, 7, 19);
    expect(w.start.slice(11, 16)).toBe("07:00");
    expect(w.end.slice(11, 16)).toBe("19:00");
  });
});
