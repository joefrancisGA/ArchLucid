# ABQ-20 — Patch-revert verifier for `(proven)` hunt fixes

**After ABQ-10/12 (shipped).** Do not reclassify proven rows with new English-phrase signals. Do not rewrite historical `bugs-found`. Do not hunt.

## Goal

A script can take a `(proven)` ledger row that cites a regression test, check out the **fix commit**, revert **only production files** from that commit, and require the named test to **fail**. Rows whose tests still pass after the revert are `unguarded` (the test never locked the bug). Publish a small report; optionally sample recent rows in CI as warn-only.

## Why

ABQ-10/12 classify proven rows by **guard symbol** (treadmill vs substantive). They cannot tell whether the cited test would fail if the production patch disappeared. Agents routinely ship a test that asserts the new allowlist row, then tick `(proven)`. Revert-to-fail is the cheapest honesty check that still uses the repo’s own git history.

## Context

- `docs/library/AL_BUG_HUNT_LEDGER.md` — `(proven)` lines; many cite `` `Type.Method` `` or `file.test.ts`
- `scripts/agent/al-bug-audit-proven-rows.py` — `ProvenRow`, `parse_zones`, `collect_proven_rows` — **reuse** the parser; add a sibling script, do not fork classification heuristics
- `docs/library/AL_BUG_HUNT_VALIDITY_AUDIT.md` — cite; do not replace
- `.cursor/commands/al-bug.md` Phase 2/3 — fix must include a failing-first test
- Default hunt push target: `bugsmash` (do not change)

Proven lines are messy. Extract test names **best-effort** (backticks, `Tests.`, `page.test.tsx`). Rows with no extractable test are `no-test-cited`, not `unguarded`.

## What to build

1. **`scripts/agent/al-bug-verify-proven-revert.py`** (name may vary; keep `al-bug-` prefix):

   - Parse ledger proven rows (import/reuse functions from the audit script if that stays import-safe; otherwise copy the small parser into a shared `al_bug_ledger.py` module **in this prompt** so both scripts call one parser — prefer the shared module if the audit script is currently a single file with `if __name__`).
   - Flags: `--zone <id>` (optional), `--since <YYYY-MM-DD>` (default: last 14 days of `last-bug` / hit date in the row text when present, else skip undated rows), `--limit N` (default 20), `--report docs/library/AL_BUG_PROVEN_REVERT_AUDIT.md`.
   - For each selected row, resolve a fix SHA: prefer a 7–40 char hex in the row; else `git log -S` / path from the row — if unresolved, classify `no-commit-cited` and continue. **Never** guess a random SHA.
   - Worktree: `git worktree add` a temp dir at that SHA (or `git show` + patch invert). Revert production paths from that commit (`git show --name-only`, exclude `*Tests*`, `*.md`, `*.jsonl`). Run **only** the named test (`dotnet test --filter FullyQualifiedName~…` or `npm exec vitest run <file> -t …` when the citation is UI). Capture pass/fail.
   - Classify: `guarded` (test fails after revert), `unguarded` (test still passes), `could-not-run` (build/filter miss), `no-test-cited`, `no-commit-cited`.
   - Exit 0 on `guarded` / skip classes. Exit 1 only when `--fail-on-unguarded` is set **and** at least one `unguarded` appears. Default CI invocation must **not** use `--fail-on-unguarded` until the owner ratchets (warn-only report).

2. **Cleanup:** always `git worktree remove` / delete temp dirs, even on failure. Never `git checkout` the agent’s branch to the fix SHA in the main worktree.

3. **Report markdown:** counts by class, list `unguarded` rows with zone id + test name + SHA. Honest: “sample of recent cited rows,” not “all proven rows are guarded.” Do not claim CPA SOC 2.

4. **Command/docs:** `.cursor/commands/al-bug.md` Phase 2 adds: the shipped test must fail if the production hunk is reverted. Ledger How-to: one line pointing at the verifier. Do not require agents to run the full verifier on every hunt (too slow); they still write a failing-first test in the same session.

5. **CI:** optional job or step in `azure-extractor-pester` / a tiny dedicated job, `continue-on-error: true`, `--limit 5 --since` ~14 days, no `--fail-on-unguarded`. Skip the step if `dotnet` cannot restore (Cloud images vary). Prefer not to add a 30-minute job.

6. Tests (no need to revert real Core in unit tests):

```text
python3 scripts/tests/test_al_bug_verify_proven_revert.py
```

Cover: test-name extraction from sample lines; path filter (tests/docs excluded); classification of fixture subprocess results (`fail` → `guarded`, `pass` → `unguarded`); `--fail-on-unguarded` exit codes. Mock `git` / `dotnet` with injected callbacks or recorded JSON — do not clone the repo N times in unit tests.

Optional Pester only if you add a `pwsh` wrapper.

## Acceptance criteria

- Shared ledger parse used by audit + verifier (or a documented one-file import).
- Unit tests do not require network or a second clone.
- Report file is generated in `--report` mode from a fixture.
- Default CI (if added) is warn-only.
- Validity audit heuristics are unchanged.

## Constraints

- Do not `git reset --hard` on the agent worktree.
- Do not mass-retick `(proven)` rows to `(invalid)` even when unguarded — report them; owner decides.
- Do not run `/al-bug`.
- Working-tree safety. Pester 5 if you add Pester.
- No full-solution `dotnet test` as the verifier’s default — **named test only**.
