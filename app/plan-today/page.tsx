import { format } from "date-fns";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { ScheduleColumn } from "@/components/plan-today/schedule-column";
import { ToScheduleColumn } from "@/components/plan-today/to-schedule-column";
import { findOpenWindows, getDayBlocks } from "@/lib/data/calendar";
import { getFunnel } from "@/lib/data/goals";
import { getTopThreeFor } from "@/lib/data/rhythm";
import { getTodos } from "@/lib/data/todos";
import type { IconKey } from "@/lib/types";

export default async function PlanTodayPage() {
  const today = new Date();

  const [blocks, windows, topThree, todos, funnel] = await Promise.all([
    getDayBlocks(today),
    findOpenWindows(today),
    getTopThreeFor(today),
    getTodos(),
    getFunnel(),
  ]);

  const goalIcons: Record<string, IconKey | null> = Object.fromEntries(
    [...funnel.year, ...funnel.month, ...funnel.week].map((g) => [
      g.id,
      g.icon,
    ]),
  );

  return (
    <>
      <PageHeader
        title={`Plan today · ${format(today, "EEEE, MMMM d")}`}
        subtitle="Turn intention into a scheduled day"
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-2">
          <ScheduleColumn
            blocks={blocks}
            windows={windows}
            goalIcons={goalIcons}
            now={today.getTime()}
          />
          <ToScheduleColumn
            topThree={topThree}
            todos={todos.filter((t) => !t.done)}
          />
        </div>
      </PageBody>
    </>
  );
}
