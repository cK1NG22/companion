/**
 * Architecture test for AGENTS.md rule 1: `lib/data/` is the seam.
 * Screens read through `lib/data/` and write through `lib/actions/`; they never
 * know whether the data is mock or live. Run: npm run arch
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "only-data-touches-the-store",
      comment:
        "lib/mock is reachable only from lib/data. Screens and actions importing it would break in Part C, when lib/mock is deleted.",
      severity: "error",
      from: { pathNot: "^lib/(data|mock)/" },
      to: { path: "^lib/mock/" },
    },
    {
      name: "only-data-touches-the-database",
      comment:
        "Drizzle and the Neon driver are imported by lib/data (and a future lib/db) only. Dormant until Part C installs them.",
      severity: "error",
      from: { pathNot: "^lib/(data|db)/" },
      to: { path: "node_modules/(drizzle-orm|@neondatabase|pg|postgres)/" },
    },
    {
      name: "pure-math-stays-pure",
      comment:
        "AGENTS.md rule 4: lib/*.ts is plain functions. It never reaches into data, actions, mock, or React.",
      severity: "error",
      from: { path: "^lib/[^/]+\\.ts$", pathNot: "\\.test\\.ts$" },
      to: {
        path: "^(lib/(data|actions|mock)/|app/|components/|node_modules/(react|next)/)",
      },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(\\.next|node_modules/\\.cache|\\.claude)/" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
