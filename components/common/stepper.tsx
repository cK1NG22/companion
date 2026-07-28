"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A numbered step rail. shadcn has no stepper, and this is ~25 lines, so it's
 * hand-written rather than pulling in a wizard library for one flow.
 */
export function Stepper({
  steps,
  current,
  onSelect,
}: {
  steps: string[];
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-good text-white",
                  !active && !done && "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  active ? "font-medium" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 ? (
              <span className="h-px w-6 bg-border" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
