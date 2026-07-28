<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Companion — agent rules

Personal life-planning app for a single user (Carter). Spec of record: `PRD.md`.
Build plan: `BUILD-PLAN.md`. Visual reference: `mockup.html`.

## 🚫 DO NOT MODIFY — protected paths

These are pre-made or generated. **Reviewers and code-fixing agents must never edit,
refactor, reformat, "improve", or delete anything under these paths.** If a problem
appears to originate in one of them, report it — do not fix it in place.

| Path | Why protected |
|---|---|
| `components/ui/**` | shadcn/ui generated components. Wrap them; never hand-edit. Regenerate via the shadcn CLI if a change is genuinely needed. |
| `mockup.html` | The prototype artifact. **Never delete this file under any circumstance.** Read-only reference. |
| `PRD.md` | Spec of record. Read-only. |
| `BUILD-PLAN.md` | Phase plan. Read-only. |
| `node_modules/**`, `package-lock.json` | Managed by npm. |
| `.next/**`, `next-env.d.ts` | Build output / generated. |

If a shadcn component needs different behavior, create a wrapper in
`components/common/` — do not edit the generated file.

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
npm run lint         # eslint
npx tsc --noEmit     # typecheck
npm test             # vitest (pure logic only)
npm run test:a11y    # axe-core on all 11 routes (Playwright) — must be green
npm run test:lh      # Lighthouse CI — accessibility must stay at 100
```

## Accessibility gates

Two borrowed conformance suites run against the rendered app. Neither tests our
business rules; both test whether the HTML we emit obeys published standards.

- `npm run test:a11y` — axe-core, scoped to **WCAG 2.0/2.1 A and AA**. Fails on
  any violation. Route list lives in `e2e/routes.json`; **add new routes there**
  or they escape both audits.
- `npm run test:lh` — Lighthouse. Runs a wider axe rule set than the above
  (including best-practice rules like `heading-order` that carry no WCAG tag),
  so it can fail when `test:a11y` passes. Accessibility is a ratchet at 100.

Two things these gates do **not** cover, so check them by hand:

1. **Dark mode.** Both suites render light mode only. `--faint` was 3.91:1 in
   dark and no suite caught it.
2. **Interactive state.** Axe sees the page as first painted — dialogs, popovers,
   and menus are unopened and therefore unaudited.

Heading levels: `PageHeader` owns the only `<h1>`. Card titles are `<h2>`,
anything nested under them `<h3>`. Skipping a level fails `test:lh`.

Never dim text with `opacity-*`. Opacity composites text toward the background —
nothing below roughly `opacity-90` can hold 4.5:1. Use `text-muted-foreground`.
