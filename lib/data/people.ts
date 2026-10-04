/**
 * DATA SEAM — people (PRD §4.4).
 *
 * Sorted by staleness: days since the freshest of email / text / calendar.
 * Excluded people are filtered out of the list AND, in Part C, out of the
 * iMessage scan itself so their handles are never queried.
 */
import { subDays } from "date-fns";
import type { Person } from "../types";
import { MOCK_PEOPLE, OVERDUE_AFTER_DAYS } from "../mock/people";
import { store } from "../mock/store";

const excluded = store.excludedPeople;

function toPerson(p: (typeof MOCK_PEOPLE)[number]): Person {
  const days = p.daysAgo;
  return {
    id: p.id,
    name: p.name,
    relationship: p.relationship,
    nextStep: p.nextStep,
    lastContactAt:
      days === null ? null : subDays(new Date(), days).toISOString(),
    lastContactSource: p.source,
    daysSinceContact: days,
    overdue: days !== null && days >= OVERDUE_AFTER_DAYS,
    excluded: excluded.has(p.id),
  };
}

/** @param includeExcluded true only for the settings-style search list. */
export async function getPeople(includeExcluded = false): Promise<Person[]> {
  return MOCK_PEOPLE.map(toPerson)
    .filter((p) => includeExcluded || !p.excluded)
    .sort((a, b) => {
      // Never-contacted is the stalest thing there is, so it sorts first.
      const av = a.daysSinceContact ?? Number.POSITIVE_INFINITY;
      const bv = b.daysSinceContact ?? Number.POSITIVE_INFINITY;
      return bv - av;
    });
}

/** The condensed card that also appears on Goals (PRD §4.2). */
export async function getGoingStale(limit = 5): Promise<Person[]> {
  const people = await getPeople();
  return people.filter((p) => (p.daysSinceContact ?? 999) >= 7).slice(0, limit);
}

export async function setPersonExcluded(
  id: string,
  value: boolean,
): Promise<void> {
  if (value) excluded.add(id);
  else excluded.delete(id);
}

export async function getLastSyncedAt(): Promise<string> {
  return store.lastSyncedAt;
}

/**
 * Sets the pending flag the Mac agent polls (PRD §4.4). The scan happens the
 * next time the Mac is on — nothing grinds through the message DB all day.
 */
export async function requestContactRefresh(): Promise<void> {
  store.lastSyncedAt = new Date().toISOString();
}
