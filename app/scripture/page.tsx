import { PageBody, PageHeader } from "@/components/shell/page-header";
import { ScriptureView } from "@/components/scripture/scripture-view";
import {
  getCarriedQuestions,
  getMonthlyStudyGoal,
  getReadings,
  getScriptureNotes,
} from "@/lib/data/rhythm";

export default async function ScripturePage() {
  const [notes, questions, readings, monthlyGoal] = await Promise.all([
    getScriptureNotes(),
    getCarriedQuestions(),
    getReadings(),
    getMonthlyStudyGoal(),
  ]);

  return (
    <>
      <PageHeader
        title="Scripture study"
        subtitle="Notes · questions carried · currently reading"
      />
      <PageBody>
        <ScriptureView
          notes={notes}
          questions={questions}
          readings={readings}
          monthlyGoal={monthlyGoal}
        />
      </PageBody>
    </>
  );
}
