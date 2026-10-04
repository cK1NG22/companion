# TODO

- [ ] Add `app/global-error.tsx` — a throw in `app/layout.tsx` (`isMorningDone()`) bypasses `app/error.tsx` — added 2026-10-04
- [ ] View `app/error.tsx` and `app/loading.tsx` in a browser, light and dark — no test suite renders them — added 2026-10-04
- [ ] Decide what to do with the 134 absolute-path symlinks committed under `.claude/` — they dangle in any other clone — added 2026-10-04
- [ ] Reconcile `.claude/rules/ecc/` with `AGENTS.md` — contradictions beyond what `_source.md` lists — added 2026-10-04
- [ ] Fix `.gitignore` so `.env.example` is tracked — `!.env.example` is re-ignored by a later `.env*` — added 2026-10-04
- [ ] Align the 30-day "recent" cutoff at `components/dates/dates-view.tsx:233` with the chip's rounding — added 2026-10-04
- [ ] Codex review of PR #4 (structure fixes) — added 2026-10-04
