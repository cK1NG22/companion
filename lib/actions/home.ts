"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toggleHabit } from "@/lib/data/home";

const ToggleSchema = z.object({
  habitId: z.string().min(1),
  // 0 = Monday … 6 = Sunday
  dayIndex: z.number().int().min(0).max(6),
});

export async function toggleHabitAction(input: unknown): Promise<void> {
  const parsed = ToggleSchema.safeParse(input);
  if (!parsed.success) return;
  await toggleHabit(parsed.data.habitId, parsed.data.dayIndex);
  revalidatePath("/");
}
