import { expect, test } from "@playwright/test";

/**
 * B12 — an icon's label describes the picture, never a meaning (PRD §4.0).
 * Goals are the user's own, so "heart" cannot be announced as "Family".
 *
 * Read-only: the picker is opened and inspected, nothing is picked, so this
 * spec leaves the shared mock store untouched.
 */

/** In ICON_KEYS order, which is the order the grid renders. */
const PICTURE_LABELS = [
  "Book",
  "Dumbbell",
  "Laptop",
  "Phone",
  "Heart",
  "Temple",
  "Moon",
  "Target",
];

test("icon picker names each icon by its picture", async ({ page }) => {
  await page.goto("/goals");
  await page.getByRole("button", { name: "Edit goals" }).click();
  await page.getByRole("button", { name: "Change icon" }).first().click();

  const options = page.getByRole("dialog").getByRole("button");
  await expect(options).toHaveCount(PICTURE_LABELS.length);

  const names = await options.evaluateAll((buttons) =>
    buttons.map((b) => b.getAttribute("aria-label")),
  );
  expect(names).toEqual(PICTURE_LABELS);

  const titles = await options.evaluateAll((buttons) =>
    buttons.map((b) => b.getAttribute("title")),
  );
  expect(titles).toEqual(PICTURE_LABELS);
});
