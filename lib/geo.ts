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
