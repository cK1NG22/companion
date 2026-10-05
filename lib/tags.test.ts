import { describe, expect, it } from "vitest";
import {
  TAG_NAME_MAX,
  filterByTag,
  findTagByName,
  groupByTag,
  normalizeTagName,
  tagsOf,
} from "./tags";
import type { Person, Tag } from "./types";

const person = (id: string, tags: string[]): Person => ({
  id,
  name: id,
  relationship: null,
  nextStep: null,
  lastContactAt: null,
  lastContactSource: null,
  daysSinceContact: null,
  overdue: false,
  excluded: false,
  tags,
});

const FAMILY: Tag = { id: "t1", name: "Family", sortOrder: 0 };
const WORK: Tag = { id: "t2", name: "Work", sortOrder: 1 };
const CHURCH: Tag = { id: "t3", name: "Church", sortOrder: 2 };
// Deliberately out of order: the helpers sort, the caller does not have to.
const TAGS = [CHURCH, FAMILY, WORK];

describe("normalizeTagName", () => {
  it("trims the ends", () => {
    expect(normalizeTagName("  Family  ")).toBe("Family");
  });

  it("collapses runs of whitespace inside the name", () => {
    expect(normalizeTagName("Old   \t friends")).toBe("Old friends");
  });

  it("refuses an empty or whitespace-only name", () => {
    expect(normalizeTagName("")).toBeNull();
    expect(normalizeTagName("   ")).toBeNull();
  });

  it("allows a name exactly at the cap and refuses one past it", () => {
    expect(normalizeTagName("a".repeat(TAG_NAME_MAX))).toBe(
      "a".repeat(TAG_NAME_MAX),
    );
    expect(normalizeTagName("a".repeat(TAG_NAME_MAX + 1))).toBeNull();
  });

  it("measures the cap after trimming", () => {
    expect(normalizeTagName(`  ${"a".repeat(TAG_NAME_MAX)}  `)).toBe(
      "a".repeat(TAG_NAME_MAX),
    );
  });
});

describe("findTagByName", () => {
  it("matches regardless of case", () => {
    expect(findTagByName(TAGS, "family")).toBe(FAMILY);
    expect(findTagByName(TAGS, "WORK")).toBe(WORK);
  });

  it("returns undefined when nothing matches", () => {
    expect(findTagByName(TAGS, "Fam")).toBeUndefined();
  });
});

describe("tagsOf", () => {
  it("returns the person's tags in tag sort order", () => {
    expect(tagsOf(person("a", ["t3", "t1"]), TAGS)).toEqual([FAMILY, CHURCH]);
  });

  it("skips ids that no longer name a tag", () => {
    expect(tagsOf(person("a", ["gone", "t2"]), TAGS)).toEqual([WORK]);
  });
});

describe("filterByTag", () => {
  const people = [
    person("a", ["t1"]),
    person("b", []),
    person("c", ["t2", "t1"]),
  ];

  it("returns everyone when no tag is chosen", () => {
    expect(filterByTag(people, null)).toEqual(people);
  });

  it("keeps only people carrying the tag, in the order given", () => {
    expect(filterByTag(people, "t1").map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("returns nobody for a tag no one carries", () => {
    expect(filterByTag(people, "t3")).toEqual([]);
  });
});

describe("groupByTag", () => {
  // The input order stands in for stale-first, which getPeople already applied.
  const people = [
    person("stalest", ["t2"]),
    person("middle", ["t1", "t2"]),
    person("untagged", []),
    person("freshest", ["t1"]),
  ];

  it("orders groups by tag sort order, with untagged people last", () => {
    const groups = groupByTag(people, TAGS);
    expect(groups.map((g) => g.tag?.name ?? null)).toEqual([
      "Family",
      "Work",
      null,
    ]);
  });

  it("keeps the incoming order inside each group", () => {
    const groups = groupByTag(people, TAGS);
    expect(groups[0].people.map((p) => p.id)).toEqual(["middle", "freshest"]);
    expect(groups[1].people.map((p) => p.id)).toEqual(["stalest", "middle"]);
    expect(groups[2].people.map((p) => p.id)).toEqual(["untagged"]);
  });

  it("leaves out a tag nobody carries", () => {
    const groups = groupByTag(people, TAGS);
    expect(groups.some((g) => g.tag?.id === "t3")).toBe(false);
  });

  it("leaves out the untagged group when everyone has a tag", () => {
    const groups = groupByTag([person("a", ["t1"])], TAGS);
    expect(groups.map((g) => g.tag?.id ?? null)).toEqual(["t1"]);
  });

  it("treats a person whose only tag id is unknown as untagged", () => {
    const groups = groupByTag([person("a", ["gone"])], TAGS);
    expect(groups).toEqual([{ tag: null, people: [person("a", ["gone"])] }]);
  });

  it("does not mutate its input", () => {
    const tags = [...TAGS];
    groupByTag(people, tags);
    expect(tags).toEqual([CHURCH, FAMILY, WORK]);
  });
});
