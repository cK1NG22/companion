import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatMinutes,
  lastDoneChip,
  sumHours,
} from "./format";

describe("formatMinutes", () => {
  it("stays in minutes under an hour", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(59)).toBe("59m");
  });

  it("renders zero rather than hiding it", () => {
    expect(formatMinutes(0)).toBe("0m");
  });

  it("drops the minutes part on a whole hour", () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(120)).toBe("2h");
  });

  it("shows hours and minutes past an hour", () => {
    expect(formatMinutes(61)).toBe("1h 1m");
    expect(formatMinutes(90)).toBe("1h 30m");
  });
});

describe("formatDuration", () => {
  it("is null when there is no duration", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(0)).toBeNull();
  });

  // The one place it differs from formatMinutes: "45 min", not "45m".
  it("spells out minutes under an hour", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(59)).toBe("59 min");
  });

  it("matches formatMinutes from an hour up", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(61)).toBe("1h 1m");
    expect(formatDuration(90)).toBe("1h 30m");
  });
});

const DAY_MS = 86_400_000;
const NOW = new Date("2026-10-04T12:00:00Z").getTime();
const ago = (days: number) => new Date(NOW - days * DAY_MS).toISOString();

describe("lastDoneChip", () => {
  it("is null when never done", () => {
    expect(lastDoneChip(null, NOW)).toBeNull();
    expect(lastDoneChip("", NOW)).toBeNull();
  });

  it("says today for now, the future, and under half a day ago", () => {
    expect(lastDoneChip(ago(0), NOW)).toBe("today");
    expect(lastDoneChip(ago(-3), NOW)).toBe("today");
    expect(lastDoneChip(ago(0.49), NOW)).toBe("today");
  });

  it("rounds to the nearest day, half up", () => {
    expect(lastDoneChip(ago(0.5), NOW)).toBe("1d ago");
    expect(lastDoneChip(ago(3), NOW)).toBe("3d ago");
    expect(lastDoneChip(ago(29.49), NOW)).toBe("29d ago");
  });

  it("switches to months at 30 rounded days", () => {
    expect(lastDoneChip(ago(29.5), NOW)).toBe("1mo ago");
    expect(lastDoneChip(ago(30), NOW)).toBe("1mo ago");
  });

  it("rounds months from 30-day units, half up", () => {
    expect(lastDoneChip(ago(44), NOW)).toBe("1mo ago");
    expect(lastDoneChip(ago(45), NOW)).toBe("2mo ago");
    expect(lastDoneChip(ago(365), NOW)).toBe("12mo ago");
  });

  // Same as never done: the caller renders no chip rather than "NaNmo ago".
  it("is null for an unparseable date", () => {
    expect(lastDoneChip("not a date", NOW)).toBeNull();
  });
});

describe("sumHours", () => {
  it("is zero for no entries", () => {
    expect(sumHours([])).toBe(0);
  });

  it("converts summed minutes to hours without rounding", () => {
    expect(sumHours([60, 30])).toBe(1.5);
    expect(sumHours([20])).toBeCloseTo(1 / 3);
  });

  it("counts invalid (null) entries as zero", () => {
    expect(sumHours([60, null, 30])).toBe(1.5);
    expect(sumHours([null])).toBe(0);
  });
});
