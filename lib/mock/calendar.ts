/**
 * MOCK FIXTURES — calendar blocks.
 *
 * Home's key-indicator tiles are DERIVED from these (PRD §1: one input surface,
 * everything else is a read-only rollup). Nothing here is a pre-computed total.
 */
import type { CalendarBlock } from "../types";
import { mockDay } from "./planner";

let seq = 0;

/**
 * @param day     offset from Monday (0 = Mon … 6 = Sun)
 * @param from    start hour, 24h decimal (9.5 = 09:30)
 * @param hours   duration in hours
 * @param actual  confirmed real duration in hours; omit if not yet confirmed
 */
function block(
  day: number,
  from: number,
  hours: number,
  name: string,
  goalId: string | null,
  actual?: number,
): CalendarBlock {
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const mins = (n: number) => pad((n % 1) * 60);
  const date = mockDay(day);
  return {
    id: `b${++seq}`,
    name,
    start: `${date}T${pad(from)}:${mins(from)}:00`,
    end: `${date}T${pad(from + hours)}:${mins(from + hours)}:00`,
    goalId,
    source: "companion",
    googleEventId: null,
    confirmedMinutes: actual === undefined ? null : Math.round(actual * 60),
    notes: null,
  };
}

/**
 * A believable week. Deep-work blocks deliberately share names across days so
 * the allocation pop-up has something to group — "projects emerge from what's
 * scheduled" (PRD §3).
 */
export const MOCK_BLOCKS: CalendarBlock[] = [
  // Monday
  block(0, 6.75, 1, "Lift — push", "w4", 1),
  block(0, 8, 0.5, "Scripture study", "w3", 0.5),
  block(0, 9, 3, "Companion build", "w1", 3),
  block(0, 13, 2, "Optimal — client work", "w1", 1.5),
  block(0, 16, 0.5, "Outreach calls", "w2", 0.5),
  block(0, 18.5, 1.5, "Dinner with Sarah", "w5", 1.5),

  // Tuesday
  block(1, 8, 0.5, "Scripture study", "w3", 0.5),
  block(1, 9, 3, "Companion build", "w1", 2.5),
  block(1, 13, 2, "Optimal — client work", "w1", 2),
  block(1, 15.5, 0.5, "Outreach calls", "w2", 0.5),
  block(1, 19, 1.5, "Family evening", "w5", 1.5),

  // Wednesday
  block(2, 6.75, 1, "Lift — pull", "w4", 1),
  block(2, 8, 0.5, "Scripture study", "w3", 0.5),
  block(2, 9, 2.5, "Companion build", "w1", 2.5),
  block(2, 13, 2, "Optimal — client work", "w1", 2),
  block(2, 16, 0.5, "Outreach calls", "w2", 0.5),
  block(2, 19.5, 2, "Temple", null, 2),

  // Thursday
  block(3, 6.75, 1, "Lift — legs", "w4", 1),
  block(3, 8, 0.5, "Scripture study", "w3", 0.5),
  block(3, 9, 3, "Companion build", "w1", 3),
  block(3, 13.5, 1.5, "Optimal — client work", "w1", 1.5),
  block(3, 18.5, 2, "Family evening", "w5", 2),

  // Friday — partially confirmed; today in most runs
  block(4, 6.75, 1, "Lift — push", "w4"),
  block(4, 8, 0.5, "Scripture study", "w3"),
  block(4, 9, 3, "Companion build", "w1"),
  block(4, 13, 1.5, "Optimal — client work", "w1"),
  block(4, 16, 0.5, "Outreach calls", "w2"),
  block(4, 18.5, 3, "Date night", "w5"),

  // Saturday
  block(5, 8, 0.5, "Scripture study", "w3"),
  block(5, 9.5, 2, "Yard + house", null),
  block(5, 14, 3, "Family time", "w5"),

  // Sunday
  block(6, 8, 0.5, "Scripture study", "w3"),
  block(6, 9, 3, "Church", null),
  block(6, 19, 1, "Weekly planning", null),
];
