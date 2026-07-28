import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Goals" subtitle="Goals → Plans → Inputs" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B2.
        </p>
      </PageBody>
    </>
  );
}
