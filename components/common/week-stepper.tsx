"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatWeekLabel, fromIsoDate, isSameWeek, shiftWeeks, toIsoDate } from "@/lib/week";

/**
 * ‹ week of Jul 13 – 19 · this week ›  (PRD §4.1)
 *
 * The selected week lives in the URL (`?w=YYYY-MM-DD`) rather than component
 * state, so the whole dashboard — a server component — re-renders for the
 * chosen week and the view is shareable and back-button-friendly.
 */
export function WeekStepper({ anchor }: { anchor: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = fromIsoDate(anchor);
  const isThisWeek = isSameWeek(current, new Date());

  function go(delta: number) {
    const next = new URLSearchParams(params);
    next.set("w", toIsoDate(shiftWeeks(current, delta)));
    router.push(`${pathname}?${next}`);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Previous week"
        onClick={() => go(-1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[190px] text-center text-xs text-muted-foreground">
        {formatWeekLabel(current)}
        {isThisWeek && " · this week"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Next week"
        onClick={() => go(1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
