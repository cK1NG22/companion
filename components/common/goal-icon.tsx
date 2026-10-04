import {
  BookOpen,
  Church,
  Dumbbell,
  Heart,
  Laptop,
  Moon,
  Phone,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconKey } from "@/lib/types";

/**
 * A goal's icon represents it EVERYWHERE — most importantly on calendar blocks,
 * which read as [event name] + [goal icon] with no text label (PRD §4.3).
 *
 * The assortment is approved and fixed (PRD §6, decision 7). Adding an icon
 * means adding a key to IconKey, not inventing one at a call site.
 */
const ICONS: Record<IconKey, LucideIcon> = {
  book: BookOpen,
  dumbbell: Dumbbell,
  laptop: Laptop,
  phone: Phone,
  heart: Heart,
  temple: Church,
  moon: Moon,
  target: Target,
};

export const ICON_LABELS: Record<IconKey, string> = {
  book: "Scripture / study",
  dumbbell: "Health",
  laptop: "Deep work",
  phone: "Outreach",
  heart: "Family",
  temple: "Temple",
  moon: "Review",
  target: "Goal",
};

export function GoalIcon({
  icon,
  className,
}: {
  icon: IconKey | null | undefined;
  className?: string;
}) {
  // A goal without an icon still needs to occupy the same space, or rows jitter.
  const Icon = icon ? ICONS[icon] : Target;
  return (
    <Icon
      aria-hidden
      strokeWidth={1.8}
      className={cn("size-4 shrink-0", !icon && "opacity-30", className)}
    />
  );
}
