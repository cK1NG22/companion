import { PageBody, PageHeader } from "@/components/shell/page-header";
import { DatesView } from "@/components/dates/dates-view";
import {
  CUISINE_OPTIONS,
  getActivityCategories,
  getHomeLocation,
  searchActivities,
  searchFood,
} from "@/lib/data/dates";
import { MAPS_EMBED_KEY } from "@/lib/geo";

export default async function DatesPage() {
  const home = await getHomeLocation();
  const [food, activities, categories] = await Promise.all([
    searchFood(home),
    searchActivities(home),
    getActivityCategories(),
  ]);

  return (
    <>
      <PageHeader title="Dates" subtitle="Try something new!" />
      <PageBody>
        <DatesView
          food={food}
          activities={activities}
          cuisines={CUISINE_OPTIONS}
          categories={categories}
          home={{ lat: home.lat, lng: home.lng }}
          // Public, referrer-restricted embed key. Absent in dev — the popup
          // degrades to a note rather than a broken iframe.
          mapsKey={MAPS_EMBED_KEY}
        />
      </PageBody>
    </>
  );
}
