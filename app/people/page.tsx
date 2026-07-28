import { PageBody, PageHeader } from "@/components/shell/page-header";
import { PeopleList } from "@/components/people/people-list";
import { getLastSyncedAt, getPeople } from "@/lib/data/people";

export default async function PeoplePage() {
  // Include excluded people so they can be found and toggled back on.
  const [people, lastSyncedAt] = await Promise.all([
    getPeople(true),
    getLastSyncedAt(),
  ]);

  return (
    <>
      <PageHeader
        title="People"
        subtitle="Sorted by days since last contact — email, text, or meeting"
      />
      <PageBody>
        <PeopleList people={people} lastSyncedAt={lastSyncedAt} />
      </PageBody>
    </>
  );
}
