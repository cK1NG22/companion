import { expect, test } from "@playwright/test";

/**
 * Behaviour: does the app do what PRD.md says when you use it? These are our
 * own rules — no borrowed suite can test them.
 *
 * The mock store is one shared in-memory world for the whole server process,
 * and tests run in parallel. So every test here owns its data: a week nobody
 * else looks at, or a row with a name nobody else uses.
 */

test("week runs Monday to Sunday", async ({ page }) => {
  await page.goto("/");
  const days = page.locator("thead th[scope=col]");
  await expect(days).toHaveText([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);
});

test("week stepper moves the URL one week at a time, Monday-anchored", async ({
  page,
}) => {
  await page.goto("/?w=2024-01-03"); // a Wednesday
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page).toHaveURL(/w=2024-01-08/); // the following Monday
  await page.getByRole("button", { name: "Previous week" }).click();
  await expect(page).toHaveURL(/w=2024-01-01/);
});

test("a habit check survives a reload and stays in its own week", async ({
  page,
}) => {
  // A week no other test or fixture touches, so it starts empty.
  await page.goto("/?w=2019-03-04");
  const cell = page.locator("tbody button[aria-pressed]").first();
  await expect(cell).toHaveAttribute("aria-pressed", "false");

  await cell.click();
  await expect(cell).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(cell).toHaveAttribute("aria-pressed", "true");

  // The neighbouring week must not have inherited the check.
  await page.goto("/?w=2019-03-11");
  await expect(cell).toHaveAttribute("aria-pressed", "false");

  // Leave the week as it was found.
  await page.goto("/?w=2019-03-04");
  await cell.click();
  await expect(cell).toHaveAttribute("aria-pressed", "false");
});

test("a to-do can be added, checked off and deleted", async ({ page }) => {
  const name = `e2e to-do ${Date.now()}`;
  await page.goto("/goals");

  await page.getByPlaceholder("New to-do…").fill(name);
  await page.getByRole("button", { name: "Add to-do" }).click();

  const box = page.getByRole("checkbox", { name });
  await expect(box).toBeVisible();
  await expect(box).not.toBeChecked();

  await box.click();
  await expect(box).toBeChecked();
  await page.reload();
  await expect(box).toBeChecked();

  await page.getByRole("button", { name: `Delete ${name}` }).click();
  await expect(box).toHaveCount(0);
  await page.reload();
  await expect(box).toHaveCount(0);
});

test("a to-do with no name is refused", async ({ page }) => {
  await page.goto("/goals");
  await page.getByPlaceholder("New to-do…").fill("   ");
  await expect(page.getByRole("button", { name: "Add to-do" })).toBeDisabled();
});

test("feedback is queued and the dialog closes", async ({ page }) => {
  await page.goto("/calendar");
  await page.getByRole("button", { name: "Send feedback" }).click();
  const dialog = page.getByRole("dialog");

  const send = dialog.getByRole("button", { name: "Send" });
  await expect(send).toBeDisabled();

  await dialog.getByRole("textbox").fill("e2e: make past events fade more");
  await send.click();

  await expect(page.getByText("Queued for the runner.")).toBeVisible();
  await expect(dialog).toBeHidden();
});

test("the sidebar reaches every route", async ({ page }) => {
  await page.goto("/");
  for (const [label, path] of [
    ["Calendar", "/calendar"],
    ["Goals", "/goals"],
    ["People", "/people"],
    ["Gym", "/gym"],
  ] as const) {
    await page.getByRole("link", { name: label, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
