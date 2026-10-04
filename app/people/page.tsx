import { PageBody, PageHeader } from "@/components/shell/page-header";
import { PeopleList } from "@/components/people/people-list";
import { getLastSyncedAt, getPeople } from "@/lib/data/people";

export default async function PeoplePage() {
  const [people, allPeople, lastSyncedAt] = await Promise.all([
    // The default list hides excluded people...
    getPeople(false),
    // ...but search reaches everyone, so someone can be toggled back on.
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
        <PeopleList
          people={people}
          allPeople={allPeople}
          lastSyncedAt={lastSyncedAt}
        />
      </PageBody>
    </>
  );
}
