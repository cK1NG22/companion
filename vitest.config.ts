import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /**
     * Pure logic only (AGENTS.md). Vitest's default glob would also sweep in
     * `e2e/a11y.spec.ts`, which needs a browser and a running server — it would
     * fail here for reasons that have nothing to do with the code under test.
     * Browser-driven specs run under Playwright via `npm run test:a11y`.
     */
    include: ["lib/**/*.test.ts"],
  },
});
