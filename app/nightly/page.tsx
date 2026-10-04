import { format } from "date-fns";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { NightlyReview } from "@/components/nightly/nightly-review";
import { getDayBlocks } from "@/lib/data/calendar";
import { getFunnel } from "@/lib/data/goals";
import { getNightlyEntry } from "@/lib/data/rhythm";
import type { IconKey } from "@/lib/types";

export default async function NightlyPage() {
  const today = new Date();
  const [entry, blocks, funnel] = await Promise.all([
    getNightlyEntry(today),
    getDayBlocks(today),
    getFunnel(),
  ]);

  const goalIcons: Record<string, IconKey | null> = Object.fromEntries(
    [...funnel.year, ...funnel.month, ...funnel.week].map((g) => [g.id, g.icon]),
  );

  return (
    <>
      <PageHeader
        title={`Nightly Review · ${format(today, "EEEE, MMMM d")}`}
        subtitle="Gratitude · what happened · repent · prepare · Top 3"
      />
      <PageBody>
        <NightlyReview entry={entry} blocks={blocks} goalIcons={goalIcons} />
      </PageBody>
    </>
  );
}
