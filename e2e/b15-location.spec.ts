import { expect, test, type Page } from "@playwright/test";

/**
 * B15 — the Date planner's proximity bar (PRD §4.12): Home or the device's
 * current location, and a radius in miles.
 *
 * Every test here only reads. Searching changes nothing in the shared mock
 * store, so these cannot collide with another spec.
 */

// The fixture "Sundance ski lift ride" sits here: 0 mi away from this fake
// position, and about 12 mi from the fixture home.
const SUNDANCE = { latitude: 40.3934, longitude: -111.5786 };

const list = (page: Page) => page.locator("main ul");
const row = (page: Page, name: string) =>
  list(page).getByRole("button", { name: new RegExp(name) });

async function chooseRadius(page: Page, option: string) {
  await page.getByRole("combobox", { name: "Radius" }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function useCurrentLocation(page: Page) {
  await page
    .getByRole("button", { name: "Current location", exact: true })
    .click();
}

/** Replace the browser's geolocation with one that fails with `code`. */
async function failGeolocation(page: Page, code: 2 | 3) {
  await page.addInitScript((errorCode) => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _ok: PositionCallback,
          fail?: PositionErrorCallback,
        ) =>
          fail?.({
            code: errorCode,
            message: "",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          }),
      },
    });
  }, code);
}

async function expectFellBackToHome(page: Page, message: RegExp) {
  await expect(page.locator("main").getByRole("alert")).toHaveText(message);
  await expect(
    page.getByRole("button", { name: "Home", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  // Still the home-centred list: Communal is a few blocks from home.
  await expect(row(page, "Communal")).toContainText("0.1 mi");
}

test("granted: the lists are measured from the current location", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(SUNDANCE);
  await page.goto("/dates");
  await page.getByRole("button", { name: "Activity", exact: true }).click();

  const sundance = row(page, "Sundance ski lift ride");
  await expect(sundance).not.toContainText("0.0 mi");

  await useCurrentLocation(page);
  await expect(sundance).toContainText("0.0 mi");
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);

  // Back to Home restores the home-centred distances.
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(sundance).not.toContainText("0.0 mi");
});

test("granted: the radius applies to the current location too", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(SUNDANCE);
  await page.goto("/dates");
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await useCurrentLocation(page);
  await expect(row(page, "Sundance ski lift ride")).toContainText("0.0 mi");

  await chooseRadius(page, "Within 2 mi");
  await expect(row(page, "Sundance ski lift ride")).toBeVisible();
  // In Provo, a dozen miles from the fake position.
  await expect(row(page, "Escape Room Provo")).toHaveCount(0);
});

test("granted: coordinates are not kept in the URL, a cookie or storage", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(SUNDANCE);
  await page.goto("/dates");
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await useCurrentLocation(page);
  await expect(row(page, "Sundance ski lift ride")).toContainText("0.0 mi");

  const kept = await page.evaluate(() =>
    JSON.stringify([
      location.href,
      document.cookie,
      { ...localStorage },
      { ...sessionStorage },
    ]),
  );
  const cookies = JSON.stringify(await context.cookies());
  for (const fragment of ["40.39", "111.57"]) {
    expect(kept).not.toContain(fragment);
    expect(cookies).not.toContain(fragment);
  }
});

test("denied: a clear message, and the list falls back to Home", async ({
  page,
}) => {
  // No permission granted: the browser refuses the request.
  await page.goto("/dates");
  await useCurrentLocation(page);
  await expectFellBackToHome(page, /permission was denied/i);
});

test("position unavailable: a clear message, and the list falls back to Home", async ({
  page,
}) => {
  await failGeolocation(page, 2);
  await page.goto("/dates");
  await useCurrentLocation(page);
  await expectFellBackToHome(page, /could not be determined/i);
});

test("timeout: a clear message, and the list falls back to Home", async ({
  page,
}) => {
  await failGeolocation(page, 3);
  await page.goto("/dates");
  await useCurrentLocation(page);
  await expectFellBackToHome(page, /timed out/i);
});

test("no geolocation API: a clear message, and the list falls back to Home", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/dates");
  await useCurrentLocation(page);
  await expectFellBackToHome(page, /cannot share its location/i);
});

