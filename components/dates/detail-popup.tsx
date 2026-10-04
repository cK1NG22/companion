"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Globe, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveModal } from "@/components/common/responsive-modal";
import { appleMapsUrl, mapsEmbedUrl } from "@/lib/geo";
import { scheduleDateAction } from "@/lib/actions/dates";
import type { Activity, FoodPlace } from "@/lib/types";

export type Row =
  ({ kind: "food" } & FoodPlace) | ({ kind: "activity" } & Activity);

export const price = (tier: number | null) => (tier ? "$".repeat(tier) : "—");

export const prettyCuisine = (c: string) =>
  c.replace(/_restaurant$/, "").replace(/_/g, " ");

export const label = (row: Row) =>
  row.kind === "food" ? prettyCuisine(row.cuisine) : row.category;

/** Activities have no address field; food does. One place to resolve that. */
const addressOf = (row: Row) => (row.kind === "food" ? row.address : "");

const placeOf = (row: Row) => ({ name: row.name, address: addressOf(row) });

export function DetailPopup({
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
