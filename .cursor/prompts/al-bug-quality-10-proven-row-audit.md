# ABQ-10 — Sample `(proven)` rows and publish a validity audit

**After ABQ-01–04 preferred** (so you can label redaction/negation/schemaVersion rows as synthetic). Do not change product redactors here.

## Goal

A reproducible sample of ledger `(proven)` hypotheses is classified as **realistic**, **synthetic**, or **unclear**, with counts that dashboards can cite instead of raw `bugs-found`. Shipping a small script + a markdown report is the deliverable — not a mass rewrite of the ledger.

## Why

`archlucid-core` reports thousands of bugs while the run log shows ~390 hits on that id (already inflated). Many `(proven)` lines are dictionary prefixes, contraction phrases, or boolean `schemaVersion` “parity.” Treating those totals as quality hides the fail-open redaction defect. Owner asked to refine hunt algorithms; they also need an honest denominator.

## Context

- `docs/library/AL_BUG_HUNT_LEDGER.md` — do not delete historical rows
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl`
- New script: `scripts/agent/al-bug-audit-proven-rows.py` **or** `.ps1` (Python is OK if the repo already uses Python in `scripts/`; otherwise PowerShell 5.1)
- New report: `docs/library/AL_BUG_HUNT_VALIDITY_AUDIT.md` (contributor-reference scope banner, same as other `AL_BUG_*` docs)

## What to build

1. Parser: collect closed `[x]` lines tagged `(proven)` (bare `[x]` counts as proven per ledger rules). Record zone id, date if present, and a coarse **class** via heuristics:
   - `synthetic-redaction` — `accesskey` prefixes, `less`/`free`/`izer`, `Passwordless`, fictional compounds
   - `synthetic-negation` — `mightn't`, `needn't`, `configure to`, `mandate to`
   - `synthetic-coercion` — `schemaVersion` + boolean/`on`/`off`/padded synonyms
   - `synthetic-parity` — “parity with sibling” without a reachable payload
   - `realistic` — cross-tenant 200, zip-slip, missing scope gate, real ARM names (`adminPassword`, `connectionString`)
   - `unclear` — default
2. Sample: stratified — 50 rows from `archlucid-core`, 25 from `api-governance-tenancy-controllers`, 25 from all other zones (or all rows if a zone has fewer). Seed the RNG and print the seed.
3. **Human-in-the-loop is not required for v1** if heuristics are documented; mark heuristic confidence. Optionally leave 10 `unclear` rows quoted for owner review.
4. Report tables: counts by class, by zone, estimated synthetic fraction, and the 2026-09-06 redactor probe result (cite `adminPassword` fail-open) as evidence the synthetic class is not harmless.
5. Script `-Preview` prints the tables without writing. Default writes/updates the markdown report only.
6. Tests: a tiny fixture markdown → expected class counts (`scripts/tests/` Pester or pytest next to other script tests).

## Acceptance criteria

- `docs/library/AL_BUG_HUNT_VALIDITY_AUDIT.md` exists with sample size, seed, and class totals.
- Script is rerunnable from repo root.
- Ledger historical rows are unchanged (except you may add **one** link at the top of the ledger How-to pointing at the audit — optional, one paragraph max).
- Report does not claim CPA SOC 2 or that the product is bug-free.

## Constraints

- Do not retag thousands of ledger lines in this prompt.
- Do not change picker scoring (ABQ-06).
- Do not run `/al-bug`.
- Working-tree safety on any tracked file you edit.
