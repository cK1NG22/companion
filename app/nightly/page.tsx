import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Nightly Review" subtitle="Account for the day" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B5.
        </p>
      </PageBody>
    </>
  );
}
