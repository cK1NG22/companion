import { describe, expect, it } from "vitest";
import {
  MAX_RADIUS_MILES,
  MIN_RADIUS_MILES,
  RADIUS_OPTIONS_MILES,
  appleMapsUrl,
  distanceMiles,
  isLatLng,
  isRadiusMiles,
  mapsEmbedUrl,
  withinRadius,
} from "./geo";

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

// Coordinates arrive from the browser, so they are untrusted input.
describe("isLatLng", () => {
  it("accepts points on the globe, edges included", () => {
    expect(isLatLng(PROVO)).toBe(true);
    expect(isLatLng({ lat: 90, lng: 180 })).toBe(true);
    expect(isLatLng({ lat: -90, lng: -180 })).toBe(true);
    expect(isLatLng({ lat: 0, lng: 0 })).toBe(true);
  });

  it("rejects latitude outside -90..90", () => {
    expect(isLatLng({ lat: 90.0001, lng: 0 })).toBe(false);
    expect(isLatLng({ lat: -91, lng: 0 })).toBe(false);
  });

  it("rejects longitude outside -180..180", () => {
    expect(isLatLng({ lat: 0, lng: 180.0001 })).toBe(false);
    expect(isLatLng({ lat: 0, lng: -181 })).toBe(false);
  });

  it("rejects NaN and infinities", () => {
    expect(isLatLng({ lat: Number.NaN, lng: 0 })).toBe(false);
    expect(isLatLng({ lat: 0, lng: Number.NaN })).toBe(false);
    expect(isLatLng({ lat: Number.POSITIVE_INFINITY, lng: 0 })).toBe(false);
    expect(isLatLng({ lat: 0, lng: Number.NEGATIVE_INFINITY })).toBe(false);
  });
});

describe("isRadiusMiles", () => {
  it("accepts the bounds and everything between", () => {
    expect(isRadiusMiles(MIN_RADIUS_MILES)).toBe(true);
    expect(isRadiusMiles(MAX_RADIUS_MILES)).toBe(true);
    expect(isRadiusMiles(12.5)).toBe(true);
  });

  it("rejects anything outside the bounds", () => {
    expect(isRadiusMiles(MIN_RADIUS_MILES - 0.01)).toBe(false);
    expect(isRadiusMiles(MAX_RADIUS_MILES + 0.01)).toBe(false);
    expect(isRadiusMiles(0)).toBe(false);
    expect(isRadiusMiles(-5)).toBe(false);
  });

  it("rejects NaN and infinities", () => {
    expect(isRadiusMiles(Number.NaN)).toBe(false);
    expect(isRadiusMiles(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("every option the control offers is a valid radius", () => {
    for (const miles of RADIUS_OPTIONS_MILES) {
      expect(isRadiusMiles(miles)).toBe(true);
    }
  });
});

describe("withinRadius", () => {
  const places = [
    { id: "near", ...PROVO },
    { id: "far", ...SLC },
  ];

  it("keeps what is inside the radius and measures it from the anchor", () => {
    const kept = withinRadius(PROVO, places, 10);
    expect(kept.map((p) => p.id)).toEqual(["near"]);
    expect(kept[0]?.distanceMiles).toBe(0);
  });

  it("measures from whichever anchor it is given", () => {
    const kept = withinRadius(SLC, places, 10);
    expect(kept.map((p) => p.id)).toEqual(["far"]);
  });

  it("includes a place exactly on the edge", () => {
    const edge = distanceMiles(PROVO, SLC);
    expect(withinRadius(PROVO, places, edge)).toHaveLength(2);
  });

  it("does not mutate its input", () => {
    const before = structuredClone(places);
    withinRadius(PROVO, places, 10);
    expect(places).toEqual(before);
  });
});
