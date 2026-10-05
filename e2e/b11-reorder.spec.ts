import { expect, test, type Locator } from "@playwright/test";

/**
 * B11 — goals can be reordered at every tier (PRD §4.0, §4.2).
 *
 * Pointer drag is not covered here; these drive the drag handle from the
 * keyboard (Space to pick up, arrows to move, Space to drop).
 *
 * The mock store is shared and specs run in parallel, so each test adds its
 * own two rows and asserts only on their order relative to each other.
 */
const TIERS = [
  { heading: "Goals", tier: "year" },
  { heading: "Plans", tier: "month" },
  { heading: "Inputs", tier: "week" },
] as const;

/** Row texts, top to bottom. Titles are plain text only outside edit mode. */
async function rowIndex(card: Locator, title: string): Promise<number> {
  const rows = await card.locator("li").allTextContents();
  return rows.findIndex((text) => text.includes(title));
}

for (const { heading, tier } of TIERS) {
  test(`${heading} (${tier}) reorder by keyboard and keep the order after a reload`, async ({
    page,
  }) => {
    // The clock alone collides when two workers start in the same millisecond.
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const first = `b11 ${tier} first ${stamp}`;
    const second = `b11 ${tier} second ${stamp}`;

    await page.goto("/goals");
    const card = page.locator("[data-slot=card]").filter({
      has: page.getByRole("heading", { name: heading, exact: true }),
    });
    const editToggle = page.getByRole("button", { name: "Edit goals" });
    const doneToggle = page.getByRole("button", { name: "Done", exact: true });

    await editToggle.click();
    for (const title of [first, second]) {
      await card.getByPlaceholder(/^New/).fill(title);
      await card.getByRole("button", { name: "Add", exact: true }).click();
      await expect(
        card.getByRole("button", { name: `Reorder ${title}` }),
      ).toBeVisible();
    }

    await doneToggle.click();
    expect(await rowIndex(card, first)).toBeGreaterThanOrEqual(0);
    expect(await rowIndex(card, first)).toBeLessThan(
      await rowIndex(card, second),
    );

    // Move the second row up until it sits above the first. Usually that is one
    // step; another test adding to this tier at the same moment can make it more.
    await editToggle.click();
    const labels = await card
      .getByRole("button", { name: /^Reorder / })
      .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
    const from = labels.indexOf(`Reorder ${second}`);
    const to = labels.indexOf(`Reorder ${first}`);
    expect(to).toBeGreaterThanOrEqual(0);
    expect(from).toBeGreaterThan(to);

    const status = card.getByRole("status");
    await card.getByRole("button", { name: `Reorder ${second}` }).focus();
    await page.keyboard.press("Space");
    // Picking up announces the row's own place straight away.
    await expect(status).toContainText(`moved to position ${from + 1} of`);
    for (let position = from; position > to; position--) {
      await page.keyboard.press("ArrowUp");
      await expect(status).toContainText(`moved to position ${position} of`);
    }
    await page.keyboard.press("Space");
    await expect(status).toContainText(
      `${second} dropped at position ${to + 1} of`,
    );
    await doneToggle.click();

    const secondIsFirst = async () =>
      (await rowIndex(card, second)) < (await rowIndex(card, first));
    await expect.poll(secondIsFirst).toBe(true);

    await page.reload();
    await expect(card.getByText(second)).toBeVisible();
    expect(await secondIsFirst()).toBe(true);
  });
}
