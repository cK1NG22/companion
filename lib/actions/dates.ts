"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createBlock, endFor, firstWindowFitting } from "@/lib/data/calendar";
import { getFunnel } from "@/lib/data/goals";

const PlaceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(300),
});

const ScheduleSchema = z.object({
  /** Ordered by selection: the first-picked place leads the event name. */
  places: z.array(PlaceSchema).min(1).max(2),
  durationMinutes: z.number().int().min(30).max(480).default(120),
});

export type DateResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Schedule a date (PRD §4.12).
 *
 * The event is named "{first} + {second}" when a pairing was kept, and every
 * included place gets a 📍 line in the notes so both can be navigated to from
 * the calendar app.
 */
export async function scheduleDateAction(input: unknown): Promise<DateResult> {
  const parsed = ScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Pick at least one place." };
  }
  const { places, durationMinutes } = parsed.data;

  const window = await firstWindowFitting(new Date(), durationMinutes);
  if (!window) {
    return { ok: false, error: "No open window today long enough for this." };
  }

  // Dates are tagged to the family goal — the heart (PRD §4.12).
  const funnel = await getFunnel();
  const familyGoal = funnel.week.find((g) => g.icon === "heart") ?? null;

  await createBlock({
    name: places.map((p) => p.name).join(" + "),
    start: window.start,
    end: endFor(window.start, durationMinutes),
    goalId: familyGoal?.id ?? null,
    notes: places.map((p) => `📍 ${p.name} — ${p.address}`).join("\n"),
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return {
    ok: true,
    message:
      places.length > 1
        ? `Scheduled ${places[0].name} + ${places[1].name}.`
        : `Scheduled ${places[0].name}.`,
  };
}
