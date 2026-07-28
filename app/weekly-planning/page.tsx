import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Weekly Planning" subtitle="Review · Set · Time-block" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B4.
        </p>
      </PageBody>
    </>
  );
}