test("the radius narrows the food list", async ({ page }) => {
  await page.goto("/dates");
  // Default radius: both the downtown place and the one in Orem are listed.
  await expect(row(page, "Communal")).toBeVisible();
  await expect(row(page, "Pizzeria Seven Twelve")).toBeVisible();

  await chooseRadius(page, "Within 2 mi");
  await expect(row(page, "Pizzeria Seven Twelve")).toHaveCount(0);
  await expect(row(page, "Communal")).toBeVisible();

  // Choosing the default again brings the wider list back.
  await chooseRadius(page, "Default radius");
  await expect(row(page, "Pizzeria Seven Twelve")).toBeVisible();
});

test("the radius narrows the activity list", async ({ page }) => {
  await page.goto("/dates");
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(row(page, "The Quarry climbing gym")).toBeVisible();

  await chooseRadius(page, "Within 2 mi");
  await expect(row(page, "The Quarry climbing gym")).toHaveCount(0);
  await expect(row(page, "Escape Room Provo")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Failures after the click. Each must end with a message, the bar usable, and
// the anchor shown matching the list shown.
// ---------------------------------------------------------------------------

/** Server actions POST to the page's own URL; drop them at the network. */
async function failActions(page: Page) {
  await page.route("**/dates", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
}

async function expectBarEnabled(page: Page) {
  await expect(page.getByText("Finding your location…")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Home", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Current location", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("combobox", { name: "Radius" })).toBeEnabled();
}

test("search fails after a granted fix: message, bar usable, back on Home", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(SUNDANCE);
  await page.goto("/dates");
  await failActions(page);

  await useCurrentLocation(page);
  await expectFellBackToHome(page, /could not be completed/i);
  await expectBarEnabled(page);
});

test("geolocation never answers: message, bar usable, back on Home", async ({
  page,
}) => {
  // A dismissed permission prompt can call neither callback, and the API's
  // own `timeout` option does not cover the prompt.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: () => undefined },
    });
  });
  await page.clock.install();
  await page.goto("/dates");

  await useCurrentLocation(page);
  await expect(page.getByText("Finding your location…")).toBeVisible();

  // Fake time, so the test does not wait out the real watchdog.
  await page.clock.fastForward(60_000);
  await expectFellBackToHome(page, /timed out/i);
  await expectBarEnabled(page);
});

test("radius search fails: message, and the select goes back to what the list shows", async ({
  page,
}) => {
  await page.goto("/dates");
  await failActions(page);

  await chooseRadius(page, "Within 2 mi");
  await expect(page.locator("main").getByRole("alert")).toHaveText(
    /could not be completed/i,
  );
  await expect(page.getByRole("combobox", { name: "Radius" })).toHaveText(
    /Default \(15 mi\)/,
  );
  // Outside 2 mi, so it is only here if the list is still the default one.
  await expect(row(page, "Pizzeria Seven Twelve")).toBeVisible();
  await expectBarEnabled(page);
});

test("going back to Home fails: message, and the anchor stays on the list shown", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(SUNDANCE);
  await page.goto("/dates");
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  // A chosen radius, so that returning to Home needs the server.
  await chooseRadius(page, "Within 50 mi");
  await useCurrentLocation(page);
  await expect(row(page, "Sundance ski lift ride")).toContainText("0.0 mi");

  await failActions(page);
  await page.getByRole("button", { name: "Home", exact: true }).click();

  await expect(page.locator("main").getByRole("alert")).toHaveText(
    /could not be completed/i,
  );
  await expect(
    page.getByRole("button", { name: "Current location", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(row(page, "Sundance ski lift ride")).toContainText("0.0 mi");
  await expectBarEnabled(page);
});

// The dice roll and the cross-over take coordinates too; their schemas reject
// unknown keys, so prove the keys the screen really sends still pass.

test("dice roll works from the current location", async ({ context, page }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(SUNDANCE);
  await page.goto("/dates");
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await useCurrentLocation(page);
  await expect(row(page, "Sundance ski lift ride")).toContainText("0.0 mi");

  await page.getByRole("button", { name: "Dice roll" }).click();
  const card = page.getByRole("heading", { name: "Try something new" });
  await expect(card).toBeVisible();
  // A re-roll sends the previous picks' ids as well.
  await page.getByRole("button", { name: /re-?roll/i }).click();
  await expect(card).toBeVisible();
});

test("explore near a place still returns the other type", async ({ page }) => {
  await page.goto("/dates");
  await row(page, "Communal").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Explore activities near Communal/ })
    .click();
  await expect(page.getByText("Activities near")).toBeVisible();
  await expect(row(page, "Escape Room Provo")).toBeVisible();
});
