"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteSet, logSet } from "@/lib/data/gym";

const SetSchema = z.object({
  exerciseId: z.string().min(1),
  // Plate-loaded lifts top out well under 1500 lb; anything past that is a typo.
  weight: z.number().positive().max(1500),
  reps: z.number().int().positive().max(100),
});

export type GymResult = { ok: true } | { ok: false; error: string };

export async function logSetAction(input: unknown): Promise<GymResult> {
  const parsed = SetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a weight and rep count." };
  }
  await logSet(parsed.data);
  revalidatePath("/gym");
  return { ok: true };
}

export async function deleteSetAction(id: string): Promise<void> {
  if (!id) return;
  await deleteSet(id);
  revalidatePath("/gym");
}
