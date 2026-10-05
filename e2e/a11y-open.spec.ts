import { expect, test, type Page } from "@playwright/test";
import { expectNoViolations, gotoThemed, THEMES } from "./axe";

/**
 * Opened state. axe audits the page as painted, so a dialog, menu or popover
 * that is closed on load is never seen by a11y.spec.ts. Each entry opens one,
 * waits for it, and audits again.
 *
 * Add an entry whenever a screen gains something that opens.
 */
const OPENABLE: {
  name: string;
  route: string;
  open: (page: Page) => Promise<void>;
  /** ARIA role of the thing that appears. */
  role: "dialog" | "menu" | "listbox";
}[] = [
  {
    name: "feedback dialog",
    route: "/",
    open: (p) => p.getByRole("button", { name: "Send feedback" }).click(),
    role: "dialog",
  },
  {
    name: "key-indicator breakdown",
    route: "/",
    open: (p) =>
      p
        .getByRole("button", { name: /Open breakdown/ })
        .first()
        .click(),
    role: "dialog",
  },
  {
    name: "morning section menu",
    route: "/morning",
    open: (p) => p.getByRole("button", { name: "Section options" }).click(),
    role: "menu",
  },
  {
    name: "calendar view menu",
    route: "/calendar",
    open: (p) => p.getByRole("button", { name: "Week", exact: true }).click(),
    role: "menu",
  },
  {
    name: "calendar hours menu",
    route: "/calendar",
    open: (p) => p.getByRole("button", { name: "View settings" }).click(),
    role: "menu",
  },
  {
    name: "calendar block editor",
    route: "/calendar",
    open: (p) => p.locator(".fc-event").first().click(),
    role: "dialog",
  },
  {
    name: "cuisine select",
    route: "/dates",
    open: (p) => p.getByRole("combobox", { name: "Cuisine" }).click(),
    role: "listbox",
  },
  {
    name: "place detail",
    route: "/dates",
    open: (p) => p.locator("main ul > li > button").first().click(),
    role: "dialog",
  },
  {
    name: "goal icon picker",
    route: "/goals",
    open: async (p) => {
      await p.getByRole("button", { name: "Edit goals" }).click();
      await p.getByRole("button", { name: "Change icon" }).first().click();
    },
    role: "dialog",
  },
  {
    name: "lift select",
    route: "/gym",
    open: async (p) => {
      await p.getByRole("tab", { name: "Progress" }).click();
      await p.getByRole("combobox", { name: "Choose a lift" }).click();
    },
    role: "listbox",
  },
  {
    name: "add tag popover",
    route: "/people",
    open: (p) =>
      p
        .getByRole("button", { name: /^Add tag to / })
        .first()
        .click(),
    role: "dialog",
  },
];

for (const theme of THEMES) {
  for (const item of OPENABLE) {
    test(`a11y open ${theme} ${item.route} ${item.name}`, async ({ page }) => {
      await gotoThemed(page, item.route, theme);
      await item.open(page);
      await expect(page.getByRole(item.role).first()).toBeVisible();
      // Open animations fade in from transparent. Auditing mid-fade reports
      // contrast failures for colours that never settle on screen.
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => undefined)),
        ),
      );
      await expectNoViolations(page);
    });
  }
}
