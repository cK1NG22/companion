"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requestContactRefresh, setPersonExcluded } from "@/lib/data/people";

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

/**
 * Sets the pending flag the Mac agent polls. The scan runs the next time the
 * Mac is on — deliberately not a daemon grinding through the message DB.
 */
export async function refreshContactsAction(): Promise<void> {
  await requestContactRefresh();
  revalidatePath("/people");
}
