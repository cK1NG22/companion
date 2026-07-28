import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Scripture Study" subtitle="Notes, questions carried, currently reading" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B6.
        </p>
      </PageBody>
    </>
  );
}
