import { test } from "@playwright/test";
import { expectNoViolations, gotoThemed, THEMES } from "./axe";
import ROUTES from "./routes.json";

// Every route as first painted, in both themes. Opened dialogs, menus and
// popovers are audited in a11y-open.spec.ts.
for (const theme of THEMES) {
  for (const route of ROUTES) {
    test(`a11y ${theme} ${route}`, async ({ page }) => {
      await gotoThemed(page, route, theme);
      await expectNoViolations(page);
    });
  }
}
