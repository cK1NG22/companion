<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Companion — agent rules

Personal life-planning app for a single user (Carter). Spec of record: `PRD.md`.
Build plan: `BUILD-PLAN.md`. Visual reference: `mockup.html`.

## 🚫 Protected paths

**No agent edits anything below on its own initiative** — no refactoring,
reformatting, "improving", or deleting. If a problem appears to originate in one
of these, **report it, don't fix it in place.** Fix around the boundary instead:
a lint-ignore entry, a wrapper component, a CSS token.

Two different reasons a path is on this list, with two different escape hatches.
Don't collapse them.

**Machine-owned — nobody hand-edits these, ever:**

| Path | Why | The only legitimate way to change it |
|---|---|---|
| `components/ui/**`, `hooks/use-mobile.ts` | shadcn/ui generated. A hand-fix here is silently reverted by the next `shadcn add`, and the bug returns with no trace of why it was ever gone. | The shadcn CLI. Need different behaviour? Wrap it in `components/common/`. |
| `node_modules/**`, `package-lock.json` | Managed by npm. | npm. |
| `.next/**`, `next-env.d.ts` | Build output. | The build. |

**Carter-owned — his documents, not the codebase's:**

| Path | Why | Who may change it |
|---|---|---|
| `PRD.md` | Spec of record. It outranks any reviewer's opinion; if the code disagrees with it, the code is wrong. | Carter, or an agent **he explicitly asks**. Never on your own judgement. |
| `BUILD-PLAN.md` | Phase plan. Status and progress edits are *expected* as phases land — that's maintenance, not rewriting. | Same as above. |
| `mockup.html` | The prototype artifact. | Read-only to everyone. **Never delete this file under any circumstance** — no exception, no instruction, no cleanup pass. |

"Explicitly asks" means a direct instruction in the conversation — "update the
build plan", "mark phase B done". It does not mean inferring that an update would
be helpful, and it does not carry over to the next task.

## ⚠️ shadcn here is built on Base UI, NOT Radix

This project uses the `base-nova` shadcn style, which wraps `@base-ui/react`.
Most shadcn code you have seen elsewhere is Radix-based and **will not compile
here**. Do not "correct" the following back to Radix idioms — they are right:

| Radix idiom (wrong here) | Base UI idiom (correct here) |
|---|---|
| `<X asChild><Link/></X>` | `<X render={<Link href={...} />}>` — children stay outside |
| `<TooltipProvider delayDuration={n}>` | `<TooltipProvider delay={n}>` |
| `<ToggleGroup type="single" value={s} onValueChange={(s)=>…}>` | `value={[s]}` / `onValueChange={(arr)=>…}` — array-valued even in single-select |

When an API is uncertain, read the generated file in `components/ui/` and the
types in `node_modules/@base-ui/react/` — do not assume Radix.

## Architecture rules

1. **`lib/data/` is the seam.** Screens import typed async functions from there and
   never know whether the data is mock or live. Never call the database or `fetch`
   directly from a screen component.
2. **Never let the same fact be edited in two places.** The calendar is the only place
   *time* is entered. (One sanctioned exception: a checked-off to-do increments a
   `count` key-indicator — PRD §4.1a.)
3. **Files that change together live together.** A screen's private components go in
   `components/<screen>/`, not in a shared bucket.
4. Pure math (week rollups, 1RM, fatigue, distance) lives in `lib/*.ts` as plain
   functions with Vitest tests. Business math does not live inside components.
5. **Server Actions live in `lib/actions/`,** one file per domain. Each is a
   `"use server"` wrapper that validates input with zod, calls `lib/data/`, and
   revalidates the affected paths.

## Product invariants (do not "helpfully" change these)

- **The week runs Monday → Sunday.** Everywhere. `date-fns` `{ weekStartsOn: 1 }`.
- **Key-indicator units are exactly two: `hours` and `count`.** `days` is `count`.
  Do not add `tally` or `value`.
- **Single user.** No accounts system, no roles, no multi-tenancy.
- **Palette is fixed:** white / near-black navy-biased ink / navy accent / one muted
  clay for "behind, overdue, now". No neon, no new accent colors.
