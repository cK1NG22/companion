import { describe, expect, it } from "vitest";
import { moveAfter } from "./reorder";

describe("moveAfter", () => {
  it("moves an item down to sit after another", () => {
    expect(moveAfter(["a", "b", "c", "d"], "a", "c")).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("moves an item up to sit after another", () => {
    expect(moveAfter(["a", "b", "c", "d"], "d", "a")).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("moves an item to the top when there is nothing to sit after", () => {
    expect(moveAfter(["a", "b", "c"], "c", null)).toEqual(["c", "a", "b"]);
  });

  it("moves an item to the end", () => {
    expect(moveAfter(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
  });

  it("leaves the list alone when the item is already there", () => {
    expect(moveAfter(["a", "b", "c"], "b", "a")).toEqual(["a", "b", "c"]);
    expect(moveAfter(["a", "b", "c"], "a", null)).toEqual(["a", "b", "c"]);
  });

  it("leaves the list alone when either id is unknown, or both are the same", () => {
    expect(moveAfter(["a", "b"], "x", "a")).toEqual(["a", "b"]);
    expect(moveAfter(["a", "b"], "a", "x")).toEqual(["a", "b"]);
    expect(moveAfter(["a", "b"], "a", "a")).toEqual(["a", "b"]);
  });

  it("does not mutate its argument", () => {
    const current = ["a", "b", "c"];
    moveAfter(current, "c", null);
    expect(current).toEqual(["a", "b", "c"]);
  });
});
