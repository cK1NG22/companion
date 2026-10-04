import { PageBody } from "@/components/shell/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// No <h1> here on purpose: the page that replaces this fallback brings its own
// PageHeader. The bar below only holds the header's height so nothing jumps.
export default function RootLoading() {
  return (
    <div role="status">
      <span className="sr-only">Loading…</span>
      <div
        aria-hidden="true"
        className="flex min-h-14 items-center border-b px-4 py-2.5 sm:px-6"
      >
        <Skeleton className="h-4 w-32" />
      </div>
      <PageBody>
        <div aria-hidden="true" className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </PageBody>
    </div>
  );
}
