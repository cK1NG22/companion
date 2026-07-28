"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Dice5,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ResponsiveModal } from "@/components/common/responsive-modal";
import { cn } from "@/lib/utils";
import { appleMapsUrl, distanceMiles, mapsEmbedUrl } from "@/lib/geo";
import { scheduleDateAction } from "@/lib/actions/dates";
import type { Activity, DateMode, DiceRoll, FoodPlace } from "@/lib/types";

type Row =
  | ({ kind: "food" } & FoodPlace)
  | ({ kind: "activity" } & Activity);

const price = (tier: number | null) => (tier ? "$".repeat(tier) : "—");

const prettyCuisine = (c: string) =>
  c.replace(/_restaurant$/, "").replace(/_/g, " ");

const label = (row: Row) =>
  row.kind === "food" ? prettyCuisine(row.cuisine) : row.category;

/** Activities have no address field; food does. One place to resolve that. */
const addressOf = (row: Row) => (row.kind === "food" ? row.address : "");

const placeOf = (row: Row) => ({ name: row.name, address: addressOf(row) });

/** "3 days ago" chips, but terse. `now` is passed in so render stays pure. */
function lastDoneChip(lastDone: string | null, now: number): string | null {
  if (!lastDone) return null;
  const days = Math.round((now - new Date(lastDone).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

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
  mapsKey,
}: {
  food: FoodPlace[];
  activities: Activity[];
  cuisines: readonly string[];
  categories: string[];
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
  // Read the clock once per mount. Calling Date.now() during render would make
  // the component non-idempotent.
  const [now] = useState(() => Date.now());

  const allFood: Row[] = useMemo(
    () => food.map((f) => ({ kind: "food" as const, ...f })),
    [food],
  );
  const allActivities: Row[] = useMemo(
    () => activities.map((a) => ({ kind: "activity" as const, ...a })),
    [activities],
  );

  /** In Explore mode the list is the OTHER type, ranked from the anchor. */
  const rows = useMemo(() => {
    if (anchorRow) {
      const other = anchorRow.kind === "food" ? allActivities : allFood;
      return [...other]
        .map((r) => ({
          ...r,
          distanceMiles: distanceMiles(
            { lat: anchorRow.lat, lng: anchorRow.lng },
            { lat: r.lat, lng: r.lng },
          ),
        }))
        .sort((a, b) => a.distanceMiles - b.distanceMiles);
    }

    const base = mode === "food" ? allFood : allActivities;
    return base.filter((r) => {
      if (maxPrice !== "any" && (r.priceTier ?? 1) > Number(maxPrice)) return false;
      if (r.kind === "food" && cuisine !== "any" && r.cuisine !== cuisine) return false;
      if (r.kind === "activity" && category !== "any" && r.category !== category)
        return false;
      return true;
    });
  }, [anchorRow, mode, allFood, allActivities, cuisine, category, maxPrice]);

  return (
    <div className="grid gap-4">
      {anchorRow ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAnchorRow(null)}>
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <p className="text-sm text-muted-foreground">
            {anchorRow.kind === "food" ? "Activities" : "Food"} near{" "}
            <span className="font-medium text-foreground">{anchorRow.name}</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
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
            <Select value={cuisine} onValueChange={(v) => setCuisine(v ?? "any")}>
              <SelectTrigger className="h-9 w-[170px]" aria-label="Cuisine">
                <SelectValue className="capitalize">
                  {(v) => (v === "any" ? "Any cuisine" : prettyCuisine(String(v)))}
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
            <Select value={category} onValueChange={(v) => setCategory(v ?? "any")}>
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

          <Select value={maxPrice} onValueChange={(v) => setMaxPrice(v ?? "any")}>
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
            onClick={() => {
              const f = allFood.find((r) => !r.lastDone) ?? allFood[0] ?? null;
              const a =
                allActivities.find((r) => !r.lastDone) ?? allActivities[0] ?? null;
              setDice({
                food: f ? (f as FoodPlace) : null,
                activity: a ? (a as Activity) : null,
              });
            }}
          >
            <Dice5 className="size-4" /> Dice roll
          </Button>
        </div>
      )}

      {dice ? (
        <DiceCard
          roll={dice}
          onClose={() => setDice(null)}
          onReroll={() => setDice({ ...dice })}
        />
      ) : null}

      <Card className="gap-0 p-0 shadow-card">
        <ul className="divide-y">
          {rows.map((row) => {
            const chip = lastDoneChip(row.lastDone, now);
            const recent =
              row.lastDone !== null &&
              now - new Date(row.lastDone).getTime() < 30 * 86_400_000;
            return (
              <li key={`${row.kind}-${"placeId" in row ? row.placeId : row.id}`}>
                <button
                  type="button"
                  onClick={() => setDetail(row)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted",
                    recent && "opacity-55",
                  )}
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground capitalize">
                      {label(row)} · {price(row.priceTier)}
                    </p>
                  </div>
                  {chip ? (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {chip}
                    </Badge>
                  ) : (
                    <Badge className="shrink-0 bg-good text-[10px] text-white">
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
          setAnchorRow(row);
          setDetail(null);
        }}
      />
    </div>
  );
}

function DiceCard({
  roll,
  onClose,
  onReroll,
}: {
  roll: DiceRoll;
  onClose: () => void;
  onReroll: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const places = [roll.food, roll.activity].filter(Boolean) as {
    name: string;
    address?: string;
  }[];

  return (
    <Card className="gap-3 border-2 px-5 py-4 shadow-card">
      <div className="flex items-center gap-2">
        <Dice5 className="size-4 text-warm" />
        <h3 className="text-sm font-semibold">Try something new</h3>
      </div>
      <div className="grid gap-1 text-sm">
        <p>
          <span className="text-muted-foreground">Food · </span>
          {roll.food?.name ?? "nothing in range"}
        </p>
        <p>
          <span className="text-muted-foreground">Activity · </span>
          {roll.activity?.name ?? "nothing in range"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending || places.length === 0}
          onClick={() =>
            startTransition(async () => {
              const result = await scheduleDateAction({
                places: places.map((p) => ({
                  name: p.name,
                  address: p.address ?? "",
                })),
              });
              if (result.ok) toast.success(result.message);
              else toast.error(result.error);
            })
          }
        >
          Schedule both
        </Button>
        <Button size="sm" variant="outline" onClick={onReroll}>
          Re-roll
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
}

function DetailPopup({
  row,
  anchorRow,
  mapsKey,
  onClose,
  onExplore,
}: {
  row: Row | null;
  anchorRow: Row | null;
  mapsKey?: string;
  onClose: () => void;
  onExplore: (row: Row) => void;
}) {
  // Pairing is offered only when you arrived here by crossing over.
  const paired = anchorRow !== null && row !== null;
  const [includeAnchor, setIncludeAnchor] = useState(true);
  const [pending, startTransition] = useTransition();

  if (!row) {
    return (
      <ResponsiveModal open={false} onOpenChange={onClose} title="">
        <span />
      </ResponsiveModal>
    );
  }

  // Narrowed past the early return, so callbacks below don't need assertions.
  const current: Row = row;
  const embed = mapsEmbedUrl(`${row.name} ${addressOf(row)}`.trim(), mapsKey);
  const otherType = row.kind === "food" ? "activities" : "food";

  function schedule() {
    // Order follows selection: the place picked first leads the event name.
    const places =
      paired && includeAnchor && anchorRow
        ? [placeOf(anchorRow), placeOf(current)]
        : [placeOf(current)];

    startTransition(async () => {
      const result = await scheduleDateAction({ places });
      if (result.ok) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <ResponsiveModal
      open
      onOpenChange={(o) => !o && onClose()}
      title={row.name}
      description={`${label(row)} · ${price(row.priceTier)}`}
    >
      <div className="grid gap-3">
        {embed ? (
          <iframe
            title={`Map of ${row.name}`}
            src={embed}
            loading="lazy"
            className="h-40 w-full rounded-lg border"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="grid h-24 place-items-center rounded-lg border bg-muted text-xs text-muted-foreground">
            Map appears once a Google Maps embed key is configured.
          </div>
        )}

        <div className="grid gap-1 text-sm">
          {"rating" in row && row.rating ? (
            <p className="flex items-center gap-1.5">
              <Star className="size-3.5 text-warm" />
              <span className="tabular-nums">{row.rating}</span>
            </p>
          ) : null}
          {"address" in row && row.address ? (
            <p className="text-muted-foreground">{row.address}</p>
          ) : null}
          {"priceNote" in row && row.priceNote ? (
            <p className="text-muted-foreground">{row.priceNote}</p>
          ) : null}
          {"notes" in row && row.notes ? <p>{row.notes}</p> : null}
          {"phone" in row && row.phone ? (
            <a
              href={`tel:${row.phone}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:underline"
            >
              <Phone className="size-3.5" /> {row.phone}
            </a>
          ) : null}
          {"website" in row && row.website ? (
            <a
              href={row.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:underline"
            >
              <Globe className="size-3.5" /> Website
            </a>
          ) : null}
          {"bookingUrl" in row && row.bookingUrl ? (
            <a
              href={row.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:underline"
            >
              <Globe className="size-3.5" /> Book
            </a>
          ) : null}
        </div>

        {paired && anchorRow ? (
          <label className="flex items-start gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5">
            <Checkbox
              checked={includeAnchor}
              onCheckedChange={(v) => setIncludeAnchor(v === true)}
              aria-label={`Include ${anchorRow.name}`}
              className="mt-0.5"
            />
            <span className="text-sm">
              Include {anchorRow.name}?
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {includeAnchor
                  ? `Event: “${anchorRow.name} + ${row.name}”`
                  : `Event: “${row.name}”`}
              </span>
            </span>
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={schedule} disabled={pending} className="flex-1">
            Schedule
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a
                href={appleMapsUrl(row.name, { lat: row.lat, lng: row.lng })}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            Directions <ExternalLink className="size-3.5" />
          </Button>
        </div>

        <Button variant="secondary" onClick={() => onExplore(row)}>
          Explore {otherType} near {row.name} →
        </Button>
      </div>
    </ResponsiveModal>
  );
}
