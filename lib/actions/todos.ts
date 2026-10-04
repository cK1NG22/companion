"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addTodo,
  deleteTodo,
  scheduleTodo,
  toggleTodo,
  type NewTodoInput,
} from "@/lib/data/todos";

export type TodoResult =
  { ok: true; message?: string } | { ok: false; error: string };

const NewTodoSchema = z.object({
  name: z.string().trim().min(1, "Name the to-do.").max(200),
  notes: z.string().trim().max(1000).nullable().optional(),
  // 5 minutes to a full day — anything outside that is a typo, not an intent.
  durationMinutes: z.number().int().min(5).max(1440).nullable().optional(),
  goalId: z.string().nullable().optional(),
}) satisfies z.ZodType<NewTodoInput>;

// `satisfies` above is one-way: a field added to NewTodoInput but not to the
// schema still compiles, and the action would silently drop it. This fails the
// typecheck unless the two have the same keys and are assignable both ways.
// Type-only, and not exported — a "use server" file may export only async
// functions.
type Exact<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? [keyof A] extends [keyof B]
      ? [keyof B] extends [keyof A]
        ? true
        : false
      : false
    : false
  : false;
type Assert<T extends true> = T;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _NewTodoSchemaMatchesInput = Assert<
  Exact<z.infer<typeof NewTodoSchema>, NewTodoInput>
>;

export async function addTodoAction(input: unknown): Promise<TodoResult> {
  const parsed = NewTodoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid to-do.",
    };
  }
  await addTodo(parsed.data);
  revalidatePath("/goals");
  return { ok: true };
}

export async function toggleTodoAction(id: string): Promise<void> {
  if (!id) return;
  await toggleTodo(id);
  // A checked-off to-do increments a `count` key indicator, so Home changes too.
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteTodoAction(id: string): Promise<void> {
  if (!id) return;
  await deleteTodo(id);
  revalidatePath("/goals");
  revalidatePath("/");
}

/** "Schedule" drops the to-do into the first open window that fits today. */
export async function scheduleTodoAction(id: string): Promise<TodoResult> {
  if (!id) return { ok: false, error: "Unknown to-do." };
  const result = await scheduleTodo(id, new Date());
  if (!result) {
    return { ok: false, error: "No open window today long enough for this." };
  }
  revalidatePath("/goals");
  revalidatePath("/calendar");
  // Plan Today is where this is most often clicked. Without revalidating it,
  // the row keeps its stale "not scheduled" prop and a second click would
  // create a duplicate block for the same to-do.
  revalidatePath("/plan-today");
  revalidatePath("/");
  return { ok: true, message: "Added to today's calendar." };
}
