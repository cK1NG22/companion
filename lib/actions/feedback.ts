"use server";

import { z } from "zod";
import { submitFeedback } from "@/lib/data/feedback";

/**
 * Validation at the trust boundary. The client sends whatever it likes;
 * the server decides what's acceptable before anything is stored.
 */
const FeedbackSchema = z.object({
  text: z.string().trim().min(1, "Say what you'd like to change.").max(2000),
  kind: z.enum(["app_edit", "date_research"]),
  tab: z.string().max(64).nullable(),
});

export type FeedbackResult = { ok: true } | { ok: false; error: string };

export async function submitFeedbackAction(
  input: unknown,
): Promise<FeedbackResult> {
  const parsed = FeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  await submitFeedback(parsed.data);
  return { ok: true };
}
