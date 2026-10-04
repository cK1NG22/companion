import { defineConfig, devices } from "@playwright/test";

// PORT lets two checkouts test at once. Without it a second run finds the
// first one's server on 3000, reuses it, and silently tests the wrong build.
const PORT = process.env.PORT ?? "3000";
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    /**
     * Audit the production build, not `next dev`. The dev server injects its
     * own error-overlay markup and dev-only attributes, so a11y results from
     * it describe a page that never ships.
     */
    command: "npm run build && npm run start",
    env: { PORT },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
