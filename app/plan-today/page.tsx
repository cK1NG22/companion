import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Plan Today" subtitle="Turn intention into a scheduled day" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B4.
        </p>
      </PageBody>
    </>
  );
}
