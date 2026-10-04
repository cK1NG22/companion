/**
 * DATA SEAM — feedback queue (PRD §4.11).
 *
 * The bubble writes here; in Part C a launchd runner on Carter's laptop polls
 * this queue and either edits the app (`app_edit`) or researches a date idea
 * (`date_research`).
 */
import type { FeedbackItem, FeedbackKind } from "../types";

const queue: FeedbackItem[] = [];
let nextId = 1;

export async function getFeedbackQueue(): Promise<FeedbackItem[]> {
  return [...queue].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function submitFeedback(input: {
  text: string;
  kind: FeedbackKind;
  tab: string | null;
}): Promise<FeedbackItem> {
  const item: FeedbackItem = {
    id: `f${nextId++}`,
    text: input.text,
    kind: input.kind,
    tab: input.tab,
    status: "queued",
    createdAt: new Date().toISOString(),
    result: null,
  };
  queue.push(item);
  return item;
}
