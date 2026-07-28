import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { WeekStepper } from "@/components/common/week-stepper";
import { HabitGrid } from "@/components/home/habit-grid";
import { KeyIndicatorTiles } from "@/components/home/key-indicator-tiles";
import {
  getAllocation,
  getHabitGrid,
  getKeyIndicators,
  getPurposeStatement,
} from "@/lib/data/home";
import type { Allocation } from "@/lib/types";
import { isSameWeek, resolveAnchor, toIsoDate, weekStart } from "@/lib/week";

export default async function HomePage(props: {
  // Next 16: searchParams is a Promise.
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await props.searchParams;
  const anchor = resolveAnchor(w);

  const [purpose, indicators, habitGrid] = await Promise.all([
    getPurposeStatement(),
    getKeyIndicators(anchor),
    getHabitGrid(anchor),
  ]);

  // Only ~5 weekly inputs exist, so resolving every breakdown up front is
  // cheaper than a round trip per tile tap.
  const allocations: Record<string, Allocation> = Object.fromEntries(
    (
      await Promise.all(
        indicators.map((ki) => getAllocation(ki.goalId, anchor)),
      )
    )
      .filter((a): a is Allocation => a !== null)
      .map((a) => [a.goalId, a]),
  );

  return (
    <>
      <PageHeader title={`Home · ${format(new Date(), "EEEE, MMMM d")}`}>
        <WeekStepper anchor={toIsoDate(weekStart(anchor))} />
        <Button variant="outline" size="sm" render={<Link href="/plan-today" />}>
          Plan today
        </Button>
        <Button size="sm" render={<Link href="/weekly-planning" />}>
          Weekly planning
        </Button>
      </PageHeader>

      <PageBody>
        <div className="grid gap-5">
          <Card className="shadow-card">
            <p className="prose-devotional px-5 text-[15px] text-balance">
              {purpose}
            </p>
          </Card>

          <section className="grid gap-2.5">
            <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              This week at a glance
            </h2>
            <KeyIndicatorTiles
              indicators={indicators}
              allocations={allocations}
            />
          </section>

          <section className="grid gap-2.5">
            <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Habits
            </h2>
            <HabitGrid
              rows={habitGrid.rows}
              isCurrentWeek={isSameWeek(anchor, new Date())}
            />
          </section>
        </div>
      </PageBody>
    </>
  );
}
