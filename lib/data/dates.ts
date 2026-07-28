/**
 * DATA SEAM — Date planner (PRD §4.12).
 *
 * The hybrid: food is LIVE from Google Places and nothing about it persists;
 * activities are a curated table we own. Both are ranked with the same rule —
 * "try something new", enacted by sinking recently-done to the bottom.
 */
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Activity, DiceRoll, FoodPlace, HomeLocation, PriceTier } from "../types";
import { distanceMiles, type LatLng } from "../geo";
import { CUISINES, MOCK_ACTIVITIES, MOCK_FOOD, MOCK_HOME } from "../mock/dates";

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
  return MOCK_HOME;
}

/**
 * Stands in for a live Nearby Search. In Part C every filter here becomes a
 * query parameter and the results are never cached.
 */
export async function searchFood(
  anchor: LatLng,
  filters: FoodFilters = {},
): Promise<FoodPlace[]> {
  const radius = filters.radiusMiles ?? 15;
  return MOCK_FOOD.map((f) => ({
    ...f,
    distanceMiles: distanceMiles(anchor, { lat: f.lat, lng: f.lng }),
  }))
    .filter((f) => f.distanceMiles <= radius)
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
  const radius = filters.radiusMiles ?? 40;
  return MOCK_ACTIVITIES.filter((a) => a.status === "active")
    .map((a) => ({
      ...a,
      distanceMiles: distanceMiles(anchor, { lat: a.lat, lng: a.lng }),
    }))
    .filter((a) => a.distanceMiles <= radius)
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
export async function rollTheDice(anchor: LatLng): Promise<DiceRoll> {
  const food = await searchFood(anchor, { radiusMiles: 25 });
  const activities = await searchActivities(anchor, { radiusMiles: 40 });

  const staleFood = food.filter((f) => noveltyRank(f.lastDone) === 0);
  const staleActivities = activities.filter(
    (a) => noveltyRank(a.lastDone) === 0,
  );

  return {
    food: (staleFood.length ? staleFood : food)[0] ?? null,
    activity: (staleActivities.length ? staleActivities : activities)[0] ?? null,
  };
}