- **Georgia serif is reserved** for devotional and journal text only.
- **$0 budget.** Free tiers only. No paid API called without a hard quota cap.
- **Privacy:** the iMessage agent reads handle + timestamp only. It must never select
  the `text` column. No message content is stored, transmitted, or sent to a model.

## Code style

- TypeScript strict. No `any` — use `unknown` and narrow.
- Server Components by default; add `"use client"` only where interaction demands it.
- Prefer Server Actions + `useOptimistic` over client-side data fetching.
- Don't add a dependency for what a few lines of code do. Don't add an abstraction
  with one implementation. Delete rather than comment out.

## Commands

```bash
npm run dev          # dev server (turbopack)
npm run build        # production build — must pass before any phase is "done"
npm run check        # the fast gates in one go: typecheck, lint, format:check, arch, knip, test
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write (format:check is the gate)
npm run arch         # dependency-cruiser — the lib/data seam, see below
npm run knip         # unused files and dependencies
npm test             # vitest (pure logic only)
npm run test:e2e     # every Playwright spec: axe, HTML validity, behaviour
npm run test:a11y    # the axe specs only
npm run test:lh      # Lighthouse CI — accessibility must stay at 100
```

`.github/workflows/ci.yml` runs all of the above, plus `npm audit`, on every push
to `main` and every pull request.

## Architecture gate

`npm run arch` turns architecture rules 1 and 4 into a failing check
(`.dependency-cruiser.cjs`):

- Only `lib/data/` may import `lib/mock/` — and, from Part C, Drizzle or the
  Neon driver. A screen or a server action that reaches past the seam fails.
- `lib/*.ts` (the pure math) may not import data, actions, mock, React or Next.
- No circular imports.

`npm run knip` fails on unused files and unused dependencies. Unused *exports*
are reported as warnings only: `lib/data/` deliberately exports functions that
Part C will call. `components/ui/**` is excluded — it is machine-owned.

## Browser gates

Three borrowed conformance suites run against the rendered app, plus our own
behaviour tests. The borrowed suites test whether the HTML we emit obeys
published standards; none of them tests a business rule.

- **axe-core** (`e2e/a11y.spec.ts`, `e2e/a11y-open.spec.ts`) — scoped to
  **WCAG 2.0/2.1 A and AA**, in **light and dark**. Fails on any violation.
  - The route list lives in `e2e/routes.json`; **add new routes there** or they
    escape axe, the HTML check and Lighthouse together.
  - axe sees the page as painted, so anything closed on load is invisible to
    it. `a11y-open.spec.ts` opens each dialog, menu, popover and select and
    audits again. **Add an entry to its `OPENABLE` list whenever a screen gains
    something that opens** — otherwise it is unaudited.
- **html-validate** (`e2e/html.spec.ts`) — the server's HTML against the WHATWG
  standard (`html-validate:standard`). The common failure is block content
  inside a `<button>`: a button may hold phrasing content only, so no `<div>`,
  `<p>` or `Card` inside one. Use `<span className="block">`, or stretch the
  button over the card (see `key-indicator-tiles.tsx`).
- **Lighthouse** (`npm run test:lh`) — runs a wider axe rule set than the above
  (including best-practice rules like `heading-order` that carry no WCAG tag),
  so it can fail when the axe specs pass. Accessibility is a ratchet at 100.
  Light mode only.
- **Behaviour** (`e2e/behaviour.spec.ts`) — hand-written: Monday-first week,
  habit checks, to-dos, feedback, navigation. The mock store is one shared
  in-memory world and specs run in parallel, so **each test owns its data**: a
  week nobody else views, or a row with a unique name.

Still not covered by any gate, so check by hand:

1. **Drag interactions** — calendar drag-to-create and resize, Morning Review
   reordering.
2. **Phone layout.** Every spec runs at desktop width; `ResponsiveModal`'s
   drawer branch is never rendered.
3. **Lighthouse in dark mode.**

Heading levels: `PageHeader` owns the only `<h1>`. Card titles are `<h2>`,
anything nested under them `<h3>`. Skipping a level fails `test:lh`.

Never dim text with `opacity-*`. Opacity composites text toward the background —
nothing below roughly `opacity-90` can hold 4.5:1. Use `text-muted-foreground`.

Never put `text-white` on a token colour (`bg-good`, `bg-warm`). The tokens get
lighter in dark mode and white stops being readable; `text-background` flips
with them.
