"use client";

import { useEffect } from "react";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader title="Something went wrong" />
      <PageBody>
        <div className="grid max-w-md gap-3">
          <h2 className="text-sm font-semibold tracking-tight">
            This screen couldn&apos;t load
          </h2>
          <p className="text-sm text-muted-foreground">
            Nothing was lost. Try again, or pick another screen from the
            sidebar.
          </p>
          <div>
            <Button variant="outline" onClick={() => unstable_retry()}>
              Try again
            </Button>
          </div>
        </div>
      </PageBody>
    </>
  );
}
