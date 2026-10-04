import { describe, expect, it } from "vitest";
import { parseISO } from "date-fns";
import { computeOpenWindows, overlapsDay } from "./windows";
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
    expect(
      windows.map((w) => [w.start.slice(11, 16), w.end.slice(11, 16)]),
    ).toEqual([
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
    expect(windows.map((w) => w.start.slice(11, 16))).toEqual([
      "06:00",
      "13:00",
    ]);
  });

  it("respects a custom hour window", () => {
    const [w] = computeOpenWindows([], DAY, 7, 19);
    expect(w.start.slice(11, 16)).toBe("07:00");
    expect(w.end.slice(11, 16)).toBe("19:00");
  });
});

describe("overlapsDay", () => {
  const overnight = block("overnight", "22:00", "23:59");
  // A block that starts the previous evening and ends this morning.
  const crossing: CalendarBlock = {
    ...block("crossing", "00:00", "07:00"),
    start: "2026-07-26T22:00:00",
    end: `${DAY}T07:00:00`,
  };

  it("includes a block that starts the day before and ends today", () => {
    expect(overlapsDay(crossing, DAY)).toBe(true);
    expect(overlapsDay(crossing, "2026-07-26")).toBe(true);
  });

  it("excludes blocks entirely on other days", () => {
    expect(overlapsDay(overnight, "2026-07-28")).toBe(false);
    expect(overlapsDay(overnight, "2026-07-26")).toBe(false);
  });

  // Without this, an overnight event would leave 6–7 AM looking free.
  it("consumes the morning when a block crosses midnight into today", () => {
    const windows = computeOpenWindows([crossing], DAY);
    expect(windows[0].start.slice(11, 16)).toBe("07:00");
  });
});

describe("notBefore", () => {
  it("drops windows that have already passed", () => {
    const threePm = parseISO(`${DAY}T15:00:00`);
    const windows = computeOpenWindows([], DAY, 6, 23, threePm);
    expect(windows).toHaveLength(1);
    expect(windows[0].start.slice(11, 16)).toBe("15:00");
  });

  it("clips a window that is partly in the past", () => {
    const nine = parseISO(`${DAY}T09:00:00`);
    const windows = computeOpenWindows(
      [block("a", "12:00", "13:00")],
      DAY,
      6,
      23,
      nine,
    );
    expect(windows[0].start.slice(11, 16)).toBe("09:00");
    expect(windows[0].end.slice(11, 16)).toBe("12:00");
  });

  it("returns nothing once the day is over", () => {
    expect(
      computeOpenWindows([], DAY, 6, 23, parseISO(`${DAY}T23:30:00`)),
    ).toEqual([]);
  });
});
