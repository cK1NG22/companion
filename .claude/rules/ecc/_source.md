# ECC rules — where these came from, and what outranks them

The files in this folder are **copies** from Carter's ECC fork (`ck22coding/ECC`, commit
`a0e8a663`, copied 2026-10-04). They are frozen at that commit; re-copy when the fork moves.
The agents, commands and skills beside them are symlinks into
`~/Projects/memory-management/ecc/` and update with the fork.

**`AGENTS.md` outranks everything in this folder.** Where they disagree, `AGENTS.md` is right:

- **Testing.** Vitest covers pure logic in `lib/` only. The "80% coverage" figure in
  `common/code-review.md` and `common/development-workflow.md` does not apply here; the gates are
  the ones in `AGENTS.md` (build, lint, typecheck, `npm test`, `test:a11y`, `test:lh`).
  `common/testing.md` and `react/testing.md` were left out for this reason.
- **Components.** shadcn here is Base UI, not Radix. Any Radix idiom in these rules is wrong here.
- **Hooks.** No ECC hooks are installed, so every `hooks.md` was left out. `react/coding-style.md`
  links to one that is not here.
- **Agents.** `common/code-review.md` names reviewers for languages this build does not use. Only
  the agents in `.claude/agents/` exist.
