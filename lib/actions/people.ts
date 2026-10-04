"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addNamedTagToPerson,
  addTagToPerson,
  removeTagFromPerson,
  requestContactRefresh,
  setPersonExcluded,
} from "@/lib/data/people";
import { TAG_NAME_MAX, normalizeTagName } from "@/lib/tags";

const ExcludeSchema = z.object({
  id: z.string().min(1),
  excluded: z.boolean(),
});

/**
 * Excluding someone removes them from the People list AND, in Part C, from the
 * iMessage scan itself — their handle is never queried (PRD §4.4).
 */
export async function setExcludedAction(input: unknown): Promise<void> {
  const parsed = ExcludeSchema.safeParse(input);
  if (!parsed.success) return;
  await setPersonExcluded(parsed.data.id, parsed.data.excluded);
  revalidatePath("/people");
  revalidatePath("/goals");
}

export type TagActionResult = { ok: true } | { ok: false; error: string };

const Id = z.string().min(1).max(64);

/** Either an existing tag by id, or a name to find-or-create. */
const AddTagSchema = z.union([
  z.object({ personId: Id, tagId: Id }).strict(),
  z
    .object({
      personId: Id,
      name: z
        .string()
        // Bounds the raw input before any work is done on it.
        .max(TAG_NAME_MAX * 4)
        .transform(normalizeTagName)
        .pipe(z.string()),
    })
    .strict(),
]);

const TAG_NAME_ERROR = `A tag needs a name of 1–${TAG_NAME_MAX} characters.`;

export async function addTagAction(input: unknown): Promise<TagActionResult> {
  const parsed = AddTagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: TAG_NAME_ERROR };

  const data = parsed.data;
  const added =
    "tagId" in data
      ? await addTagToPerson(data.personId, data.tagId)
      : await addNamedTagToPerson(data.personId, data.name);
  if (!added) {
    return { ok: false, error: "That person or tag no longer exists." };
  }
  revalidatePath("/people");
  return { ok: true };
}

const RemoveTagSchema = z.object({ personId: Id, tagId: Id });

export async function removeTagAction(input: unknown): Promise<void> {
  const parsed = RemoveTagSchema.safeParse(input);
  if (!parsed.success) return;
  await removeTagFromPerson(parsed.data.personId, parsed.data.tagId);
  revalidatePath("/people");
}

/**
 * Sets the pending flag the Mac agent polls. The scan runs the next time the
 * Mac is on — deliberately not a daemon grinding through the message DB.
 */
export async function refreshContactsAction(): Promise<void> {
  await requestContactRefresh();
  revalidatePath("/people");
}
