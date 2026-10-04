"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addQuestion,
  addScriptureNote,
  toggleQuestion,
} from "@/lib/data/rhythm";

const NoteSchema = z.object({
  reference: z.string().trim().min(1, "Which passage?").max(120),
  body: z.string().trim().min(1, "Write something.").max(8000),
});

export type ScriptureResult = { ok: true } | { ok: false; error: string };

export async function addScriptureNoteAction(
  input: unknown,
): Promise<ScriptureResult> {
  const parsed = NoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid note.",
    };
  }
  await addScriptureNote(parsed.data);
  revalidatePath("/scripture");
  return { ok: true };
}

export async function addQuestionAction(text: string): Promise<void> {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed || trimmed.length > 500) return;
  await addQuestion(trimmed);
  revalidatePath("/scripture");
}

export async function toggleQuestionAction(id: string): Promise<void> {
  if (!id) return;
  await toggleQuestion(id);
  revalidatePath("/scripture");
}
