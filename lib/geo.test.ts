import { describe, expect, it } from "vitest";
import { appleMapsUrl, distanceMiles, mapsEmbedUrl } from "./geo";

// Provo, UT and Salt Lake City, UT — about 43 miles apart.
const PROVO = { lat: 40.2338, lng: -111.6585 };
const SLC = { lat: 40.7608, lng: -111.891 };

describe("distanceMiles", () => {
  it("is zero for the same point", () => {
    expect(distanceMiles(PROVO, PROVO)).toBe(0);
  });

  it("matches a known real-world distance", () => {
    const d = distanceMiles(PROVO, SLC);
    expect(d).toBeGreaterThan(38);
    expect(d).toBeLessThan(46);
  });

  it("is symmetric", () => {
    expect(distanceMiles(PROVO, SLC)).toBe(distanceMiles(SLC, PROVO));
  });

  // Math.sqrt of a value a hair over 1 from floating-point error would make
  // Math.asin return NaN, so antipodal-ish points must stay finite.
  it("stays finite for antipodal points", () => {
    const d = distanceMiles({ lat: 0, lng: 0 }, { lat: 0, lng: 180 });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(12000);
  });
});

describe("map links", () => {
  it("escapes place names in the Apple Maps hand-off", () => {
    const url = appleMapsUrl("Joe's Pizza & Bar", PROVO);
    // The escape that matters is the name's own `&`: left raw it would start
    // a new query param and truncate the name. Apostrophe is an unreserved
    // character, so encodeURIComponent legitimately leaves it alone.
    expect(url).toContain("q=Joe's%20Pizza%20%26%20Bar&ll=");
    expect(url).toContain("40.2338,-111.6585");
  });

  it("returns null rather than a broken iframe when no key is configured", () => {
    expect(mapsEmbedUrl("anywhere", undefined)).toBeNull();
    expect(mapsEmbedUrl("anywhere", "abc")).toContain("key=abc");
  });
});
