"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoalIcon } from "@/components/common/goal-icon";
import { Stepper } from "@/components/weekly-planning/stepper";
import { TriStateBar } from "@/components/common/tri-state-bar";
import type { Goal, KeyIndicator } from "@/lib/types";

const STEPS = ["Review last week", "Set this week", "Time-block"];

const fmt = (v: number, unit: KeyIndicator["unit"]) =>
  unit === "hours" ? `${Number.isInteger(v) ? v : v.toFixed(1)}h` : `${v}`;

/**
 * The weekly PMG session (PRD §4.10): review → set → time-block.
 * This month's Plans are shown as reference in step 2, so the week is set
 * against the month rather than in isolation.
 */
export function PlanningFlow({
  lastWeek,
  thisWeek,
  monthPlans,
  weekLabel,
  anchor,
}: {
  lastWeek: KeyIndicator[];
  thisWeek: KeyIndicator[];
  monthPlans: Goal[];
  weekLabel: string;
  /** Monday of the week being planned — carried into the calendar link so
      time-blocking lands on the week you just planned, not today's. */
  anchor: string;
}) {
  const [step, setStep] = useState(0);

  return (
    <div className="grid gap-5">
      <Stepper steps={STEPS} current={step} onSelect={setStep} />

      {step === 0 ? (
        <Card className="gap-0 p-0 shadow-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">
              How last week actually went
            </h2>
            <p className="text-xs text-muted-foreground">
              Done against the target you set. Wins and misses, plainly.
            </p>
          </div>
          <ul className="divide-y">
            {lastWeek.map((ki) => {
              const hit = ki.target > 0 && ki.done >= ki.target;
              return (
                <li key={ki.goalId} className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <GoalIcon
                      icon={ki.icon}
                      className="text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {ki.title}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums">
                      <span className={hit ? "font-semibold text-good" : ""}>
                        {fmt(ki.done, ki.unit)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {fmt(ki.target, ki.unit)}
                      </span>
                    </span>
                  </div>
                  <TriStateBar
                    planned={ki.planned}
                    done={ki.done}
                    target={ki.target}
                    behind={!hit}
                  />
                </li>
              );
            })}
            {lastWeek.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No inputs were tracked last week.
              </li>
            ) : null}
          </ul>
        </Card>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-0 p-0 shadow-card">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">This week&apos;s inputs</h2>
              <p className="text-xs text-muted-foreground">
                {weekLabel} · edit targets on the Goals tab
              </p>
            </div>
            <ul className="divide-y">
              {thisWeek.map((ki) => (
                <li
                  key={ki.goalId}
                  className="flex items-center gap-2.5 px-4 py-2.5"
                >
                  <GoalIcon icon={ki.icon} className="text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {ki.title}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {fmt(ki.target, ki.unit)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t bg-muted/40 px-4 py-2.5">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/goals" />}
              >
                Edit inputs <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </Card>

          {/* The month is shown as reference so the week is set against it. */}
          <Card className="gap-0 p-0 shadow-card">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">This month&apos;s plans</h2>
              <p className="text-xs text-muted-foreground">
                Reference — what this week has to move
              </p>
            </div>
            <ul className="divide-y">
              {monthPlans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex items-center gap-2.5 px-4 py-2.5"
                >
                  <GoalIcon
                    icon={plan.icon}
                    className="text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {plan.title}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <Card className="items-start gap-3 px-5 py-5 shadow-card">
          <h2 className="text-sm font-semibold">Put it on the calendar</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Targets are intentions until they occupy time. Block the week now —
            deep work first, then the protected things (workout, scripture, date
            night), then everything else fills the gaps.
          </p>
          <Button
            nativeButton={false}
            render={<Link href={`/calendar?w=${anchor}`} />}
          >
            <CalendarDays className="size-4" /> Open the calendar
          </Button>
        </Card>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        >
          Next <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
