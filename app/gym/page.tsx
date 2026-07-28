import { PageBody, PageHeader } from "@/components/shell/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressView } from "@/components/gym/progress-view";
import { SessionLogger } from "@/components/gym/session-logger";
import {
  getFatigue,
  getOneRepMaxTrend,
  getTodaySession,
  getTrackedExercises,
} from "@/lib/data/gym";
import type { OneRepMaxPoint } from "@/lib/types";

export default async function GymPage() {
  const [session, fatigue, tracked] = await Promise.all([
    getTodaySession(),
    getFatigue(),
    getTrackedExercises(),
  ]);

  const trends: Record<string, OneRepMaxPoint[]> = Object.fromEntries(
    await Promise.all(
      tracked.map(async (e) => [e.id, await getOneRepMaxTrend(e.id)] as const),
    ),
  );

  return (
    <>
      <PageHeader
        title="Gym"
        subtitle="Bumstead suggests · you log the actuals"
      />
      <PageBody>
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Today&apos;s session</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-4">
            <SessionLogger session={session} />
          </TabsContent>
          <TabsContent value="progress" className="mt-4">
            <ProgressView
              exercises={tracked}
              trends={trends}
              fatigue={fatigue}
            />
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
