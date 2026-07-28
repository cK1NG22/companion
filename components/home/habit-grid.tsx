"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DAY_LABELS, dayIndex as todayIndex } from "@/lib/week";
import { toggleHabitAction } from "@/lib/actions/home";
import type { HabitGroup, HabitRow } from "@/lib/types";

const GROUP_LABELS: Record<HabitGroup, string> = {
  required: "Required",
  standards: "Standards of Excellence",
  weekly: "Weekly",
};

const GROUP_ORDER: HabitGroup[] = ["required", "standards", "weekly"];

/**
 * The weekly habit grid (PRD §4.1). Columns are Mon–Sun, Monday first.
 *
 * Habits are the yes/no half of the split: tiles are things with a number,
 * the grid is things that either happened or didn't.
 */
export function HabitGrid({
  rows,
  weekStart,
  isCurrentWeek,
}: {
  rows: HabitRow[];
  /** Monday of the week shown, so toggles land on the right week. */
  weekStart: string;
  isCurrentWeek: boolean;
}) {
  const [, startTransition] = useTransition();
  const [optimisticRows, applyToggle] = useOptimistic(
    rows,
    (state: HabitRow[], toggled: { habitId: string; day: number }) =>
      state.map((row) =>
        row.habit.id === toggled.habitId
          ? {
              ...row,
              days: row.days.map((v, i) => (i === toggled.day ? !v : v)),
            }
          : row,
      ),
  );

  // Only highlight "today" when we're actually looking at the current week.
  const today = isCurrentWeek ? todayIndex(new Date()) : -1;

  function toggle(habitId: string, day: number) {
    startTransition(async () => {
      applyToggle({ habitId, day });
      await toggleHabitAction({ habitId, dayIndex: day, weekStart });
    });
  }

  return (
    <Card className="gap-0 overflow-x-auto p-0 shadow-card">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-[45%] px-4 py-2.5 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Habit
            </th>
            {DAY_LABELS.map((label, i) => (
              <th
                key={label}
                scope="col"
                className={cn(
                  "px-1 py-2.5 text-center text-[11px] font-medium text-muted-foreground",
                  i === today && "text-warm",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GROUP_ORDER.map((group) => {
            const groupRows = optimisticRows.filter(
              (r) => r.habit.group === group,
            );
            if (groupRows.length === 0) return null;
            return (
              <GroupSection
                key={group}
                label={GROUP_LABELS[group]}
                rows={groupRows}
                today={today}
                onToggle={toggle}
              />
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function GroupSection({
  label,
  rows,
  today,
  onToggle,
}: {
  label: string;
  rows: HabitRow[];
  today: number;
  onToggle: (habitId: string, day: number) => void;
}) {
  return (
    <>
      <tr>
        <th
          colSpan={8}
          scope="colgroup"
          className="border-t bg-muted/60 px-4 py-1.5 text-left text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
        >
          {label}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.habit.id} className="border-t">
          <th
            scope="row"
            className="truncate px-4 py-1.5 text-left text-sm font-normal"
          >
            {row.habit.name}
          </th>
          {row.days.map((checked, i) => (
            <td key={i} className="px-1 py-1.5 text-center">
              <button
                type="button"
                onClick={() => onToggle(row.habit.id, i)}
                aria-pressed={checked}
                aria-label={`${row.habit.name}, ${DAY_LABELS[i]}`}
                className={cn(
                  "mx-auto grid size-5 place-items-center rounded-[5px] border transition-colors",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40 hover:bg-muted",
                  i === today && !checked && "border-warm/50",
                )}
              >
                {checked ? <Check className="size-3" strokeWidth={3} /> : null}
              </button>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
