/**
 * DATA SEAM — Date planner (PRD §4.12).
 *
 * The hybrid: food is LIVE from Google Places and nothing about it persists;
 * activities are a curated table we own. Both are ranked with the same rule —
 * "try something new", enacted by sinking recently-done to the bottom.
 */
import { differenceInCalendarDays, parseISO } from "date-fns";
import type {
  Activity,
  DiceRoll,
  FoodPlace,
  HomeLocation,
  PriceTier,
} from "../types";
import {
  DEFAULT_ACTIVITY_RADIUS_MILES,
  DEFAULT_FOOD_RADIUS_MILES,
  withinRadius,
  type LatLng,
} from "../geo";
import { CUISINES, MOCK_ACTIVITIES, MOCK_FOOD } from "../mock/dates";
import { store } from "../mock/store";

export const CUISINE_OPTIONS = CUISINES;

/** Recently-done sinks; never-done rises. This IS the "try something new" rule. */
const NOVELTY_HORIZON_DAYS = 60;

function noveltyRank(lastDone: string | null): number {
  if (!lastDone) return 0; // never done — most novel
  const days = differenceInCalendarDays(new Date(), parseISO(lastDone));
  // Anything past the horizon is as good as new.
  return days >= NOVELTY_HORIZON_DAYS ? 0 : NOVELTY_HORIZON_DAYS - days;
}

export interface FoodFilters {
  cuisine?: string | null;
  maxPrice?: PriceTier | null;
  radiusMiles?: number;
  openNow?: boolean;
}

export interface ActivityFilters {
  category?: string | null;
  maxPrice?: PriceTier | null;
  radiusMiles?: number;
}

export async function getHomeLocation(): Promise<HomeLocation> {
  return { ...store.home };
}

/**
 * Stands in for a live Nearby Search. In Part C every filter here becomes a
 * query parameter and the results are never cached.
 */
export async function searchFood(
  anchor: LatLng,
  filters: FoodFilters = {},
): Promise<FoodPlace[]> {
  const radius = filters.radiusMiles ?? DEFAULT_FOOD_RADIUS_MILES;
  return withinRadius(anchor, MOCK_FOOD, radius)
    .filter((f) => !filters.cuisine || f.cuisine === filters.cuisine)
    .filter((f) => !filters.maxPrice || (f.priceTier ?? 1) <= filters.maxPrice)
    .filter((f) => !filters.openNow || f.openNow !== false)
    .sort(
      (a, b) =>
        noveltyRank(a.lastDone) - noveltyRank(b.lastDone) ||
        a.distanceMiles - b.distanceMiles,
    );
}

export async function searchActivities(
  anchor: LatLng,
  filters: ActivityFilters = {},
): Promise<Activity[]> {
  const radius = filters.radiusMiles ?? DEFAULT_ACTIVITY_RADIUS_MILES;
  return withinRadius(
    anchor,
    MOCK_ACTIVITIES.filter((a) => a.status === "active"),
    radius,
  )
    .filter((a) => !filters.category || a.category === filters.category)
    .filter((a) => !filters.maxPrice || a.priceTier <= filters.maxPrice)
    .sort(
      (a, b) =>
        noveltyRank(a.lastDone) - noveltyRank(b.lastDone) ||
        a.distanceMiles - b.distanceMiles,
    );
}

export async function getActivityCategories(): Promise<string[]> {
  return [...new Set(MOCK_ACTIVITIES.map((a) => a.category))].sort();
}

/**
 * Dice Roll (PRD §4.12): one stale cuisine, one stale activity.
 *
 * If the "stale" pool is empty the novelty filter is dropped for that roll
 * rather than erroring — an empty card is a worse answer than a repeat.
 * Never writes last_done; only a real date does that.
 */
export async function rollTheDice(
  anchor: LatLng,
  /** Ids from the previous roll, so "Re-roll" actually lands somewhere new. */
  exclude: { placeId?: string; activityId?: string } = {},
): Promise<DiceRoll> {
  const food = await searchFood(anchor, { radiusMiles: 25 });
  const activities = await searchActivities(anchor, { radiusMiles: 40 });

  return {
    food: pick(
      food.filter((f) => f.placeId !== exclude.placeId),
      (f) => f.lastDone,
    ),
    activity: pick(
      activities.filter((a) => a.id !== exclude.activityId),
      (a) => a.lastDone,
    ),
  };
}

/**
 * Prefer something genuinely novel; if the stale pool is empty, drop the
 * novelty filter for this roll rather than returning nothing (PRD §4.12).
 * Random within the pool so re-rolling explores instead of repeating.
 */
function pick<T>(pool: T[], lastDoneOf: (item: T) => string | null): T | null {
  if (pool.length === 0) return null;
  const stale = pool.filter((item) => noveltyRank(lastDoneOf(item)) === 0);
  const candidates = stale.length > 0 ? stale : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}
