"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addMorningSection,
  deleteMorningSection,
  markMorningDone,
  reorderMorningSections,
  saveNightlyEntry,
  updateMorningSection,
} from "@/lib/data/rhythm";
import { updateBlock } from "@/lib/data/calendar";
import { toIsoDate } from "@/lib/week";

// ---------------------------------------------------------------------------
// Morning Review — a reading, editable with Google-Forms mechanics
// ---------------------------------------------------------------------------

export async function reorderMorningSectionsAction(ids: string[]): Promise<void> {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) return;
  await reorderMorningSections(ids);
  revalidatePath("/morning");
}

const SectionPatch = z.object({
  id: z.string().min(1),
  title: z.string().trim().max(120).optional(),
  body: z.string().max(4000).optional(),
});

export async function updateMorningSectionAction(input: unknown): Promise<void> {
  const parsed = SectionPatch.safeParse(input);
  if (!parsed.success) return;
  const { id, ...patch } = parsed.data;
  await updateMorningSection(id, patch);
  revalidatePath("/morning");
}

export async function addMorningSectionAction(): Promise<void> {
  await addMorningSection();
  revalidatePath("/morning");
}

export async function deleteMorningSectionAction(id: string): Promise<void> {
  if (!id) return;
  await deleteMorningSection(id);
  revalidatePath("/morning");
}

export async function markMorningDoneAction(): Promise<void> {
  await markMorningDone();
  // The tab hides once done and returns tomorrow, so the shell re-renders too.
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Nightly Review — question order is LOCKED (PRD §4.9)
// ---------------------------------------------------------------------------

const NightlySchema = z.object({
  gratitude: z.string().max(4000),
  whatHappened: z.string().max(4000),
  repentAndImprove: z.string().max(4000),
  prepareForTomorrow: z.string().max(4000),
  topThree: z.array(z.string().max(300)).max(3),
});

export async function saveNightlyAction(input: unknown): Promise<void> {
  const parsed = NightlySchema.safeParse(input);
  if (!parsed.success) return;
  await saveNightlyEntry({
    date: toIsoDate(new Date()),
    ...parsed.data,
    // Filter here rather than in the schema so a blank middle row doesn't
    // silently shift the other two.
    topThree: parsed.data.topThree.filter((t) => t.trim().length > 0),
    hoursConfirmed: false,
  });
  revalidatePath("/nightly");
  revalidatePath("/plan-today");
}

const ConfirmSchema = z.object({
  entries: z
    .array(
      z.object({
        blockId: z.string().min(1),
        minutes: z.number().int().min(0).max(1440),
      }),
    )
    .max(200),
});

/**
 * "Confirm & log hours" (PRD §4.9) — writes the real durations into the blocks,
 * which is what fills Done on the Home tiles.
 */
export async function confirmHoursAction(input: unknown): Promise<void> {
  const parsed = ConfirmSchema.safeParse(input);
  if (!parsed.success) return;
  for (const { blockId, minutes } of parsed.data.entries) {
    await updateBlock(blockId, { confirmedMinutes: minutes });
  }
  revalidatePath("/nightly");
  revalidatePath("/");
}
