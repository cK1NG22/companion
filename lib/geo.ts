/**
 * Straight-line distance. PRD §5: "what's near" is free math in our own code,
 * never a paid Distance Matrix call. Good enough to rank a list — turn-by-turn
 * is an Apple Maps hand-off link.
 */
const EARTH_RADIUS_MILES = 3958.8;

export interface LatLng {
  lat: number;
  lng: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return round(2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h))));
}

/** The radius each list uses until the user picks one. */
export const DEFAULT_FOOD_RADIUS_MILES = 15;
export const DEFAULT_ACTIVITY_RADIUS_MILES = 40;

/** Bounds on a radius a caller may ask for. Anything outside is rejected. */
export const MIN_RADIUS_MILES = 1;
export const MAX_RADIUS_MILES = 100;

/** What the radius control offers. */
export const RADIUS_OPTIONS_MILES = [2, 5, 10, 25, 50] as const;

/** A real point on the globe: both numbers finite and in range. */
export function isLatLng(point: LatLng): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

export function isRadiusMiles(miles: number): boolean {
  return (
    Number.isFinite(miles) &&
    miles >= MIN_RADIUS_MILES &&
    miles <= MAX_RADIUS_MILES
  );
}

/** The places within `radiusMiles` of `anchor`, each with its distance. */
export function withinRadius<T extends LatLng>(
  anchor: LatLng,
  places: readonly T[],
  radiusMiles: number,
): (T & { distanceMiles: number })[] {
  return places
    .map((place) => ({
      ...place,
      distanceMiles: distanceMiles(anchor, { lat: place.lat, lng: place.lng }),
    }))
    .filter((place) => place.distanceMiles <= radiusMiles);
}

/** An Apple Maps hand-off URL — a free link, not an API call. */
export function appleMapsUrl(name: string, coords: LatLng): string {
  const q = encodeURIComponent(name);
  return `https://maps.apple.com/?q=${q}&ll=${coords.lat},${coords.lng}`;
}

/**
 * Google Maps Embed API iframe src. Free and unlimited (PRD §5) — the map has
 * to be Google's because Google's place data may only ride a Google map.
 *
 * ponytail: the key is a public, HTTP-referrer-restricted embed key. If it is
 * missing we render a static link instead of a broken iframe.
 */
export function mapsEmbedUrl(
  query: string,
  apiKey: string | undefined,
): string | null {
  if (!apiKey) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;
}

/**
 * The embed key, read here so no screen touches `process.env`. Must stay the
 * literal `process.env.NEXT_PUBLIC_*` form — that is what Next inlines at build.
 */
export const MAPS_EMBED_KEY: string | undefined =
  process.env.NEXT_PUBLIC_MAPS_EMBED_KEY;

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
