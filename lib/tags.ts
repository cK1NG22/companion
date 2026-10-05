/**
 * Tags on people (PRD §4.4) — the pure rules. Names are user data; nothing
 * here knows what any tag means.
 */
import type { Person, Tag } from "./types";

/** Longest tag name accepted. Long enough for a phrase, short enough to fit a chip. */
export const TAG_NAME_MAX = 30;

/**
 * The stored form of a typed tag name: ends trimmed, inner whitespace runs
 * collapsed to one space. Null when nothing is left or it is past the cap.
 */
export function normalizeTagName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0 || name.length > TAG_NAME_MAX) return null;
  return name;
}

/** Tags are unique by name ignoring case: "family" finds "Family". */
export function findTagByName(tags: Tag[], name: string): Tag | undefined {
  const wanted = name.toLowerCase();
  return tags.find((t) => t.name.toLowerCase() === wanted);
}

const bySortOrder = (a: Tag, b: Tag) => a.sortOrder - b.sortOrder;

/** A person's tags in tag sort order. Ids that name no tag are skipped. */
export function tagsOf(person: Person, tags: Tag[]): Tag[] {
  return tags.filter((t) => person.tags.includes(t.id)).sort(bySortOrder);
}

/** Null means no filter. The incoming order is kept. */
export function filterByTag(people: Person[], tagId: string | null): Person[] {
  if (tagId === null) return people;
  return people.filter((p) => p.tags.includes(tagId));
}

export interface TagGroup {
  /** Null is the group of people with no tag. */
  tag: Tag | null;
  people: Person[];
}

/**
 * One group per tag somebody carries, in tag sort order, then the untagged.
 * A person with two tags appears in both groups. The incoming order is kept
 * inside every group, so a stale-first list stays stale-first.
 */
export function groupByTag(people: Person[], tags: Tag[]): TagGroup[] {
  const known = new Set(tags.map((t) => t.id));
  const tagged: TagGroup[] = [...tags]
    .sort(bySortOrder)
    .map((tag) => ({ tag, people: filterByTag(people, tag.id) }));
  const untagged: TagGroup = {
    tag: null,
    people: people.filter((p) => !p.tags.some((id) => known.has(id))),
  };
  return [...tagged, untagged].filter((g) => g.people.length > 0);
}
