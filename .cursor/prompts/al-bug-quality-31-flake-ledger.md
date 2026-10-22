# ABQ-31 — Flake ledger as a race detector (feeds ABQ-27)

**After ABQ-19/21 (shipped).** Do not treat a flake as a `(proven)` hunt hit. Do not hunt. Do not add coverlet to PR CI.

## Goal

An append-only JSONL records tests that **failed then passed on retry** (or were marked flaky in CI). Tests that flaked **≥ 3 times in 30 days** become paste-ready **`(candidate)`** rows (`[class:state-machine-gap]` or `other`) for the covering hunt zone. `/al-bug` still must prove a reachable wrong outcome before `(hunt-ready)`.

## Why

Retried-then-green CI hides races. ABQ-27 adds synthetic concurrency probes; this prompt supplies **empirical** loci (the test that already flickered). Without a ledger, each red-then-green run is forgotten. Three flakes in 30 days is a stronger seed than an agent rereading `AuthorityCommitIdempotencyHandler`.

## Context

- `docs/library/AL_BUG_ESCAPE_LOG.jsonl` — JSONL + lint pattern to copy (separate file; flakes are not escapes)
- `scripts/agent/al_bug_escape_log.py` / `al_bug_ledger.py` — path→zone mapping
- `scripts/agent/al-bug-seed-from-analyzers.ps1` — preview-only candidates, cap 15, dedup
- `.github/workflows/ci.yml` — which jobs retry (grep `retry` / `max-attempts` / `continue-on-error`); do not enable new retries just to feed this log
- Closed class enum — default `state-machine-gap` only when the test name/path is clearly concurrent/idempotency; otherwise `other`
- ABQ-27 probe tests — flake candidates may **point at** those types; they do not replace them

Prefer a **new** file `docs/library/AL_BUG_FLAKE_LOG.jsonl` (empty file valid). Do not overload the escape log (`source` enum is `al-defect` \| `ci` \| `pilot-proof`).

## What to build

1. **Schema** (keep old lines valid if you add fields later):

   | Field | Required | Meaning |
   | --- | --- | --- |
   | `at` | yes | ISO-8601 UTC of the **retry success** (or last flake) |
   | `test` | yes | Fully-qualified test name or vitest file + title |
   | `job` | yes | CI job / check name |
   | `ref` | yes | workflow run URL |
   | `paths` | yes | implicated production paths (array; may be empty) |
   | `zoneId` | yes | ledger zone or `unzoned` |
   | `attempts` | yes | integer ≥ 2 (failed then passed) |

   No stack traces, no customer data.

2. **Lint** (`scripts/agent/al-bug-lint-flake-log.py`): valid JSONL; `zoneId` exists or `unzoned`; empty file OK. Wire next to escape-log lint in `azure-extractor-pester` with `continue-on-error: true`.

3. **Seeder** (`scripts/agent/al-bug-seed-from-flake-log.ps1` or Python): `-Preview` candidates for tests with **≥ 3** events in **30d**. Line shape: `[ ] (candidate) flake <test> (≥3/30d) — race/retry locus` + class tag. Dedup. Cap 15. Do not write the ledger.

4. **Ingest (v1 honest):** same constraint as ABQ-30 — **do not invent a CI git-push bot**. Document how to append a line from a known retry (manual / artifact). If GitHub Actions already uploads TRX, a `--trx` dry-run parser is enough.

5. **Picker:** **no** score term for flake count in v1 (display-only optional `flakeCount30d` is OK if Pester is cheap; default skip). Do not let flakes forfeit explore bonus.

6. **Command:** Phase 1.1a may run the seeder `-Preview`. Flakes are not hunt-ready. Cheap-disproof: “test is slow, not racy” → leave candidate or `(invalid)`.

7. Tests:

```text
python3 scripts/tests/test_al_bug_flake_log.py
```

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugSeedFromFlakeLog.Tests.ps1'
```

(Skip the Pester file if the seeder is Python-only; then unit-test preview in `test_al_bug_flake_log.py`.)

Cover: (a) 3 events / 30d → candidate; (b) 2 events → no candidate; (c) event 31 days ago dropped from the 30d window; (d) empty log valid; (e) unknown `zoneId` → lint error unless `unzoned`.

## Acceptance criteria

- Flake log ≠ escape log ≠ hunt run log (three files).
- Empty flake log does not fail CI.
- No automatic `(proven)` ticks. No picker formula change required.
- ABQ-27 remains the place for written concurrency probes; this prompt only seeds.

## Constraints

- Do not add English-phrase signals to the validity audit.
- Do not run `/al-bug`. Do not invent `PD-###` / `TB-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Pester 5. Check nulls.
- Do not enable extra CI retries to generate data.
