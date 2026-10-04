import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { GoalIcon } from "@/components/common/goal-icon";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/format";
import type { CalendarBlock, IconKey, OpenWindow } from "@/lib/types";

/** "9:00 – 12:00" */
const span = (start: string, end: string) =>
  `${format(parseISO(start), "h:mm")} – ${format(parseISO(end), "h:mm a")}`;

/**
 * Left side of Plan Today (PRD §4.7): today's blocks, plus where the free time
 * actually is. Seeing the gaps is what turns intention into a scheduled day.
 */
export function ScheduleColumn({
  blocks,
  windows,
  goalIcons,
  now,
}: {
  blocks: CalendarBlock[];
  windows: OpenWindow[];
  goalIcons: Record<string, IconKey | null>;
  /** Passed in rather than read here — render must stay pure. */
  now: number;
}) {
  return (
    <Card className="gap-0 p-0 shadow-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Today&apos;s schedule</h2>
        <p className="text-xs text-muted-foreground">
          {blocks.length} block{blocks.length === 1 ? "" : "s"} ·{" "}
          {windows.length} open window{windows.length === 1 ? "" : "s"}
        </p>
      </div>

      <ul className="divide-y">
        {blocks.map((block) => {
          const past = parseISO(block.end).getTime() < now;
          return (
            <li
              key={block.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2",
                // See dates-view: `opacity-45` put this text at 1.96:1.
                // De-emphasise with colour, which stays legible.
                past && "text-muted-foreground",
              )}
            >
              <GoalIcon
                icon={block.goalId ? goalIcons[block.goalId] : null}
                className="text-muted-foreground"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {block.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {span(block.start, block.end)}
              </span>
            </li>
          );
        })}
        {blocks.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing scheduled yet today.
          </li>
        ) : null}
      </ul>

      <div className="border-t bg-muted/40 px-4 py-3">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Open windows
        </h3>
        {windows.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">The day is full.</p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {windows.map((w) => (
              <li
                key={w.start}
                className="rounded-md border bg-background px-2 py-1 text-xs tabular-nums"
              >
                {span(w.start, w.end)}
                <span className="ml-1.5 text-muted-foreground">
                  {formatMinutes(w.minutes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
