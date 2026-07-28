import { PageBody, PageHeader } from "@/components/shell/page-header";
import { GoalFunnel } from "@/components/goals/goal-funnel";
import { OutreachCard } from "@/components/goals/outreach-card";
import { TodoList } from "@/components/goals/todo-list";
import { getFunnel } from "@/lib/data/goals";
import { getGoingStale } from "@/lib/data/people";
import { getTodos } from "@/lib/data/todos";

export default async function GoalsPage() {
  const [funnel, todos, stale] = await Promise.all([
    getFunnel(),
    getTodos(),
    getGoingStale(),
  ]);

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="Goals → Plans → Inputs · every week ladders to a month, every month to a year"
      />
      <PageBody>
        <div className="grid gap-5">
          <GoalFunnel
            goals={{
              year: funnel.year,
              month: funnel.month,
              week: funnel.week,
            }}
            parentTitles={funnel.parentTitles}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <TodoList todos={todos} />
            <OutreachCard people={stale} />
          </div>
        </div>
      </PageBody>
    </>
  );
}
