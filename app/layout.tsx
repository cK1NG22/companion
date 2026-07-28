import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { FeedbackBubble } from "@/components/shell/feedback-bubble";
import { ThemeProvider } from "@/components/shell/theme";
import { isMorningDone } from "@/lib/data/rhythm";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Companion",
  description: "Goal · Plan · Act · Account — one week at a time.",
};

// Used on a phone as much as a laptop.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1117" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Every screen in this app is time-sensitive personal data — "today's
  // schedule", "this week", "days since contact". Without a request-time API
  // the routes prerender at BUILD time and freeze whatever date that was.
  // Marking the layout request-time makes the whole tree dynamic, which is
  // one line instead of the same call in ten pages. Nothing here is cacheable.
  await connection();
  const morningDone = await isMorningDone();
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        {/* suppressHydrationWarning above: next-themes writes the theme class
            onto <html> before React hydrates, which is an intentional mismatch. */}
        <ThemeProvider>
          <TooltipProvider delay={300}>
            <SidebarProvider>
              <AppSidebar morningDone={morningDone} />
              <SidebarInset className="min-w-0">{children}</SidebarInset>
              <FeedbackBubble />
            </SidebarProvider>
          </TooltipProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
