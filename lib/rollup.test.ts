import { describe, expect, it } from "vitest";
import {
  blocksInWeek,
  computeAllocation,
  computeKeyIndicator,
  todoItemsInWeek,
  type TodoCountItem,
} from "./rollup";
import type { CalendarBlock, Goal } from "./types";

const MON = new Date(2026, 6, 13); // Monday
const SUN = new Date(2026, 6, 19);

function block(
  id: string,
  date: string,
  from: string,
  to: string,
  goalId: string | null,
  name: string,
  confirmedMinutes: number | null = null,
): CalendarBlock {
  return {
    id,
    name,
    start: `${date}T${from}:00`,
    end: `${date}T${to}:00`,
    goalId,
    source: "companion",
    googleEventId: null,
    confirmedMinutes,
    notes: null,
  };
}

const deepWork: Goal = {
  id: "w1",
  title: "Deep work",
  tier: "week",
  parentId: "m1",
  icon: "laptop",
  note: null,
  badge: null,
  target: 20,
  unit: "hours",
  sortOrder: 0,
};

const outreach: Goal = { ...deepWork, id: "w2", title: "Outreach", target: 4, unit: "count" };

describe("blocksInWeek", () => {
  it("includes Sunday and excludes the following Monday", () => {
    const blocks = [
      block("a", "2026-07-13", "09:00", "10:00", "w1", "Build"),
      block("b", "2026-07-19", "09:00", "10:00", "w1", "Build"), // Sunday — in
      block("c", "2026-07-20", "09:00", "10:00", "w1", "Build"), // next Mon — out
      block("d", "2026-07-12", "09:00", "10:00", "w1", "Build"), // prev Sun — out
    ];
    expect(blocksInWeek(blocks, MON).map((b) => b.id)).toEqual(["a", "b"]);
    // Anchoring on Sunday must resolve to the same week.
    expect(blocksInWeek(blocks, SUN).map((b) => b.id)).toEqual(["a", "b"]);
  });
});

describe("hours unit", () => {
  const blocks = [
    block("a", "2026-07-13", "09:00", "12:00", "w1", "Companion build", 180),
    block("b", "2026-07-14", "09:00", "11:30", "w1", "Companion build", 120),
    block("c", "2026-07-14", "13:00", "15:00", "w1", "Client work", null),
    block("d", "2026-07-14", "16:00", "17:00", "w9", "Something else", 60),
  ];

  it("sums durations for planned and confirmed durations for done", () => {
    const ki = computeKeyIndicator(deepWork, blocks, []);
    expect(ki.planned).toBe(7.5); // 3 + 2.5 + 2 — other goals excluded
    expect(ki.done).toBe(5); // 180 + 120 minutes; unconfirmed block contributes 0
  });

  it("flags behind when planned time cannot reach the target", () => {
    expect(computeKeyIndicator(deepWork, blocks, []).behind).toBe(true);
    expect(computeKeyIndicator({ ...deepWork, target: 5 }, blocks, []).behind).toBe(false);
  });

  it("groups allocation rows by block name, not by block", () => {
    const alloc = computeAllocation(deepWork, blocks, []);
    expect(alloc.rows).toEqual([
      { label: "Companion build", planned: 5.5, done: 5 },
      { label: "Client work", planned: 2, done: 0 },
    ]);
    expect(alloc.totalPlanned).toBe(7.5);
  });
});

// Regression: to-do counts were scoped to the viewed week while blocks were,
// so stepping to another week still counted this week's checked-off to-dos.
describe("todoItemsInWeek", () => {
  const items: TodoCountItem[] = [
    { goalId: "w2", label: "prev Sunday", date: "2026-07-12" },
    { goalId: "w2", label: "Monday", date: "2026-07-13" },
    { goalId: "w2", label: "Sunday", date: "2026-07-19" },
    { goalId: "w2", label: "next Monday", date: "2026-07-20" },
  ];

  it("keeps only the Monday–Sunday window, inclusive at both ends", () => {
    expect(todoItemsInWeek(items, MON).map((t) => t.label)).toEqual([
      "Monday",
      "Sunday",
    ]);
  });

  it("returns nothing for a week with no to-dos", () => {
    expect(todoItemsInWeek(items, new Date(2026, 7, 10))).toEqual([]);
  });
});

describe("count unit", () => {
  const blocks = [
    block("a", "2026-07-13", "16:00", "16:30", "w2", "Outreach calls", 30),
    block("b", "2026-07-14", "16:00", "16:30", "w2", "Outreach calls", null),
  ];
  const todos: TodoCountItem[] = [
    { goalId: "w2", label: "Text Ben", date: "2026-07-15" },
    { goalId: "w9", label: "Not mine", date: "2026-07-15" },
  ];

  it("counts items rather than summing durations", () => {
    const ki = computeKeyIndicator(outreach, blocks, todos);
    expect(ki.planned).toBe(3); // 2 blocks + 1 matching to-do
    expect(ki.done).toBe(2); // 1 confirmed block + the checked-off to-do
  });

  // PRD §4.1a — the sanctioned exception to "the calendar is the only input".
  it("draws from checked-off to-dos as well as the calendar", () => {
    const withoutTodos = computeKeyIndicator(outreach, blocks, []);
    expect(withoutTodos.planned).toBe(2);
    expect(withoutTodos.done).toBe(1);
  });

  it("lists individual items labelled by origin, in date order", () => {
    const alloc = computeAllocation(outreach, blocks, todos);
    expect(alloc.rows).toHaveLength(3);
    expect(alloc.rows.map((r) => r.origin)).toEqual([
      "calendar",
      "calendar",
      "todo",
    ]);
    expect(alloc.rows[2].label).toBe("Text Ben");
  });
});
