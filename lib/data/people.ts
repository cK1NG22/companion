/**
 * DATA SEAM — people (PRD §4.4).
 *
 * Sorted by staleness: days since the freshest of email / text / calendar.
 * Excluded people are filtered out of the list AND, in Part C, out of the
 * iMessage scan itself so their handles are never queried.
 */
import { subDays } from "date-fns";
import type { Person, Tag } from "../types";
import { MOCK_PEOPLE, OVERDUE_AFTER_DAYS } from "../mock/people";
import { nextId, store } from "../mock/store";
import { findTagByName, normalizeTagName } from "../tags";

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
    tags: store.personTags[p.id] ?? [],
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

/** Every tag, in sort order. Tags are user data — none are assumed to exist. */
export async function getTags(): Promise<Tag[]> {
  return [...store.tags].sort((a, b) => a.sortOrder - b.sortOrder);
}

const personExists = (id: string) => MOCK_PEOPLE.some((p) => p.id === id);

/** Finds the tag with this name, ignoring case, or makes it. */
function findOrCreateTag(name: string): Tag {
  const existing = findTagByName(store.tags, name);
  if (existing) return existing;
  const tag: Tag = {
    id: nextId("t"),
    name,
    sortOrder: Math.max(-1, ...store.tags.map((t) => t.sortOrder)) + 1,
  };
  store.tags = [...store.tags, tag];
  return tag;
}

/** @returns false when the person or the tag does not exist. */
export async function addTagToPerson(
  personId: string,
  tagId: string,
): Promise<boolean> {
  if (!personExists(personId)) return false;
  if (!store.tags.some((t) => t.id === tagId)) return false;
  const current = store.personTags[personId] ?? [];
  if (current.includes(tagId)) return true;
  store.personTags = { ...store.personTags, [personId]: [...current, tagId] };
  return true;
}

/**
 * Adds a tag by name, reusing one that differs only by case and creating it
 * otherwise. Nothing is created when the person is unknown or the name is
 * empty or too long once normalised.
 *
 * @returns false in either of those cases.
 */
export async function addNamedTagToPerson(
  personId: string,
  rawName: string,
): Promise<boolean> {
  const name = normalizeTagName(rawName);
  if (name === null || !personExists(personId)) return false;
  return addTagToPerson(personId, findOrCreateTag(name).id);
}

/** Takes the tag off the person. The tag itself stays, for other people. */
export async function removeTagFromPerson(
  personId: string,
  tagId: string,
): Promise<void> {
  const current = store.personTags[personId];
  if (!current?.includes(tagId)) return;
  store.personTags = {
    ...store.personTags,
    [personId]: current.filter((id) => id !== tagId),
  };
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
