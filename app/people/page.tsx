import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="People" subtitle="Sorted by days since last contact" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B7.
        </p>
      </PageBody>
    </>
  );
}
