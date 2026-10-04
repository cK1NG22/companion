"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GoalIcon, ICON_LABELS } from "@/components/common/goal-icon";
import { cn } from "@/lib/utils";
import { ICON_KEYS, type IconKey } from "@/lib/types";

/**
 * Popover grid, 3 wide (PRD §4.2, decided 2026-07-20).
 *
 * Chosen over an always-visible inline row (too busy inside the funnel) and a
 * searchable picker (overkill for eight icons).
 */
export function IconPicker({
  value,
  onChange,
}: {
  value: IconKey | null;
  onChange: (icon: IconKey) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Change icon"
            className="inline-flex items-center gap-0.5 rounded-md border px-1.5 py-1 text-muted-foreground hover:bg-muted"
          />
        }
      >
        <GoalIcon icon={value} />
        <ChevronDown className="size-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5" align="start">
        <div className="grid grid-cols-3 gap-1">
          {ICON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              title={ICON_LABELS[key]}
              aria-label={ICON_LABELS[key]}
              aria-pressed={value === key}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={cn(
                "grid size-9 place-items-center rounded-md transition-colors hover:bg-muted",
                value === key && "bg-accent text-accent-foreground",
              )}
            >
              <GoalIcon icon={key} className="size-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
