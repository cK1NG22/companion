"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, Dice5, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DetailPopup,
  label,
  prettyCuisine,
  price,
  type Row,
} from "@/components/dates/detail-popup";
import { DiceCard } from "@/components/dates/dice-card";
import { getCurrentPosition } from "@/components/dates/current-position";
import { DEFAULT_RADIUS, ProximityBar } from "@/components/dates/proximity-bar";
import { cn } from "@/lib/utils";
import { lastDoneChip } from "@/lib/format";
import {
  DEFAULT_ACTIVITY_RADIUS_MILES,
  DEFAULT_FOOD_RADIUS_MILES,
  distanceMiles,
  type LatLng,
} from "@/lib/geo";
import {
  exploreNearAction,
  rollDiceAction,
  searchDatesAction,
} from "@/lib/actions/dates";
import type { Activity, DateMode, DiceRoll, FoodPlace } from "@/lib/types";

const FELL_BACK = "Showing results from Home.";
const STILL_LIVE = "Still showing results from your current location.";
const SEARCH_FAILED = "The search could not be completed.";

/** "superseded": a newer search started, so this one changed nothing. */
type SearchOutcome = "done" | "superseded" | { error: string };

/**
 * The Date planner (PRD §4.12). One toggled list, never two side by side.
 * Tapping a row opens a Maps-style detail popup; from there a single button
 * crosses over to the other type nearby. Pairing is always opt-in.
 */
