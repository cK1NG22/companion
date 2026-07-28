"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoalIcon } from "@/components/common/goal-icon";
import { ResponsiveModal } from "@/components/common/responsive-modal";
import { TriStateBar } from "@/components/common/tri-state-bar";
import type { Allocation, KeyIndicator } from "@/lib/types";

/** "13.5h" / "4" — hours carry a unit suffix, counts are bare numbers. */
function fmt(value: number, unit: KeyIndicator["unit"]) {
  const n = Number.isInteger(value) ? value : value.toFixed(1);
  return unit === "hours" ? `${n}h` : `${n}`;
}

/**
 * "This week at a glance" (PRD §4.1). These tiles ARE the weekly Inputs from
 * the Goals funnel. Deliberately no captions and no colour legend.
 */
export function KeyIndicatorTiles({
  indicators,
  allocations,
}: {
  indicators: KeyIndicator[];
  allocations: Record<string, Allocation>;
}) {
  const [openGoalId, setOpenGoalId] = useState<string | null>(null);
  const active = openGoalId ? allocations[openGoalId] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {indicators.map((ki) => (
          // Card is a plain div, so the button wraps it rather than composing
          // into it — that keeps native focus and keyboard activation.
          <button
            key={ki.goalId}
            type="button"
            onClick={() => setOpenGoalId(ki.goalId)}
            aria-label={`${ki.title}: ${fmt(ki.done, ki.unit)} done of ${fmt(ki.target, ki.unit)}. Open breakdown.`}
            className="rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Card className="h-full gap-0 px-3.5 py-3.5 shadow-card transition-colors hover:bg-muted">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <GoalIcon icon={ki.icon} className="size-3.5" />
                <span className="truncate text-[11px] font-medium tracking-wide uppercase">
                  {ki.title}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl font-semibold tabular-nums">
                  {fmt(ki.done, ki.unit)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  / {fmt(ki.target, ki.unit)}
                </span>
              </div>
              <TriStateBar
                planned={ki.planned}
                done={ki.done}
                target={ki.target}
                behind={ki.behind}
              />
            </Card>
          </button>
        ))}
      </div>

      <ResponsiveModal
        open={active !== null}
        onOpenChange={(o) => !o && setOpenGoalId(null)}
        title={active?.title ?? ""}
        description={
          active
            ? active.unit === "hours"
              ? "Where the time is going this week"
              : "What counted this week"
            : undefined
        }
      >
        {active ? <AllocationBody allocation={active} /> : null}
      </ResponsiveModal>
    </>
  );
}

/**
 * `hours` → blocks grouped by name (projects emerge from what's scheduled).
 * `count` → the individual items, labelled by where they came from.
 */
function AllocationBody({ allocation }: { allocation: Allocation }) {
  const { unit, rows, target, totalPlanned, totalDone } = allocation;

  return (
    <div className="grid gap-3">
      <TriStateBar
        planned={totalPlanned}
        done={totalDone}
        target={target}
        className="h-1.5"
      />

      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nothing scheduled toward this yet.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((row, i) => (
            <li
              key={`${row.label}-${i}`}
              className="flex items-center gap-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm">
                {row.label}
              </span>
              {row.origin === "todo" ? (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  to-do
                </Badge>
              ) : null}
              {row.date ? (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {format(parseISO(row.date), "EEE")}
                </span>
              ) : null}
              <span className="shrink-0 text-sm tabular-nums">
                {unit === "hours" ? (
                  <>
                    <span className="font-medium">{row.done}h</span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {row.planned}h
                    </span>
                  </>
                ) : row.done ? (
                  <span className="font-medium">done</span>
                ) : (
                  <span className="text-muted-foreground">planned</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t pt-2 text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="tabular-nums">
          <span className="font-semibold">
            {unit === "hours" ? `${totalDone}h` : totalDone}
          </span>
          <span className="text-muted-foreground">
            {" "}
            / {unit === "hours" ? `${target}h` : target}
          </span>
        </span>
      </div>
    </div>
  );
}
