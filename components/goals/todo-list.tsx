"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CalendarPlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import {
  addTodoAction,
  deleteTodoAction,
  scheduleTodoAction,
  toggleTodoAction,
} from "@/lib/actions/todos";
import type { Todo } from "@/lib/types";

export function TodoList({ todos }: { todos: Todo[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, applyToggle] = useOptimistic(
    todos,
    (state: Todo[], id: string) =>
      state.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  );

  function toggle(id: string) {
    startTransition(async () => {
      applyToggle(id);
      await toggleTodoAction(id);
    });
  }

  return (
    <Card className="gap-0 p-0 shadow-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">To-do</h3>
        <p className="text-xs text-muted-foreground">
          A duration makes it schedulable.
        </p>
      </div>

      <ul className="divide-y">
        {optimistic.map((todo) => (
          <TodoRow key={todo.id} todo={todo} onToggle={toggle} />
        ))}
        {optimistic.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing on the list.
          </li>
        ) : null}
      </ul>

      <AddTodoForm />
    </Card>
  );
}

function TodoRow({
  todo,
  onToggle,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function schedule() {
    startTransition(async () => {
      const result = await scheduleTodoAction(todo.id);
      if (result.ok) toast.success(result.message ?? "Scheduled.");
      else toast.error(result.error);
    });
  }

  return (
    <li className="group flex items-start gap-3 px-4 py-2.5">
      <Checkbox
        checked={todo.done}
        onCheckedChange={() => onToggle(todo.id)}
        aria-label={todo.name}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            todo.done && "text-muted-foreground line-through",
          )}
        >
          {todo.name}
        </p>
        {todo.notes ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{todo.notes}</p>
        ) : null}
      </div>

      {todo.durationMinutes ? (
        <span className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
          {formatDuration(todo.durationMinutes)}
        </span>
      ) : null}

      {!todo.done ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          aria-label={`Schedule ${todo.name}`}
          disabled={pending || todo.scheduledBlockId !== null}
          onClick={schedule}
        >
          <CalendarPlus
            className={cn(
              "size-4",
              todo.scheduledBlockId !== null && "text-good",
            )}
          />
        </Button>
      ) : null}

      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Delete ${todo.name}`}
        onClick={() => startTransition(() => deleteTodoAction(todo.id))}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}

function AddTodoForm() {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await addTodoAction({
        name,
        notes: notes.trim() || null,
        durationMinutes: duration ? Number(duration) : null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
      setNotes("");
      setDuration("");
    });
  }

  return (
    <div className="grid gap-2 border-t bg-muted/40 px-4 py-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="New to-do…"
        className="h-8 text-sm"
      />
      <div className="flex gap-2">
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Notes (optional)"
          className="h-8 text-sm"
        />
        <Input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          inputMode="numeric"
          placeholder="min"
          aria-label="Duration in minutes"
          className="h-8 w-20 text-sm"
        />
        <Button
          size="icon"
          className="size-8 shrink-0"
          aria-label="Add to-do"
          disabled={pending || !name.trim()}
          onClick={add}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
