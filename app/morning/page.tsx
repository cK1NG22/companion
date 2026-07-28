import { format } from "date-fns";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { MorningReview } from "@/components/morning/morning-review";
import { getMorningSections } from "@/lib/data/rhythm";

export default async function MorningPage() {
  const sections = await getMorningSections();
  return (
    <>
      <PageHeader
        title={`Morning Review · ${format(new Date(), "EEEE")}`}
        subtitle="A reading, not a checklist"
      />
      <PageBody>
        <MorningReview sections={sections} />
      </PageBody>
    </>
  );
}
