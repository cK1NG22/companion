import { PageBody, PageHeader } from "@/components/shell/page-header";
import { WeekStepper } from "@/components/common/week-stepper";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getWeekBlocks } from "@/lib/data/calendar";
import { getFunnel } from "@/lib/data/goals";
import type { IconKey } from "@/lib/types";
import { resolveAnchor, toIsoDate, weekStart } from "@/lib/week";

export default async function CalendarPage(props: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await props.searchParams;
  const anchor = resolveAnchor(w);

  const [blocks, funnel] = await Promise.all([
    getWeekBlocks(anchor),
    getFunnel(),
  ]);

  // Blocks show their goal's icon, so the page resolves the lookup once
  // rather than every event doing it during render.
  const goalIcons: Record<string, IconKey | null> = Object.fromEntries(
    [...funnel.year, ...funnel.month, ...funnel.week].map((g) => [g.id, g.icon]),
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Blocks are the input — this is where time is entered"
      >
        <WeekStepper anchor={toIsoDate(weekStart(anchor))} />
      </PageHeader>
      <PageBody>
        <CalendarView
          blocks={blocks}
          goals={funnel.week}
          goalIcons={goalIcons}
        />
      </PageBody>
    </>
  );
}
