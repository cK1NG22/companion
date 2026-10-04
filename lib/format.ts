/**
 * Small display math shared by screens: minutes → "1h 30m", an ISO date →
 * "3d ago". Pure, so the rounding edges are pinned by tests instead of
 * living inside components.
 */
const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30;

/** Terse minutes: "45m", "1h", "1h 30m". Zero renders as "0m". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * A to-do's duration: "45 min" under an hour, then "1h 30m". Null when there
 * is no duration (null or 0) so the caller can render nothing.
 */
export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  return formatMinutes(minutes);
}

/**
 * "3d ago" chips, but terse. `now` is epoch milliseconds, passed in so this
 * stays pure. A month is a flat 30 days.
 */
export function lastDoneChip(
  lastDone: string | null,
  now: number,
): string | null {
  if (!lastDone) return null;
  const days = Math.round((now - new Date(lastDone).getTime()) / MS_PER_DAY);
  if (days <= 0) return "today";
  if (days < DAYS_PER_MONTH) return `${days}d ago`;
  return `${Math.round(days / DAYS_PER_MONTH)}mo ago`;
}

/** Total hours from per-entry minutes. A null (invalid) entry counts as zero. */
export function sumHours(minutes: readonly (number | null)[]): number {
  return minutes.reduce<number>((sum, m) => sum + (m ?? 0), 0) / 60;
}
