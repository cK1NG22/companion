import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Calendar" subtitle="Blocks are the input surface" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B3.
        </p>
      </PageBody>
    </>
  );
}