export function DatesView({
  food,
  activities,
  cuisines,
  categories,
  home,
  mapsKey,
}: {
  food: FoodPlace[];
  activities: Activity[];
  cuisines: readonly string[];
  categories: string[];
  /** Where the default lists were centred. */
  home: LatLng;
  mapsKey?: string;
}) {
  const [mode, setMode] = useState<DateMode>("food");
  const [cuisine, setCuisine] = useState("any");
  const [category, setCategory] = useState("any");
  const [maxPrice, setMaxPrice] = useState("any");
  const [detail, setDetail] = useState<Row | null>(null);
  /** Set when the user crossed over from the other type — enables pairing. */
  const [anchorRow, setAnchorRow] = useState<Row | null>(null);
  const [dice, setDice] = useState<DiceRoll | null>(null);
  /** Results of the cross-over query, centred on the anchor — not on home. */
  const [exploreRows, setExploreRows] = useState<Row[] | null>(null);
  // Read the clock once per mount. Calling Date.now() during render would make
  // the component non-idempotent.
  const [now] = useState(() => Date.now());
  const [rolling, startRolling] = useTransition();
  /**
   * The device's position while "Current location" is the anchor; null means
   * Home. Held in memory only — never a URL, a cookie or storage, so it is
   * gone on reload (PRD §4.12 leaves storing it undecided).
   */
  const [liveCoords, setLiveCoords] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  /** A search from the proximity bar. Null: the lists the page loaded. */
  const [searched, setSearched] = useState<{
    food: FoodPlace[];
    activities: Activity[];
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  /** Only the newest search may land; a slow older one is dropped. */
  const latestSearch = useRef(0);

  const allFood: Row[] = useMemo(
    () =>
      (searched?.food ?? food).map((f) => ({ kind: "food" as const, ...f })),
    [searched, food],
  );
  const allActivities: Row[] = useMemo(
    () =>
      (searched?.activities ?? activities).map((a) => ({
        kind: "activity" as const,
        ...a,
      })),
    [searched, activities],
  );

  /** In Explore mode the list is the OTHER type, ranked from the anchor. */
  const rows = useMemo(() => {
    if (anchorRow) {
      // Must come from a query centred on the anchor. Re-sorting the
      // home-centred list would mean an activity an hour away could only ever
      // show restaurants near the house.
      return (exploreRows ?? []).map((r) => ({
        ...r,
        distanceMiles: distanceMiles(
          { lat: anchorRow.lat, lng: anchorRow.lng },
          { lat: r.lat, lng: r.lng },
        ),
      }));
    }

    const base = mode === "food" ? allFood : allActivities;
    return base.filter((r) => {
      if (maxPrice !== "any" && (r.priceTier ?? 1) > Number(maxPrice))
        return false;
      if (r.kind === "food" && cuisine !== "any" && r.cuisine !== cuisine)
        return false;
      if (
        r.kind === "activity" &&
        category !== "any" &&
        r.category !== category
      )
        return false;
      return true;
    });
  }, [
    anchorRow,
    exploreRows,
    mode,
    allFood,
    allActivities,
    cuisine,
    category,
    maxPrice,
  ]);

  /** Server-side so the real novelty filter runs, and so re-rolling differs. */
  function roll() {
    startRolling(async () => {
      const next = await rollDiceAction({
        ...(liveCoords ?? home),
        excludePlaceId: dice?.food?.placeId,
        excludeActivityId: dice?.activity?.id,
      });
      if (next) setDice(next);
    });
  }

  /**
   * Run the proximity search. `origin` null means Home, which the server
   * looks up itself. Never throws: a dropped request is a failure like any
   * other. The list on screen changes only on "done", so a caller commits its
   * anchor or radius only then — that keeps the bar matching the list.
   */
  async function search(
    origin: LatLng | null,
    radiusValue: string,
  ): Promise<SearchOutcome> {
    const id = ++latestSearch.current;
    if (!origin && radiusValue === DEFAULT_RADIUS) {
      setSearched(null);
      return "done";
    }
    let result: Awaited<ReturnType<typeof searchDatesAction>>;
    try {
      result = await searchDatesAction({
        ...(origin ? { anchor: "live", ...origin } : { anchor: "home" }),
        ...(radiusValue === DEFAULT_RADIUS
          ? {}
          : { radiusMiles: Number(radiusValue) }),
      });
    } catch {
      result = { ok: false, error: SEARCH_FAILED };
    }
    if (id !== latestSearch.current) return "superseded";
    if (!result.ok) return { error: result.error };
    setSearched({ food: result.food, activities: result.activities });
    return "done";
  }

  async function searchFromHome() {
    setLocationError(null);
    const outcome = await search(null, radius);
    if (outcome === "done") setLiveCoords(null);
    // The list is still the current-location one, so the anchor stays there.
    else if (outcome !== "superseded")
      setLocationError(`${outcome.error} ${STILL_LIVE}`);
  }

  /** Every failure ends the same way: say why, stay on Home. */
  async function searchFromCurrentLocation() {
    setLocationError(null);
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      if (!position.ok) {
        setLocationError(`${position.message} ${FELL_BACK}`);
        return;
      }
      const coords = { lat: position.lat, lng: position.lng };
      const outcome = await search(coords, radius);
      if (outcome === "done") setLiveCoords(coords);
      else if (outcome !== "superseded")
        setLocationError(`${outcome.error} ${FELL_BACK}`);
    } finally {
      // Whatever happened, the bar must not stay disabled.
      setLocating(false);
    }
  }

  async function chooseRadius(next: string) {
    const previous = radius;
    setRadius(next);
    setLocationError(null);
    const outcome = await search(liveCoords, next);
    if (outcome !== "done" && outcome !== "superseded") {
      // The list did not change, so neither may the radius shown.
      setRadius(previous);
      setLocationError(outcome.error);
    }
  }

  function explore(row: Row) {
    setAnchorRow(row);
    setExploreRows(null);
    startRolling(async () => {
      const result = await exploreNearAction({
        lat: row.lat,
        lng: row.lng,
        want: row.kind === "food" ? "activity" : "food",
      });
      if (!result) return;
      setExploreRows(
        "food" in result
          ? result.food.map((f) => ({ kind: "food" as const, ...f }))
          : result.activities.map((a) => ({ kind: "activity" as const, ...a })),
      );
    });
  }

  return (
    <div className="grid gap-4">
      {anchorRow ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAnchorRow(null);
              setExploreRows(null);
            }}
          >
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <p className="text-sm text-muted-foreground">
            {anchorRow.kind === "food" ? "Activities" : "Food"} near{" "}
            <span className="font-medium text-foreground">
              {anchorRow.name}
            </span>
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid w-full gap-2">
            <ProximityBar
              anchor={liveCoords ? "live" : "home"}
              radius={radius}
              defaultRadiusMiles={
                mode === "food"
                  ? DEFAULT_FOOD_RADIUS_MILES
                  : DEFAULT_ACTIVITY_RADIUS_MILES
              }
              locating={locating}
              error={locationError}
              onAnchorChange={(next) =>
                void (next === "live"
                  ? searchFromCurrentLocation()
                  : searchFromHome())
              }
              onRadiusChange={(next) => void chooseRadius(next)}
            />
          </div>
          <ToggleGroup
            value={[mode]}
            onValueChange={(v) => {
              const next = v[0];
              if (next) setMode(next as DateMode);
            }}
            variant="outline"
          >
            <ToggleGroupItem value="food">Food</ToggleGroupItem>
            <ToggleGroupItem value="activity">Activity</ToggleGroupItem>
          </ToggleGroup>

          {mode === "food" ? (
            <Select
              value={cuisine}
              onValueChange={(v) => setCuisine(v ?? "any")}
            >
              <SelectTrigger className="h-9 w-[170px]" aria-label="Cuisine">
                <SelectValue className="capitalize">
                  {(v) =>
                    v === "any" ? "Any cuisine" : prettyCuisine(String(v))
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any cuisine</SelectItem>
                {cuisines.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {prettyCuisine(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={category}
              onValueChange={(v) => setCategory(v ?? "any")}
            >
              <SelectTrigger className="h-9 w-[170px]" aria-label="Category">
                <SelectValue className="capitalize">
                  {(v) => (v === "any" ? "Any category" : String(v))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={maxPrice}
            onValueChange={(v) => setMaxPrice(v ?? "any")}
          >
            <SelectTrigger className="h-9 w-[120px]" aria-label="Max price">
              <SelectValue>
                {(v) => (v === "any" ? "Any price" : "$".repeat(Number(v)))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any price</SelectItem>
              <SelectItem value="1">$</SelectItem>
              <SelectItem value="2">$$</SelectItem>
              <SelectItem value="3">$$$</SelectItem>
              <SelectItem value="4">$$$$</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="ml-auto"
            disabled={rolling}
            onClick={() => roll()}
          >
            <Dice5 className="size-4" /> Dice roll
          </Button>
        </div>
      )}

      {dice ? (
        <DiceCard roll={dice} onClose={() => setDice(null)} onReroll={roll} />
      ) : null}

      <Card className="gap-0 p-0 shadow-card">
        <ul className="divide-y">
          {rows.map((row) => {
            const chip = lastDoneChip(row.lastDone, now);
            const recent =
              row.lastDone !== null &&
              now - new Date(row.lastDone).getTime() < 30 * 86_400_000;
            return (
              <li
                key={`${row.kind}-${"placeId" in row ? row.placeId : row.id}`}
              >
                <button
                  type="button"
                  onClick={() => setDetail(row)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted",
                    // Muted colour, not `opacity-55`. Opacity composites text
                    // toward the background: it dragged this row's name to
                    // 2.33:1, under WCAG AA. No opacity below ~0.9 can pass.
                    recent && "text-muted-foreground",
                  )}
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  {/* Spans, not div/p: a <button> may only hold phrasing
                      content (checked by e2e/html.spec.ts). */}
                  <span className="block min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {row.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground capitalize">
                      {label(row)} · {price(row.priceTier)}
                    </span>
                  </span>
                  {chip ? (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {chip}
                    </Badge>
                  ) : (
                    <Badge className="shrink-0 bg-good text-[10px] text-background">
                      new
                    </Badge>
                  )}
                  <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {row.distanceMiles.toFixed(1)} mi
                  </span>
                </button>
              </li>
            );
          })}
          {rows.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nothing matches those filters.
            </li>
          ) : null}
        </ul>
      </Card>

      <DetailPopup
        row={detail}
        anchorRow={anchorRow}
        mapsKey={mapsKey}
        onClose={() => setDetail(null)}
        onExplore={(row) => {
          explore(row);
          setDetail(null);
        }}
      />
    </div>
  );
}
