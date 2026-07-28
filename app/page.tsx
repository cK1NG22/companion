import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Home" subtitle="This week at a glance" />
      <PageBody>
        <p className="text-sm text-muted-foreground">Built in phase B1.</p>
      </PageBody>
    </>
  );
}
