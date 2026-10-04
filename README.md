# Companion

A personal calendar, scheduler, and goal-tracking app modelled on the
Preach My Gospel planner. Runs the whole week as **Goal → Plan → Act → Account**,
with people (not tasks) as a first-class unit of progress.

Single user. Spec of record: [`PRD.md`](./PRD.md) · Phase plan:
[`BUILD-PLAN.md`](./BUILD-PLAN.md) · Visual reference: `mockup.html`.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are needed yet — every screen runs on mock fixtures.

```bash
npm run build        # production build
npm run lint
npm run typecheck
npm test             # pure logic: week math, open windows, rollups, strength model, geo, formatting
```

## How it's put together

```
app/                 one route per screen; Server Components by default
components/ui/       shadcn/ui — GENERATED, never hand-edited
components/<screen>/ that screen's own pieces
lib/data/            ★ the seam — typed async functions the screens call
lib/actions/         Server Actions — validate with zod, call lib/data/, revalidate
lib/mock/            fixtures behind the seam; deleted when the DB lands
lib/*.ts             pure math (week, windows, rollup, strength, geo, format) — unit-tested
```

**The seam is the whole design.** Screens import `lib/data/*` and never learn
whether the answer came from a fixture or Postgres. Swapping in the database
replaces those function *bodies*; signatures and types don't move, so no screen
gets rewritten.

Pure business math lives in `lib/*.ts` as plain functions, not inside
components, which is why it can be tested without a browser.

## Stack

Next 16 · React 19 · Tailwind 4 · shadcn/ui (**on Base UI, not Radix** — see
`AGENTS.md`) · FullCalendar 6 · dnd-kit · Recharts · date-fns · zod.

## Status

Parts A and B are done: all 11 routes render on mock data.
Part C — Neon/Drizzle, Google OAuth, Calendar sync, journal appends, the
iMessage agent, live Google Places, the Bumstead hand-off, and the feedback
runner — is not built yet; it needs credentials.

Conventions and protected paths: [`AGENTS.md`](./AGENTS.md).
