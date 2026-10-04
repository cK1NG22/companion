"use client";

import { useTransition } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { scheduleTodoAction } from "@/lib/actions/todos";
import type { Todo } from "@/lib/types";

/**
 * Right side of Plan Today (PRD §4.7): the Top 3 carried from last night's
 * Nightly Review, then the to-do list. The Top 3 lives HERE, not in Morning
 * Review — reflection and logistics are deliberately separate (PRD §1.2).
 */
export function ToScheduleColumn({
  topThree,
  todos,
}: {
  topThree: string[];
  todos: Todo[];
}) {
  return (
    <div className="grid gap-4">
      <Card className="gap-0 p-0 shadow-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Top 3 for today</h2>
          <p className="text-xs text-muted-foreground">
            Decided last night, acted on this morning
          </p>
        </div>
        <ol className="divide-y">
          {topThree.map((item, i) => (
            <li key={item} className="flex items-center gap-3 px-4 py-2.5">
              <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm">{item}</span>
            </li>
          ))}
          {topThree.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No Top 3 yet — it gets set in tonight&apos;s Nightly Review.
            </li>
          ) : null}
        </ol>
      </Card>

      <Card className="gap-0 p-0 shadow-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">To schedule</h2>
          <p className="text-xs text-muted-foreground">
            Drops into the first open window that fits
          </p>
        </div>
        <ul className="divide-y">
          {todos.map((todo) => (
            <ScheduleRow key={todo.id} todo={todo} />
          ))}
          {todos.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing left to schedule.
            </li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}

function ScheduleRow({ todo }: { todo: Todo }) {
  const [pending, startTransition] = useTransition();
  const scheduled = todo.scheduledBlockId !== null;

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{todo.name}</p>
        {todo.notes ? (
          <p className="truncate text-xs text-muted-foreground">{todo.notes}</p>
        ) : null}
      </div>
      {todo.durationMinutes ? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {todo.durationMinutes} min
        </span>
      ) : null}
      <Button
        size="sm"
        variant={scheduled ? "ghost" : "outline"}
        disabled={pending || scheduled}
        onClick={() =>
          startTransition(async () => {
            const result = await scheduleTodoAction(todo.id);
            if (result.ok) toast.success(result.message ?? "Scheduled.");
            else toast.error(result.error);
          })
        }
      >
        {scheduled ? (
          <>
            <Check className={cn("size-3.5 text-good")} /> On cal
          </>
        ) : (
          <>
            <CalendarPlus className="size-3.5" /> Add
          </>
        )}
      </Button>
    </li>
  );
}
