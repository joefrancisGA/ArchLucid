# ABQ-38 — Flake-log TRX / retry ingest (dry-run)

**After ABQ-31 (shipped).** Do not treat a flake as a `(proven)` hit. Do not hunt. Do not add coverlet or new CI retries. Do not git-push the flake log.

## Goal

`docs/library/AL_BUG_FLAKE_LOG.jsonl` is valid and empty. The seeder therefore always emits zero candidates. Add a **preview** parser for a checked-in **fixture** TRX (or a GitHub Actions test-result XML snippet) that appends **candidate JSONL lines to stdout**, not to the committed log. Document the manual append path. Same honesty as ABQ-30: no bot commit.

## Why

ABQ-31’s schema and ≥3/30d seeder are useless until something writes events. Inventing retries would Goodhart the log. Parsing an artifact the owner already has (TRX from a local `dotnet test --logger trx`, or a saved Actions “Test results” file) is the missing ingest. Agents may run `--preview` during a seed hunt when a TRX is on disk.

## Context

- `scripts/agent/al_bug_flake_log.py`, `al-bug-lint-flake-log.py`, `al-bug-seed-from-flake-log.py`
- `scripts/tests/test_al_bug_flake_log.py`
- `scripts/agent/al_bug_ledger.py` — path → zone
- `.github/workflows/ci.yml` — do **not** enable retries to feed this log; do **not** upload TRX from every PR job in this prompt unless a job **already** publishes test results
- Closed class: default `other`; `state-machine-gap` only when the test name is clearly concurrent/idempotency

## What to build

1. **`--trx <path>`** (or `--results-xml`) on the flake ingest/seeder:

   - Parse VSTest TRX (or a minimal fixture subset: test name, outcome, start/end). Keep only tests that **failed then passed** in the **same** run (two unit results, or `outcome=Failed` followed by retry `Passed` if the schema has it). If TRX has no retry, accept a **paired fixture** of two results for the same FQN with `attempts: 2`.
   - Map test assembly / class prefix to production `paths` when obvious (`ArchLucid.Application.Tests` → `ArchLucid.Application/`); else `paths: []` and `zoneId: unzoned`.
   - `--preview` prints JSONL to stdout. Does **not** write `AL_BUG_FLAKE_LOG.jsonl` unless `--apply` (default off).

2. **Fixture** under `scripts/tests/fixtures/` — tiny TRX or JSON stand-in, not a full CI dump.

3. **Command 1.1a:** optional `--trx` when a results file is already on disk. Flakes still not hunt-ready. Slow ≠ racy.

4. **CI:** unit tests only. Do not add a TRX download step to PR CI. Flake lint stays `continue-on-error`.

5. Tests:

```text
python3 scripts/tests/test_al_bug_flake_log.py
```

Cover: (a) fixture fail-then-pass → one preview line with `attempts >= 2`; (b) pass-only TRX → no line; (c) `--preview` does not write the committed log; (d) unmapped test → `unzoned` or skip (pick one, document it); (e) existing ≥3/30d seeder tests still pass.

## Acceptance criteria

- Preview-only by default. Committed flake log may stay empty.
- No new CI retries. No coverlet. No git-push.
- Hunt-ready bar unchanged.

## Constraints

- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Check nulls. Pester 5 if you add a `.ps1`.
