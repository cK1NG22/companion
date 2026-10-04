import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import ROUTES from "./routes.json";

/**
 * WCAG 2.0 and 2.1, levels A and AA — the conformance bar most accessibility
 * law references. Level AAA is deliberately excluded: it mandates a 7:1
 * contrast ratio, which the fixed navy/clay palette (AGENTS.md) cannot meet
 * without changing the palette.
 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type Violation = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

/**
 * axe reports one entry per broken rule with every offending node under it.
 * Vitest/Playwright would otherwise print the raw object, which buries the
 * CSS selector you actually need in ~40 lines of metadata.
 */
function summarize(violations: Violation[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => {
          // failureSummary is the only place axe puts the concrete numbers —
          // which colors, what ratio, what was expected. Without it you get a
          // selector and have to re-derive the reason by hand.
          const why = (n.failureSummary ?? "")
            .split("\n")
            .slice(1)
            .map((l) => `        ${l.trim()}`)
            .join("\n");
          return `      ${n.target.join(" ")}\n${why}`;
        })
        .join("\n");
      return `\n  [${v.impact ?? "unknown"}] ${v.id} — ${v.help}\n${nodes}\n      ${v.helpUrl}`;
    })
    .join("");
}

for (const route of ROUTES) {
  test(`a11y ${route}`, async ({ page }) => {
    await page.goto(route);
    // Every route renders inside SidebarInset, which is a <main>. Waiting on it
    // means axe sees hydrated client components, not the server shell.
    await page.locator("main").first().waitFor({ state: "visible" });

    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    // Assert on rule IDs, not the raw objects: each violation carries ~40
    // lines of metadata, and a deep-equal diff of that buries the one thing
    // you need. The selectors live in the failure message instead.
    expect(violations.map((v) => v.id), summarize(violations)).toEqual([]);
  });
}
