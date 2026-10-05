import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * B14 — tags on people (PRD §4.4).
 *
 * The mock store is one shared in-memory world and specs run in parallel, so
 * every test makes its own tag with a name nobody else uses and asserts only
 * on that tag. People are shared fixtures; other tests may add tags to them.
 */

const unique = (label: string) =>
  `${label} ${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

const row = (scope: Page | Locator, person: string) =>
  scope.getByRole("listitem").filter({ hasText: person });

async function createTag(page: Page, person: string, name: string) {
  await page.getByRole("button", { name: `Add tag to ${person}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "New tag name" }).fill(name);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).toBeHidden();
}

test("a new tag can be created on a person, survives a reload, and can be removed", async ({
  page,
}) => {
  const tag = unique("e2e made");
  await page.goto("/people");

  await createTag(page, "Ben Okafor", `  ${tag}  `);
  const chip = row(page, "Ben Okafor").getByText(tag, { exact: true });
  await expect(chip).toBeVisible();

  await page.reload();
  await expect(chip).toBeVisible();

  await page
    .getByRole("button", { name: `Remove tag ${tag} from Ben Okafor` })
    .click();
  await expect(chip).toHaveCount(0);
  await page.reload();
  await expect(chip).toHaveCount(0);
});

test("an existing tag can be picked for a second person", async ({ page }) => {
  const tag = unique("e2e pick");
  await page.goto("/people");
  await createTag(page, "Maya Lindqvist", tag);

  await page.getByRole("button", { name: "Add tag to Eric King" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: tag, exact: true }).click();
  await expect(dialog).toBeHidden();

  await expect(
    row(page, "Eric King").getByText(tag, { exact: true }),
  ).toBeVisible();

  // Already on Maya, so it is no longer offered to her.
  await page.getByRole("button", { name: "Add tag to Maya Lindqvist" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: tag, exact: true }),
  ).toHaveCount(0);
});

test("a name that differs only by case reuses the existing tag", async ({
  page,
}) => {
  const tag = unique("E2E Case");
  await page.goto("/people");
  await createTag(page, "Daniel Okonkwo", tag);
  await createTag(page, "Priya Raman", tag.toLowerCase());

  // Priya gets the tag as first spelled, and the filter bar lists it once.
  await expect(
    row(page, "Priya Raman").getByText(tag, { exact: true }),
  ).toBeVisible();
  const filters = page.getByRole("group", { name: "Filter by tag" });
  await expect(
    filters.getByRole("button", { name: tag, exact: true }),
  ).toHaveCount(1);
  await expect(
    filters.getByRole("button", { name: tag.toLowerCase(), exact: true }),
  ).toHaveCount(0);
});

test("a tag with no name is refused", async ({ page }) => {
  await page.goto("/people");
  await page.getByRole("button", { name: "Add tag to Adam Reyes" }).click();
  const dialog = page.getByRole("dialog");
  const create = dialog.getByRole("button", { name: "Create" });
  await expect(create).toBeDisabled();
  await dialog.getByRole("textbox", { name: "New tag name" }).fill("   ");
  await expect(create).toBeDisabled();
});

test("the list filters by tag and the filter can be cleared", async ({
  page,
}) => {
  const tag = unique("e2e filter");
  await page.goto("/people");
  await createTag(page, "Grandma Ruth", tag);
  await createTag(page, "Sarah King", tag);

  const filters = page.getByRole("group", { name: "Filter by tag" });
  const chip = filters.getByRole("button", { name: tag, exact: true });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");

  // Only this test uses the tag, so exactly its two people remain — stalest
  // first, which is the order getPeople already gave them.
  const rows = page.locator("main").getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Grandma Ruth");
  await expect(rows.nth(1)).toContainText("Sarah King");

  await filters.getByRole("button", { name: "All", exact: true }).click();
  await expect(row(page, "Tomas Alvarez")).toBeVisible();
});

test("grouping by tag keeps stale-first order inside the group", async ({
  page,
}) => {
  const tag = unique("e2e group");
  await page.goto("/people");
  // Added freshest-first on purpose: the group must not follow insert order.
  await createTag(page, "Ben Okafor", tag);
  await createTag(page, "Tomas Alvarez", tag);

  const toggle = page.getByRole("button", { name: "Group by tag" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  const group = page.getByRole("region", { name: tag, exact: true });
  await expect(group.getByRole("heading", { level: 2 })).toHaveText(tag);
  const rows = group.getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Tomas Alvarez"); // 58 days
  await expect(rows.nth(1)).toContainText("Ben Okafor"); // 3 days
});
