import { PageBody, PageHeader } from "@/components/shell/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Morning Review" subtitle="A reading, not a checklist" />
      <PageBody>
        <p className="text-sm text-muted-foreground">
          Built in phase B5.
        </p>
      </PageBody>
    </>
  );
}
