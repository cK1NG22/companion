# TODO

Tags: **[no decision]** can be done as written. **[decision]** needs Carter's call first.
**[check first]** is a suspicion — confirm it is real before fixing.

## No decision needed

- [x] [no decision] Add `app/global-error.tsx` — a throw in `app/layout.tsx` (`isMorningDone()`) bypasses `app/error.tsx` — added 2026-10-04, done 2026-10-04
- [x] [no decision] Fix `.gitignore` so `.env.example` is tracked — `!.env.example` is re-ignored by a later `.env*` — added 2026-10-04, done 2026-10-04
- [x] [no decision] Guard `lastDoneChip` in `lib/format.ts` against an unparseable date — it renders `NaNmo ago`, and `lib/format.test.ts` pins that — added 2026-10-04, done 2026-10-04
- [x] [no decision] Make the todo schema check two-way — an optional field added to `NewTodoInput` (`lib/data/todos.ts`) but not to `NewTodoSchema` (`lib/actions/todos.ts`) still compiles — added 2026-10-04, done 2026-10-04
- [x] [no decision] Derive `dayIndex` in `lib/week.ts` from `WEEK_STARTS_ON` — it hardcodes `(getDay() + 6) % 7`, stating the Monday rule twice — added 2026-10-04, done 2026-10-04
- [x] [no decision] Move the `NEXT_PUBLIC_MAPS_EMBED_KEY` read out of `app/dates/page.tsx:31` — the only env read outside `lib/` — added 2026-10-04, done 2026-10-04
- [x] [no decision] Run a dead-export scan (`knip` or `ts-prune` via `npx`, no new dependency) and remove what it finds — added 2026-10-04, done 2026-10-04
- [x] [no decision] View `app/error.tsx` and `app/loading.tsx` in a browser, light and dark — no test suite renders them — added 2026-10-04, done 2026-10-04

## Check first

- [ ] [check first] Four `toISOString()` (UTC) call sites in `lib/data/people.ts` and `lib/data/feedback.ts` vs the app's local-naive time convention (`lib/windows.ts`) — is anything compared across the two? — added 2026-10-04
- [ ] [check first] 22 files carry `"use client"`, including every whole-screen view — can any be narrowed to a smaller client island? — added 2026-10-04
- [ ] [check first] `app/global-error.tsx` in dark mode may flash light before the theme class applies — two production runs of the browser check disagreed — added 2026-10-04
- [ ] [check first] `app/error.tsx` recovery after the cause of a throw is removed — only "retry re-requests and stays" was seen — added 2026-10-04
- [ ] [check first] Sidebar briefly highlights two items during client-side navigation — reported 2026-07-30, not confirmed since — added 2026-10-04

## Needs a decision

- [ ] [decision] Align the 30-day "recent" cutoff at `components/dates/dates-view.tsx:233` with the chip's rounding — which boundary is right? — added 2026-10-04
- [ ] [decision] Id counters are module-local in `lib/data/gym.ts`, `rhythm.ts`, `feedback.ts` — moving them to the store's `nextId` changes the ids produced — added 2026-10-04
- [ ] [decision] The 134 absolute-path symlinks committed under `.claude/` dangle in any other clone — gitignore them, use the ECC plugin, or commit real copies? — added 2026-10-04
- [ ] [decision] Reconcile `.claude/rules/ecc/` with `AGENTS.md` — contradictions beyond what `_source.md` lists; depends on the symlink choice — added 2026-10-04
- [ ] [decision] `ThemeToggle` (`components/shell/theme.tsx`) is imported nowhere, so the app has dark mode and no switch — mount it or delete it? — added 2026-10-04
- [ ] [decision] Six shadcn files under `components/ui/` are unused (`alert-dialog`, `carousel`, `command`, `input-group`, `scroll-area`, `table`), and `cmdk` and `embla-carousel-react` exist only for two of them — keep or remove through the shadcn CLI and npm? — added 2026-10-04
- [ ] [decision] `getFeedbackQueue` (`lib/data/feedback.ts`) and the exports `IsoDateTime`, `FeedbackStatus` (`lib/types.ts`) have no outside user — kept for Part C, or trim? — added 2026-10-04
- [ ] [decision] `app/global-error.tsx` logs a dev-only React warning — next-themes renders an inline script tag inside a client component — accept it, or drop `ThemeProvider` there and lose the saved theme? — added 2026-10-04

## Carter's to do

- [ ] Codex review of PR #4 (structure fixes) — added 2026-10-04
- [ ] Commit the uncommitted edits in the parent `products/` repo (`CLAUDE.md`, `PROJECT.md`) — added 2026-10-04
- [ ] Codex review of PR #6 (no-decision fixes) — added 2026-10-04
- [ ] Remove the merged worktrees `structure-fixes` and `docs-drift` once their transcripts are folded — added 2026-10-04
