import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Dates" subtitle="Try something new!" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B9.
        </p>
      </PageBody>
    </>
  );
}
