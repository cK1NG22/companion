/**
 * DATA SEAM — to-dos (PRD §4.2).
 *
 * A to-do's duration drives the length of the calendar event when scheduled.
 * A checked-off to-do also increments a `count` key indicator — the one
 * sanctioned exception to "the calendar is the only input surface" (PRD §4.1a).
 */
import type { Todo } from "../types";
import type { TodoCountItem } from "../rollup";
import { nextId, store } from "../mock/store";
import {
  createBlock,
  endFor,
  firstWindowFitting,
  toLocalIso,
} from "./calendar";

const todos = store.todos;

export async function getTodos(): Promise<Todo[]> {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}

/**
 * The `count` contributions that come from to-dos rather than the calendar.
 *
 * DERIVED, never stored separately — a duplicate list would drift the moment
 * anything was checked or unchecked. Dated by completion, so the contribution
 * lands in the week the act happened.
 */
export function getCountContributions(): TodoCountItem[] {
  return todos
    .filter((t) => t.done && t.goalId !== null && t.completedAt !== null)
    .map((t) => ({
      goalId: t.goalId as string,
      label: t.name,
      date: (t.completedAt as string).slice(0, 10),
    }));
}

export interface NewTodoInput {
  name: string;
  notes?: string | null;
  durationMinutes?: number | null;
  goalId?: string | null;
}

export async function addTodo(input: NewTodoInput): Promise<Todo> {
  const todo: Todo = {
    id: nextId("t"),
    name: input.name,
    notes: input.notes ?? null,
    durationMinutes: input.durationMinutes ?? null,
    goalId: input.goalId ?? null,
    done: false,
    scheduledBlockId: null,
    createdAt: toLocalIso(new Date()),
    completedAt: null,
  };
  todos.push(todo);
  return todo;
}

export async function toggleTodo(id: string): Promise<void> {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  // Stamp on completion, clear on un-completion, so the count rollup can date it.
  todo.completedAt = todo.done ? toLocalIso(new Date()) : null;
}

export async function deleteTodo(id: string): Promise<void> {
  const i = todos.findIndex((t) => t.id === id);
  if (i >= 0) todos.splice(i, 1);
}

/**
 * Drop the to-do into the first open window on `day` that fits its duration.
 * Returns null when the day has no gap big enough — the caller surfaces that
 * rather than silently double-booking.
 */
export async function scheduleTodo(
  id: string,
  day: Date,
): Promise<{ blockId: string } | null> {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return null;

  const duration = todo.durationMinutes ?? 30;
  const window = await firstWindowFitting(day, duration);
  if (!window) return null;

  const block = await createBlock({
    name: todo.name,
    start: window.start,
    end: endFor(window.start, duration),
    goalId: todo.goalId,
    notes: todo.notes,
  });
  todo.scheduledBlockId = block.id;
  return { blockId: block.id };
}
