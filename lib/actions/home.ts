"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toggleHabit } from "@/lib/data/home";

const ToggleSchema = z.object({
  habitId: z.string().min(1),
  // 0 = Monday … 6 = Sunday
  dayIndex: z.number().int().min(0).max(6),
  // Monday of the week being viewed. The grid is week-addressed via `?w=`,
  // so without this every week would share one set of checkmarks.
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});

export async function toggleHabitAction(input: unknown): Promise<void> {
  const parsed = ToggleSchema.safeParse(input);
  if (!parsed.success) return;
  const { habitId, dayIndex, weekStart } = parsed.data;
  await toggleHabit(habitId, dayIndex, weekStart);
  revalidatePath("/");
}
