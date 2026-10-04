import { cn } from "@/lib/utils";

/**
 * Target → Planned → Done, in one bar (PRD §4.1).
 *
 * shadcn's <Progress> renders a single value, so this is hand-written: the
 * track is the target (the denominator), a translucent fill is what's been
 * scheduled, and a solid fill is what was confirmed at night. Values are
 * lifted from mockup.html — track `--surface-2`, planned = accent at 26%,
 * done = solid accent.
 *
 * `behind` swaps navy for the muted clay reserved for "behind / overdue / now".
 */
export function TriStateBar({
  planned,
  done,
  target,
  behind = false,
  className,
}: {
  planned: number;
  done: number;
  target: number;
  behind?: boolean;
  className?: string;
}) {
  // A zero target would divide by zero; render an empty track instead.
  const pct = (n: number) =>
    target > 0 ? `${Math.min(100, (n / target) * 100)}%` : "0%";

  return (
    <div
      className={cn(
        "relative mt-2.5 h-[5px] overflow-hidden rounded-[3px] bg-secondary",
        className,
      )}
      role="img"
      aria-label={`${done} done and ${planned} planned of ${target}`}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-[3px]",
          behind ? "bg-warm/30" : "bg-primary/25",
        )}
        style={{ width: pct(planned) }}
      />
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-[3px]",
          behind ? "bg-warm" : "bg-primary",
        )}
        style={{ width: pct(done) }}
      />
    </div>
  );
}
