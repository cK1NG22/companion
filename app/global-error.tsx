"use client";

import { useEffect } from "react";
// global-error replaces the root layout, so nothing the layout imports is
// loaded here — the stylesheet has to be pulled in again.
import "./globals.css";
import { ThemeProvider } from "@/components/shell/theme";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        {/* `metadata` exports are not supported in an error boundary. */}
        <title>Something went wrong · Companion</title>
        {/* Same provider as the layout, so the saved light/dark choice is
            applied to this <html> too. */}
        <ThemeProvider>
          <main className="mx-auto grid w-full max-w-md gap-3 px-4 py-10 sm:px-6">
            <h1 className="text-[15px] font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              Companion couldn&apos;t load. Nothing was lost. Try again.
            </p>
            <div>
              <Button variant="outline" onClick={() => unstable_retry()}>
                Try again
              </Button>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
