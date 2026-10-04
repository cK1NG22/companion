/**
 * DATA SEAM — Goals funnel (PRD §4.2): Goals (year) → Plans (month) → Inputs (week).
 */
import type { Goal, GoalTier, IconKey, KeyIndicatorUnit } from "../types";
import { nextId, store } from "../mock/store";

const goals = store.goals;

export interface Funnel {
  year: Goal[];
  month: Goal[];
  week: Goal[];
  /** id → title, so a child can render its "↑ parent" chip without a second query. */
  parentTitles: Record<string, string>;
}

export async function getFunnel(): Promise<Funnel> {
  const byTier = (tier: GoalTier) =>
    goals.filter((g) => g.tier === tier).sort((a, b) => a.sortOrder - b.sortOrder);
  const parentTitles = Object.fromEntries(goals.map((g) => [g.id, g.title]));
  return {
    year: byTier("year"),
    month: byTier("month"),
    week: byTier("week"),
    parentTitles,
  };
}

export interface NewGoalInput {
  title: string;
  tier: GoalTier;
  parentId?: string | null;
  icon?: IconKey | null;
  target?: number | null;
  unit?: KeyIndicatorUnit | null;
}

export async function createGoal(input: NewGoalInput): Promise<Goal> {
  const siblings = goals.filter((g) => g.tier === input.tier);
  const goal: Goal = {
    id: nextId("g"),
    title: input.title,
    tier: input.tier,
    parentId: input.parentId ?? null,
    icon: input.icon ?? null,
    note: null,
    // Yearly goals carry letter badges (A/B/C/D) used as ladder targets.
    badge:
      input.tier === "year"
        ? String.fromCharCode(65 + siblings.length)
        : null,
    target: input.target ?? null,
    unit: input.unit ?? (input.tier === "week" ? "hours" : null),
    sortOrder: siblings.length,
  };
  goals.push(goal);
  return goal;
}

export async function updateGoal(
  id: string,
  patch: Partial<Pick<Goal, "title" | "icon" | "note" | "parentId" | "target" | "unit">>,
): Promise<void> {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;
  Object.assign(goal, patch);
}
