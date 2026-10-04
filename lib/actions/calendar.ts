"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createBlock, deleteBlock, updateBlock } from "@/lib/data/calendar";

export type BlockResult = { ok: true } | { ok: false; error: string };

/** Local-naive ISO, e.g. "2026-07-27T09:00:00". Never UTC — see lib/data/calendar.ts. */
const LocalIso = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
    "Expected a local timestamp",
  );

const NewBlockSchema = z
  .object({
    name: z.string().trim().min(1, "Name the block.").max(200),
    start: LocalIso,
    end: LocalIso,
    goalId: z.string().nullable(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((b) => b.end > b.start, {
    message: "The block has to end after it starts.",
    path: ["end"],
  });

export async function createBlockAction(input: unknown): Promise<BlockResult> {
  const parsed = NewBlockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid block.",
    };
  }
  await createBlock(parsed.data);
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

const UpdateBlockSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(200).optional(),
    start: LocalIso.optional(),
    end: LocalIso.optional(),
    goalId: z.string().nullable().optional(),
    // Written by the Nightly Review's "Confirm & log hours".
    confirmedMinutes: z.number().int().min(0).max(1440).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((b) => !b.start || !b.end || b.end > b.start, {
    message: "The block has to end after it starts.",
    path: ["end"],
  });

export async function updateBlockAction(input: unknown): Promise<BlockResult> {
  const parsed = UpdateBlockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid change.",
    };
  }
  const { id, ...patch } = parsed.data;
  await updateBlock(id, patch);
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBlockAction(id: string): Promise<void> {
  if (!id) return;
  await deleteBlock(id);
  revalidatePath("/calendar");
  revalidatePath("/");
}
