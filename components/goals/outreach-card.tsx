import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Person } from "@/lib/types";

/**
 * The condensed People view surfaced on Goals (PRD §4.2 / §4.4).
 * People, not tasks, are a first-class unit of progress.
 */
export function OutreachCard({ people }: { people: Person[] }) {
  return (
    <Card className="gap-0 p-0 shadow-card">
      <div className="flex items-start justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Going stale</h3>
          <p className="text-xs text-muted-foreground">
            Longest since last contact
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/people" />}
        >
          All <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <ul className="divide-y">
        {people.map((person) => (
          <li key={person.id} className="flex items-start gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{person.name}</p>
                {person.overdue ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-warm-soft text-[10px] text-warm"
                  >
                    overdue
                  </Badge>
                ) : null}
              </div>
              {person.nextStep ? (
                <p className="truncate text-xs text-muted-foreground">
                  {person.nextStep}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
              {person.daysSinceContact === null
                ? "never"
                : `${person.daysSinceContact}d`}
            </span>
          </li>
        ))}
        {people.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            Everyone's fresh.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
