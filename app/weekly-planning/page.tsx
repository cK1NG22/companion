import { PageBody, PageHeader } from "@/components/shell/page-header";
import { PlanningFlow } from "@/components/weekly-planning/planning-flow";
import { getFunnel } from "@/lib/data/goals";
import { getKeyIndicators } from "@/lib/data/home";
import { formatWeekLabel, resolveAnchor, shiftWeeks, weekStart } from "@/lib/week";

export default async function WeeklyPlanningPage(props: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await props.searchParams;
  const anchor = resolveAnchor(w);

  const [lastWeek, thisWeek, funnel] = await Promise.all([
    getKeyIndicators(shiftWeeks(anchor, -1)),
    getKeyIndicators(anchor),
    getFunnel(),
  ]);

  return (
    <>
      <PageHeader
        title="Weekly planning"
        subtitle="Review last week · set this week · time-block it"
      />
      <PageBody>
        <PlanningFlow
          lastWeek={lastWeek}
          thisWeek={thisWeek}
          monthPlans={funnel.month}
          weekLabel={formatWeekLabel(weekStart(anchor))}
        />
      </PageBody>
    </>
  );
}
