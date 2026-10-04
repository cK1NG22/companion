"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createGoal, updateGoal } from "@/lib/data/goals";
import { ICON_KEYS } from "@/lib/types";

const IconEnum = z.enum(ICON_KEYS);

const NewGoalSchema = z.object({
  title: z.string().trim().min(1, "Give it a title.").max(160),
  tier: z.enum(["year", "month", "week"]),
  parentId: z.string().nullable().optional(),
  // Weekly Inputs carry a number + unit; Goals and Plans do not.
  target: z.number().positive().max(1000).nullable().optional(),
  unit: z.enum(["hours", "count"]).nullable().optional(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createGoalAction(input: unknown): Promise<ActionResult> {
  const parsed = NewGoalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid goal.",
    };
  }
  await createGoal(parsed.data);
  revalidatePath("/goals");
  revalidatePath("/");
  return { ok: true };
}

const UpdateGoalSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(160).optional(),
  icon: IconEnum.nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
  parentId: z.string().nullable().optional(),
  target: z.number().positive().max(1000).nullable().optional(),
});

export async function updateGoalAction(input: unknown): Promise<ActionResult> {
  const parsed = UpdateGoalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid change.",
    };
  }
  const { id, ...patch } = parsed.data;
  await updateGoal(id, patch);
  revalidatePath("/goals");
  revalidatePath("/");
  return { ok: true };
}
