import { describe, expect, it } from "vitest";
import {
  DAY_LABELS,
  dayIndex,
  formatWeekLabel,
  isSameWeek,
  shiftWeeks,
  toIsoDate,
  weekDays,
  weekStart,
} from "./week";

// 2026-07-13 is a Monday; 2026-07-19 the Sunday that closes that week.
const MON = new Date(2026, 6, 13);
const WED = new Date(2026, 6, 15);
const SUN = new Date(2026, 6, 19);

describe("Monday-first week (PRD §4.10)", () => {
  it("treats Monday as day one", () => {
    expect(dayIndex(MON)).toBe(0);
    expect(dayIndex(WED)).toBe(2);
    expect(dayIndex(SUN)).toBe(6);
    expect(DAY_LABELS[dayIndex(SUN)]).toBe("Sun");
  });

  // The classic off-by-one: with a Sunday-first week, Sunday would roll
  // forward into the NEXT week and every rollup would be attributed wrong.
  it("keeps Sunday in the week that just ended, not the next one", () => {
    expect(toIsoDate(weekStart(SUN))).toBe("2026-07-13");
    expect(isSameWeek(MON, SUN)).toBe(true);
    expect(isSameWeek(SUN, new Date(2026, 6, 20))).toBe(false);
  });

  it("returns seven days starting Monday", () => {
    const days = weekDays(SUN);
    expect(days).toHaveLength(7);
    expect(toIsoDate(days[0])).toBe("2026-07-13");
    expect(toIsoDate(days[6])).toBe("2026-07-19");
  });

  it("steps whole weeks and snaps to Monday", () => {
    expect(toIsoDate(shiftWeeks(WED, -1))).toBe("2026-07-06");
    expect(toIsoDate(shiftWeeks(WED, 1))).toBe("2026-07-20");
    expect(toIsoDate(shiftWeeks(WED, 0))).toBe("2026-07-13");
  });
});

describe("week label", () => {
  it("collapses the month when the week sits inside one", () => {
    expect(formatWeekLabel(WED)).toBe("week of Jul 13 – 19");
  });

  it("shows both months when the week spans a boundary", () => {
    // 2026-06-29 is a Monday; that week ends Sunday 2026-07-05.
    expect(formatWeekLabel(new Date(2026, 5, 29))).toBe(
      "week of Jun 29 – Jul 5",
    );
  });
});

describe("toIsoDate", () => {
  it("uses local calendar days, not UTC (no midnight timezone drift)", () => {
    // toISOString() would report the previous day for a late-evening local time
    // in a negative-offset timezone. Local formatting must not.
    expect(toIsoDate(new Date(2026, 6, 13, 23, 30))).toBe("2026-07-13");
    expect(toIsoDate(new Date(2026, 6, 13, 0, 15))).toBe("2026-07-13");
  });
});
