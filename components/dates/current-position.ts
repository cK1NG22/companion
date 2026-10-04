/**
 * The device's current position, from the browser's geolocation API.
 *
 * Never throws and never rejects: every way this can fail comes back as a
 * message to show, so the caller can fall back to Home. The coordinates are
 * returned to the caller and kept nowhere else.
 */
export type PositionResult =
  { ok: true; lat: number; lng: number } | { ok: false; message: string };

const TIMEOUT_MS = 10_000;
/** A fix this recent is reused rather than waking the GPS again. */
const MAX_AGE_MS = 60_000;

// GeolocationPositionError codes. Literal, because the constants live on an
// object that does not exist when the API is missing.
const PERMISSION_DENIED = 1;
const TIMEOUT = 3;

const MESSAGES = {
  missing: "This browser cannot share its location.",
  denied: "Location permission was denied.",
  timeout: "Finding your location timed out.",
  unavailable: "Your location could not be determined.",
} as const;

export function getCurrentPosition(): Promise<PositionResult> {
  const geolocation =
    typeof navigator === "undefined" ? undefined : navigator.geolocation;
  if (!geolocation?.getCurrentPosition) {
    return Promise.resolve({ ok: false, message: MESSAGES.missing });
  }

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) =>
        resolve({
          ok: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => {
        if (error.code === PERMISSION_DENIED) {
          resolve({ ok: false, message: MESSAGES.denied });
        } else if (error.code === TIMEOUT) {
          resolve({ ok: false, message: MESSAGES.timeout });
        } else {
          resolve({ ok: false, message: MESSAGES.unavailable });
        }
      },
      { timeout: TIMEOUT_MS, maximumAge: MAX_AGE_MS },
    );
  });
}
