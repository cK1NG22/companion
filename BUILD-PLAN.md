# Companion — Build Plan

**Goal:** Ship the Companion app for real: React/Next.js, built UI-first screen by screen against a mock-data seam, then the backend swapped in behind it without rewriting any UI.

**Spec of record:** [`PRD.md`](./PRD.md) · **Visual reference:** [`mockup.html`](./mockup.html)
Created 2026-07-27 · Owner: Carter
**Status (2026-07-28): Parts A + B COMPLETE** — all 11 routes built on the mock seam,
47 tests, clean build/lint/typecheck, 10 review rounds, plus axe-core and
Lighthouse CI accessibility gates (both green on every route). Shipped in draft PR
[ck22coding/companion#1](https://github.com/ck22coding/companion/pull/1).
**Part C not started** — it needs Google/Neon credentials.
**Status (2026-10-04): Part B reopened.** The PRD gained a goal-agnostic direction
(§1.6, §4.0), People tags and an outreach mark (§4.4), and a Dates location
requirement (§4.12). That is new screen work — phases **B11–B15** below, none
started. Several are blocked on decisions the PRD marks `[NMT]`; §8 lists which.

---

## 0. How to read this

- **Part A** builds the empty house — shell, theme, routing, the data seam. No features.
- **Part B** builds each room — one screen per phase, fully clickable, running on fake data.
- **Part C** wires the plumbing — database, Google, agents. The UI never changes.
- **Part B, reopened (2026-10-04)** — phases B11–B15 add what the PRD gained after Part B shipped. Same rules as Part B: screens on the mock seam.

Each phase has a **Deliverable** (what exists when it's done) and a **Done when** (how we prove it). Step-level task detail is written **per phase, just before we build it** — writing 20 phases of step-by-step now would be guesswork, since each phase's details depend on what the last one taught us.

---

## 1. The one architectural decision that matters

Everything else follows from this.

```
app/(screens)/home/page.tsx  ──imports──▶  lib/data/home.ts  ──▶  [ MOCK ] Part B
                                                             ──▶  [ NEON ] Part C
```

`lib/data/` is a folder of plain typed async functions:

```ts
// lib/data/home.ts
export async function getKeyIndicators(weekStart: Date): Promise<KeyIndicator[]>
export async function getHabitGrid(weekStart: Date): Promise<HabitGrid>
export async function toggleHabit(habitId: string, date: Date): Promise<void>
```

In Part B these return hand-written fixtures. In Part C the **bodies** are replaced with Drizzle queries. **Signatures and types never change**, so not one line of screen code gets rewritten. Types live in `lib/types.ts` and are derived from PRD §3 (the data model), written **once, up front, in Phase A2** — before any screen.

**Why this is worth the small ceremony:** it's the difference between "build the UI first" being a real strategy and it being throwaway work.

---

## 2. Stack

| Layer | Choice | Why this, not the alternative |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Per PRD §2. One deploy target, server + client in one repo. |
| Styling | **Tailwind CSS** | shadcn's substrate. The mockup's CSS vars become Tailwind theme tokens verbatim. |
| Components | **shadcn/ui** (on Radix UI) | Copy-paste components you *own* — not a dependency that fights the design. Themed by CSS variables, which the mockup already is. MUI/Mantine/Chakra rejected: their opinionated look would throw the mockup away. |
| Icons | **lucide-react** | The mockup's inline SVGs are already lucide-shaped (24 viewBox, stroke 1.8). Every goal icon exists: `BookOpen`, `Dumbbell`, `Laptop`, `Phone`, `Heart`, `Church`, `Moon`, `Target`. |
| Calendar | **FullCalendar** (`react` + `timegrid` + `interaction`) | MIT (Standard bundle; only Premium/timeline costs money). Ships *every* PRD §4.3 requirement as a config flag — see §4 below. Rejected: `react-big-calendar` (dated, styling pain), Schedule-X (younger, thinner ecosystem), custom build (weeks of work for a solved problem). |
| Drag & drop | **dnd-kit** | Morning Review section reordering. `react-beautiful-dnd` is deprecated. |
| Charts | **Recharts**, via shadcn's `chart` component | Gym trends. Already inside the shadcn family — themed by the same CSS vars, no second design language. |
| Forms | **react-hook-form + zod**, via shadcn `form` | Validation at the trust boundary, one schema shared client↔server. |
| Dates | **date-fns** | `weekStartsOn: 1` gives Monday-first everywhere (PRD §4.10) for free. |
| Toasts | **sonner** | shadcn default. "Synced 2h ago", "Hours logged". |
| Theme | **next-themes** | The mockup's `data-theme` light/dark toggle, as-is. |
| Server state | **React Server Components + Server Actions + `useOptimistic`** | No TanStack Query in v1. Habit toggles and to-do checks get instant feedback from `useOptimistic`; week-stepping is a URL param. *Add TanStack Query only if the Calendar's drag interactions prove it necessary.* |
| Database | **Neon Postgres + Drizzle ORM** (`@neondatabase/serverless`) | Per PRD §2. Drizzle over Prisma: lighter cold starts on serverless, SQL-shaped, no binary engine. |
| Auth | **Auth.js (NextAuth v5)**, Google provider | One consent for Calendar/Gmail/Contacts/Docs. Single-user = an email allowlist check, no accounts system. |
| Google APIs | **`googleapis`** | Official SDK. |
| Maps | **Google Maps Embed API** (`<iframe>`) | Free and unlimited per PRD §5. Deliberately *not* a JS map library — the embed is the $0 path. |
| Tests | **Vitest** for pure logic; **`/browse`** for clicking screens | Test the math (week rollups, 1RM, fatigue, distance sort), not the markup. |

**No versions are pinned here on purpose** — let the CLIs install current at kickoff (`npx create-next-app@latest`, `npx shadcn@latest init`).

---

## 3. Component inventory — what comes from a library vs. what we write

This is the core of "don't build what already exists." **~90% of the UI is installed, not authored.**

### From shadcn/ui (install with `npx shadcn@latest add <name>`)

`sidebar` · `card` · `button` · `badge` · `input` · `textarea` · `label` · `checkbox` · `switch` · `select` · `dialog` · `drawer` · `alert-dialog` · `popover` · `dropdown-menu` · `tabs` · `toggle-group` · `separator` · `progress` · `avatar` · `command` · `chart` · `table` · `carousel` · `skeleton` · `tooltip` · `scroll-area` · `sonner` · `form`

### What we actually write by hand (the short list)

| Component | Why no library covers it | Rough size |
|---|---|---|
| `TriStateBar` | shadcn `Progress` renders **one** value; KI tiles need three (grey target → light planned → solid done). | ~15 lines |
| `HabitGrid` | A fixed Mon–Sun × N-rows grid of binary cells. CSS Grid + shadcn `Checkbox`. A table library is overkill. | ~60 lines |
| `GoalIcon` | Maps a goal's stored icon key → a lucide component. A lookup object. | ~10 lines |
| `ResponsiveModal` | Thin wrapper: shadcn `Dialog` on desktop, `Drawer` on phone. The app is phone-heavy; one wrapper beats duplicating every popup. | ~20 lines |
| `Stepper` | Weekly Planning's 3 steps. shadcn has no stepper. Controlled state + a dot row. | ~25 lines |
| `WeekStepper` | `‹ [week of Jul 13–19] ›` — two shadcn Buttons + date-fns. | ~20 lines |

That's it. Everything else is installed.

### Per-screen mapping

| Screen | Library components | Hand-written |
|---|---|---|
| **App shell** | `sidebar` (collapsible + built-in mobile sheet), `avatar`, `tooltip`, `sonner`, next-themes toggle | — |
| **Home** (§4.1) | `card`, `button`, `checkbox`, `dialog`/`drawer` (allocation pop-up), `badge` | `WeekStepper`, `TriStateBar`, `HabitGrid` |
| **Goals** (§4.2) | `card`, `badge` (A/B/C/D + ↑ parent chips), `popover` (**icon picker grid — exactly the decided UX**), `input`, `select` (parent link), `checkbox` (to-dos), `separator`, `button` | `GoalIcon` |
| **Calendar** (§4.3) | **FullCalendar timeGrid**, `dropdown-menu` ×2 (view picker + view settings), `dialog` (create/edit block), `select` (goal assign), `input` | `GoalIcon` on `eventContent` |
| **People** (§4.4) | `command` (contact search), `switch` (exclusion toggle), `avatar`, `badge` (overdue), `button`, `skeleton` | — |
| **Scripture** (§4.5) | `card`, `textarea` (serif), `progress` (reading progress — single value, correct here), `input`, `badge` | — |
| **Gym** (§4.6) | `tabs` (Today / Progress), `card`, `input` (wt × reps), `badge` (PR), `table`, **`chart`** (1RM trend, bodyweight, per-muscle fatigue) | 1RM + fatigue math (pure fns, unit-tested) |
| **Plan Today** (§4.7) | `card`, `button`, `checkbox`, `badge` | open-window derivation |
| **Morning Review** (§4.8) | `card`, `dropdown-menu` (⋮), **dnd-kit sortable** (reorder), `input`, `textarea`, `alert-dialog` (delete) | — |
| **Nightly Review** (§4.9) | `card`, `textarea` ×5, `input` (adjust durations), `button`, `alert-dialog` (confirm before Google Doc write) | — |
| **Weekly Planning** (§4.10) | `card`, `input`, `select`, `button` | `Stepper` |
| **Feedback bubble** (§4.11) | `button` (fixed), `dialog`, `toggle-group` (Improve app / Date idea), `textarea`, `badge` | — |
| **Dates** (§4.12) | `toggle-group` (Food/Activity), `select` ×4 (cuisine, price, category, radius), `dialog`/`drawer` (Maps-style popup), `carousel` (photo strip), `card` (Dice Roll), `checkbox` (pairing prompt), `badge` | Maps Embed `<iframe>`, distance sort |

**Explicitly not adding:** TanStack Table (the grids are fixed-shape), Framer Motion (Radix + `tailwindcss-animate` covers the transitions), Tiptap/rich text (a `textarea` is the right surface for journal + scripture notes), a maps JS SDK (the embed is free, the SDK is not).

---

## 4. Why FullCalendar closes §4.3 outright

Every Calendar requirement in the PRD maps to a config option — nothing custom:

| PRD §4.3 requirement | FullCalendar |
|---|---|
| Day / 3-day / Week views | `timeGridDay`, custom view `{type:'timeGrid', duration:{days:3}}`, `timeGridWeek` |
| Monday first | `firstDay: 1` |
| 24h vertically scrollable | `timeGrid` default; `expandRows` + container height |
| Visible hour window (6 AM–11 PM etc.) | `slotMinTime` / `slotMaxTime` — the settings dropdown just sets these |
| Now-line, muted clay, today only | `nowIndicator: true` + a CSS override to `--warm` |
| Past = grey | `eventClassNames` → add `.past` when `end < now` |
| `[event name] + [goal icon]`, no text labels | `eventContent` render hook returning our JSX |
| Blocks are the input (drag to create) | `selectable: true` + `select` callback → opens the create dialog |
| Drag / resize existing blocks | `editable: true` |

**Risk to watch:** FullCalendar ships its own CSS, which can fight Tailwind's preflight. Mitigation is a scoped stylesheet that remaps FullCalendar's own CSS variables to ours — budget half a day for it in Phase B3, not more.

---

## 5. File structure

```
companion/
├── PRD.md · mockup.html · BUILD-PLAN.md          (this file)
├── app/
│   ├── layout.tsx                                 shell: sidebar + theme + toaster
│   ├── (screens)/home|goals|calendar|people|
│   │   dates|scripture|gym|morning|nightly/page.tsx
│   ├── (flows)/plan-today|weekly-planning/page.tsx
│   └── api/                                       Part C only: google webhooks, agent endpoints
├── components/
│   ├── ui/                                        shadcn — generated, do not hand-edit
│   ├── shell/     sidebar-nav, theme-toggle, feedback-bubble
│   ├── common/    tri-state-bar, goal-icon, week-stepper, responsive-modal, stepper
│   └── <screen>/  one folder per screen, its own pieces
├── lib/
│   ├── types.ts                                   PRD §3 → TypeScript. Written once, Phase A2.
│   ├── data/                                      ★ THE SEAM — mock in Part B, Drizzle in Part C
│   ├── mock/                                      fixtures. Deleted at the end of Part C.
│   ├── week.ts   1RM.ts   fatigue.ts   distance.ts   pure math, unit-tested
│   └── db/        schema.ts, client.ts            Part C
└── agents/                                        Part C: launchd — imessage, feedback-runner
```

Rule: **files that change together live together.** A screen's components sit in `components/<screen>/`, not scattered by technical layer.

---

## Part A — Shell & foundations

### Phase A0 — Repo, scaffold, deploy pipeline  — **✓ DONE**
Create the repo (`git init` — the folder isn't one yet), `create-next-app` with TypeScript + Tailwind + App Router, push to GitHub, connect Vercel, ship the default page.
**Done when:** a live Vercel URL renders. Deploy works before there's anything to deploy — that ordering is deliberate; a broken deploy found in week 4 is expensive.

### Phase A1 — Theme tokens + shadcn  — **✓ DONE**
`npx shadcn@latest init`, then translate the mockup's `:root` block into shadcn's token names in `globals.css` — both light and dark. Install the full component list from §3 in one command. Wire `next-themes`.

| Mockup | shadcn |
|---|---|
| `--ground` | `--background` |
| `--surface` / `--surface-2` | `--card` / `--muted` |
| `--ink` / `--muted` / `--faint` | `--foreground` / `--muted-foreground` / (custom `--faint`) |
| `--navy` / `--navy-2` / `--navy-soft` | `--primary` / `--primary-hover` / `--accent` |
| `--warm` / `--warm-soft` | custom `--warn` (now-line, overdue, "behind") |
| `--line` · `--radius` · `--serif` | `--border` · `--radius` · custom `--font-serif` |

**Done when:** a scratch page shows a Button, Card, Dialog and Badge that look like the mockup in both light and dark.

### Phase A2 — Types + the data seam  — **✓ DONE**
Write `lib/types.ts` from PRD §3 (Goal, KeyIndicator w/ `unit: 'hours'|'count'`, CalendarBlock, Habit, Person, Todo, MorningSection, NightlyEntry, ScriptureNote, Exercise, Set, FeedbackItem, Activity, PlaceHistory). Then `lib/data/*.ts` with every function signature the screens will need, returning fixtures from `lib/mock/`.
**Done when:** `tsc` passes and `getKeyIndicators()` returns believable fake data in a Node script.
**This is the phase that makes the whole plan work — don't rush it.**

### Phase A3 — App shell + routing + custom primitives  — **✓ DONE**
shadcn `sidebar` styled navy, the 9 nav items + "Daily rhythm" group label, avatar footer, all routes stubbed with a heading, feedback bubble as a non-functional floating button. Build the six hand-written primitives from §3.
**Done when:** every sidebar item navigates, mobile collapses to a sheet, `/browse` click-through of all 11 routes is clean.

---

## Part B — Screens (UI complete, mock data)

Order is by dependency and daily value: **Home and Goals first** (they define the vocabulary every other screen borrows), **Calendar third** (the riskiest), then the rest.

| Phase | Screen | PRD | Notes / risk |
|---|---|---|---|
| **B1** ✓ | **Home** | §4.1, §4.1a | Purpose statement (serif) + KI tiles + `TriStateBar` + allocation pop-up + habit grid (Required / Standards of Excellence / Weekly) + week stepper + the two flow buttons. Both `unit` behaviors: hours → grouped-by-name breakdown; count → item list. No captions under tiles, no color legend. |
| **B2** ✓ | **Goals** | §4.2 | The Goals→Plans→Inputs funnel, Edit mode, `popover` icon picker, ↑ parent chips, outreach card, to-do list w/ duration + Schedule. |
| **B3** ✓ | **Calendar** | §4.3 | ⚠️ **Highest risk phase.** FullCalendar integration + CSS reconciliation. Do this before the easy screens so surprises land early. |
| **B4** ✓ | **Weekly Planning** + **Plan Today** | §4.10, §4.7 | Two flows, no sidebar tab — reached from Home. Share the `Stepper`. Top 3 flows Nightly → Plan Today. |
| **B5** ✓ | **Morning** + **Nightly Review** | §4.8, §4.9 | dnd-kit reordering is the only new tech. Morning is **time-based** — the sidebar tab appears each morning, hides once marked done, returns next day; ends with the "Next: Scripture → Plan the day" cue. Nightly: locked 5-question order + **Confirm & log hours**. |
| **B6** ✓ | **Scripture** | §4.5 | Smallest screen. Good one to hand off / move fast on. |
| **B7** ✓ | **People** | §4.4 | Staleness sort, exclusion switches, contact search, "synced 2h ago". |
| **B8** ✓ | **Gym** | §4.6 | First use of `chart`. Write `1RM.ts` + `fatigue.ts` as pure functions **with Vitest tests** — this is real math, it gets a real check. |
| **B9** ✓ | **Dates** | §4.12 | ⚠️ Mostly meaningless without live data. Build against fixtures **shaped exactly like the Google Places API response** so Part C is a URL swap. All three levels: list → detail popup → explore. Plus Dice Roll and the pairing prompt. |
| **B10** ✓ | **Feedback bubble** | §4.11 | Make the bubble real (composer, two modes, queue list). Ship it early-ish if it's cheap — it starts collecting feedback before the runner exists. |

**Done when (each):** the screen matches `mockup.html` side by side, works at phone width, works in dark mode, and every interaction does something visible. Verify with `/browse` against the Vercel preview, not just locally.

### Part B, reopened — the 2026-10-04 direction

New screen work from PRD §4.0, §4.2, §4.4 and §4.12. Built on the mock seam like the rest of Part B. **None started.**

| Phase | What | PRD | Buildable now | Waiting on a decision (§8) |
|---|---|---|---|---|
| **B11** | **Goals: reorder + delete** | §4.2, §4.0 | Reorder at every tier. `Goal.sortOrder` already exists; dnd-kit is already in the stack (Morning Review). | Delete — what it does to child goals and to the blocks and to-dos tagged to the goal. |
| **B12** | **Remove goal lookups by meaning** | §4.0 | Drop the meanings from icon labels (`goal-icon.tsx`). Replace the heart-icon lookup in `lib/actions/dates.ts` with an explicit user setting for which goal a date is tagged to. | Where that setting lives. No Settings page exists; one is only proposed (PRD §8). |
| **B13** | **Page location and layout** | §4.0 | Nothing. | Layout depth: an ordered list with show/hide, or a free-form grid. Also whether Scripture and Gym become optional pages. |
| **B14** | **People: tags + outreach mark** | §4.4 | Tags: add, remove, filter and sort by tag. New `Tag` type; `Person` gains `tags`. | Outreach mark: whether it is the existing exclusion toggle or a separate one. |
| **B15** | **Dates: location bar** | §4.12 | Live location (the browser's geolocation, sent to the server through a server action) and the radius control. Home read from stored data, not a fixture. | How a manual location is entered. Whether live coordinates are stored. |

Notes:
- **B15 was in scope for B9 and was not built.** §3's per-screen mapping lists a radius `select` for Dates; the shipped screen has cuisine, price and category only, and the radii are fixed in `lib/data/dates.ts`.
- **B13 touches the gates.** A page that can move or hide still has to be in `e2e/routes.json`, and the heading-order rule (`PageHeader` owns the `<h1>`) has to hold in every arrangement.
- **Not given a phase, because each is an open question rather than a requirement** (PRD §4.0): user-defined habit groups, editable Nightly questions, more input units, what past weeks show after a goal changes.
- **Order against Part C is not decided.** B11, B12 and B14 change `lib/types.ts`. The C1 schema is derived from those types, so building them first means the schema is written once; building them after means a migration.

**Done when (each):** the Part B bar above, plus every new route in `e2e/routes.json` and every new dialog, menu or popover in `a11y-open.spec.ts`'s `OPENABLE` list.

---

## Part C — Backend

The UI is finished and clickable before this starts. Nothing here changes a screen.

| Phase | What | Notes |
|---|---|---|
| **C1** | **Neon + Drizzle schema**, then swap `lib/data/` bodies to real queries | Full table list in PRD §7, which now adds `tags` + `person_tags` and an outreach-rotation column on `people`. Do it screen-by-screen so the app is never fully broken. Delete `lib/mock/` when the last function is swapped — by then the seed goals, habits and people have to exist as user data, since PRD §4.0 allows none of it in code. |
| **C2** | **Auth.js Google OAuth** | One consent: Calendar r/w, Gmail read, Contacts read, Docs write. Single-user allowlist on email. Refresh-token storage — this is the fiddly part. |
| **C3** | **Google Calendar two-way sync** | Read Google events in, write Companion blocks out, `google_event_id` as the join. Both directions reaffirmed 2026-10-04 (PRD §4.3). Five things need deciding here, all listed in PRD §4.3: the conflict rule, which calendars, where goal assignment and confirmed duration live for a Google-originated event, deletes and recurrence, and when a pull happens. |
| **C4** | **Journal → Google Doc append** | Build against the **test doc** `1sYDPE4nSE…` per PRD §4.9. Do not point at the real journal until appends are proven — doc id stays in config. |
| **C5** | **People signals** | Cloud: Contacts + Gmail + Calendar. Local: the launchd iMessage agent — flag-based, **metadata only, never reads the `text` column**. Prereq: Carter's one-time iCloud → Google Contacts sync. |
| **C6** | **Google Places (Dates)** | Live food search, curated `activities` table, Maps Embed. **Set the hard quota + $0 budget cap on day one, before the first call** — not after. |
| **C7** | **Gym ↔ Bumstead** | Bumstead writes the day's workout into the app store; Carter logs actuals. 1RM + fatigue (already built and tested in B8) feed the next suggestion. |
| **C8** | **Feedback runner** | launchd job polls the queue → Claude Code edit → test → **branch/PR first**, auto-push only once it's proven. Also handles `kind='date_research'`. |
| **C9** | **Debit-card import** | One-time + repeatable; seeds `place_history.last_done_date`. Lowest priority — the Dates tab works without it. |

---

## 6. Global constraints (apply to every phase)

1. **Week is Monday → Sunday.** Everywhere. `date-fns` `{ weekStartsOn: 1 }`.
2. **The calendar is the only place *time* is entered.** One sanctioned exception: a checked-off to-do increments a `count` KI (PRD §4.1a).
3. **Two KI units only:** `hours` and `count`. `days` is `count`. Do not build `tally` or `value`. *(PRD §4.0 lists "are two units enough" as `[NMT]`. The constraint stands until that is decided.)*
4. **Palette is fixed:** white / near-black navy-biased / navy accent / one muted clay. No neon. Georgia serif **only** for devotional and journal text.
5. **Single user.** No accounts system, no roles, no multi-tenant anything. *(PRD §1.5 marks this `[NMT]` as of 2026-10-04. The constraint stands until that is decided.)*
6. **$0 budget.** Free tiers only; Google Places gets a hard quota cap that makes billing impossible.
7. **Never edit `components/ui/`** by hand — it's shadcn-generated. Wrap, don't modify.
8. **Message bodies are never read.** The iMessage agent selects handle + timestamp only.
9. **No goal detail in code** (added 2026-10-04, PRD §1.6 and §4.0). Goals, plans and inputs are user data. No feature finds a goal by its icon or its title — it reads an explicit user setting.

---

## 7. Deliberately deferred

Named here so they don't get quietly rebuilt:

- **TanStack Query** — add only if Server Actions prove too slow for calendar dragging.
- **Offline PWA / service worker** — add a manifest for "add to home screen"; skip offline until a real train ride demands it.
- **`tally` / `value` KI units** — PRD §4.1a says no use case yet. *(Reopened as a question by PRD §4.0, 2026-10-04; still deferred until decided.)*
- **"Count once per day" boolean** — only if inflated counts actually show up in real use.
- **Custom goal icons** — the 7-icon lucide set ships first.
- ~~**Goal reordering / deletion**~~ — **no longer deferred** (2026-10-04). PRD §4.0 and §4.2 require both; now phase B11.
- **Mac Contacts fallback** — only if the iCloud → Google sync proves flaky.

---

## 8b. Deviations from this plan (recorded 2026-07-28)

Three things went differently than planned; all are live in the shipped code:

1. **shadcn here wraps Base UI, not Radix.** The installed `base-nova` style uses
   `@base-ui/react`. `asChild` → `render={<El/>}`, `TooltipProvider` takes `delay`,
   `ToggleGroup` is array-valued, `Select.Value` needs a render fn to show a label.
   Documented in `AGENTS.md` so reviewers don't "fix" correct code backwards.
2. **FullCalendar pinned to 6.1.21 across the board.** `core`/`react` had drifted to
   7.x while `timegrid`/`daygrid`/`interaction` have **no v7 release** — the split
   would have broken at runtime. `daygrid` was later removed entirely (unused).
3. **No react-hook-form.** shadcn's `form` component no longer exists in the registry,
   and the forms here are 2–4 fields. Server Actions + a zod parse on the server
   cover it; validation still happens at the trust boundary.

Also added beyond plan:

- `await connection()` in the root layout. Routes were being statically
  prerendered, which baked the **build date** into "today's schedule".
- **Two accessibility gates** (`npm run test:a11y`, `npm run test:lh`) — axe-core
  and Lighthouse CI over all 11 routes. The plan called for Vitest on pure logic
  only; these are borrowed conformance suites that test the rendered HTML against
  WCAG instead. First run found 5 root causes, including two palette tokens below
  AA contrast that ten review rounds had missed. See `AGENTS.md` for what they
  cover and — importantly — what they don't (dark mode, opened dialogs).

## 8. Open decisions

Neither blocks Phase A0 — both are answerable by the time they're needed.

1. ~~**Calendar library**~~ — **RESOLVED**: FullCalendar 6.1.21. Its CSS was not
   hostile; v6 exposes CSS variables, so theming was a ~90-line remap, not a fight.
2. **Google Calendar conflict rule** — when a block is edited in both Google and Companion, which wins? Decide in C3. *(One of five C3 questions now listed in PRD §4.3.)*

**Opened 2026-10-04.** The PRD marks each `[NMT]` and spells it out in the section named. Listed here by the phase it blocks:

| Decision | PRD | Blocks |
|---|---|---|
| What deleting a goal does to its children, blocks and to-dos | §4.0 | B11 (delete half) |
| Where the "which goal is a date tagged to" setting lives | §4.0, §8 | B12 |
| Layout depth — ordered list with show/hide, or a free-form grid | §4.0 | B13 |
| Whether Scripture and Gym are optional pages | §4.0 | B13 |
| Outreach mark — the exclusion toggle, or a separate mark | §4.4 | B14 (mark half) |
| How a manual location is entered | §4.12 | B15 (manual half) |
| Whether live coordinates are stored | §4.12 | B15 |
| Whether calendar events carry a location | §4.12 | C3 (it would round-trip to Google) |
| Sync: calendars, ownership of goal assignment, deletes and recurrence, pull timing | §4.3 | C3 |
| Single-user or not | §1.5, §6 | C2 (allowlist vs accounts), constraint 5 |
| User-defined habit groups, editable Nightly questions, more input units, goal history | §4.0 | No phase yet — each needs a decision before it is work |

---

*Phase-level plan. Step-level task breakdown is written per phase, immediately before building it.*
