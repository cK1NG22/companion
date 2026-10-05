"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RADIUS_OPTIONS_MILES } from "@/lib/geo";

/** The radius control's "not chosen" value: each list keeps its own default. */
export const DEFAULT_RADIUS = "default";

export type Anchor = "home" | "live";

/**
 * The proximity bar (PRD §4.12): where to search from, and how far.
 * Two anchors only — typing in a place is undecided, so it is not here.
 */
export function ProximityBar({
  anchor,
  radius,
  defaultRadiusMiles,
  locating,
  error,
  onAnchorChange,
  onRadiusChange,
}: {
  anchor: Anchor;
  /** DEFAULT_RADIUS, or a number of miles as a string. */
  radius: string;
  /** What the list on screen uses when no radius is chosen. */
  defaultRadiusMiles: number;
  locating: boolean;
  error: string | null;
  onAnchorChange: (next: Anchor) => void;
  onRadiusChange: (next: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          aria-label="Search from"
          value={[anchor]}
          onValueChange={(v) => {
            const next = v[0];
            if (next === "home" || next === "live") onAnchorChange(next);
          }}
          disabled={locating}
          variant="outline"
        >
          <ToggleGroupItem value="home">Home</ToggleGroupItem>
          <ToggleGroupItem value="live">Current location</ToggleGroupItem>
        </ToggleGroup>

        <Select
          value={radius}
          onValueChange={(v) => onRadiusChange(v ?? DEFAULT_RADIUS)}
          disabled={locating}
        >
          <SelectTrigger className="h-9 w-[170px]" aria-label="Radius">
            <SelectValue>
              {(v) =>
                v === DEFAULT_RADIUS
                  ? `Default (${defaultRadiusMiles} mi)`
                  : `Within ${String(v)} mi`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_RADIUS}>Default radius</SelectItem>
            {RADIUS_OPTIONS_MILES.map((miles) => (
              <SelectItem key={miles} value={String(miles)}>
                Within {miles} mi
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {locating ? (
          <p role="status" className="text-sm text-muted-foreground">
            Finding your location…
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </>
  );
}
