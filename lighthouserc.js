// Lighthouse CI — Google's audit suite run against every route.
// Shares e2e/routes.json with the axe specs so a new route can't slip past
// only one of the two audits.
const routes = require("./e2e/routes.json");

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready in",
      url: routes.map((r) => `http://127.0.0.1:3000${r}`),
      numberOfRuns: 1,
      settings: { preset: "desktop" },
    },
    assert: {
      assertions: {
        // Ratchet, not a floor: every route scores 100 today, so anything less
        // is a regression. Lighthouse runs a wider axe rule set than
        // `npm run test:a11y` (which is scoped to WCAG A/AA), so a failure here
        // that the axe suite missed is usually a best-practice rule like
        // heading-order.
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        // Warn, not error: these are mock-data pages on a dev machine, so the
        // numbers move with the laptop's mood. Watch the trend, don't gate.
        "categories:performance": ["warn", { minScore: 0.7 }],
        // Single user, no public pages, no crawler will ever see this.
        "categories:seo": "off",
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
