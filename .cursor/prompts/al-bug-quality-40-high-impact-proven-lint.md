# ABQ-40 — High-impact proven-row harm-token PR lint

**After ABQ-35 (shipped).** Do **not** rewrite historical `bugs-found`. Do not mass-edit ledger checkboxes. Do not add tokens to `al-bug-audit-proven-rows.py`. Do not hunt.

## Goal

ABQ-35’s sample was **0% harm-named** (25 rows). The optional **PR-only** git-diff lint from that prompt never shipped. Add a **warn-only** check: **new** `(proven)` lines in a zone whose `impact:` is `high` must include a **closed** harm token **or** an explicit `[impact:medium]` / `[impact:low]` override on the row. Historical rows are out of scope. Regenerating the calibration report is allowed; changing **at most three** zone `impact:` fields with citations from the report is allowed (same cap as 35).

## Why

Picker `impact_multiplier` still treats scary files as high. The audit proved calibration is empty; without a diff lint, the next hunt can tick another high `(proven)` that names no user-visible harm. This is honesty for **new** rows, not a rewrite of yield.

## Context

- `docs/library/AL_BUG_SEVERITY_CALIBRATION_AUDIT.md`
- `scripts/agent/al-bug-audit-severity-calibration.py`
- `scripts/agent/al_bug_ledger.py` — `parse_zones`, `FIELD_IMPACT` if present
- `.cursor/commands/al-bug.md` § 1.1b Guard failure direction
- Closed tokens (do not grow into English-phrase validity signals): `cross-tenant`+`200`; `secret`/`password`/`apikey` paired with `summary`/`export`/`packet`; `committed`+`manifest`; `200` with `403`/`404`

Wire next to `azure-extractor-pester` **or** a cheap Python step. `continue-on-error: true` until the owner ratchets (this prompt does **not** flip it blocking — leftover for a later wave).

## What to build

1. **`scripts/agent/al-bug-lint-high-impact-proven.py`** (name may vary):

   - Inputs: `--ledger`, optional `--diff` (unified diff of the ledger, or `git diff origin/master... -- docs/library/AL_BUG_HUNT_LEDGER.md`).
   - Consider only **added** lines matching `(proven)` (not `invalid` / `valid-no-repro`).
   - Resolve the zone by walking upward to the nearest `## Zone:` / `impact:` (reuse ledger parser; do not regex English).
   - If zone impact is `high` and the line has no closed token and no `[impact:medium|low]`, print the line and exit 1.
   - No added high proven lines → exit 0.

2. **CI:** PR-only if cheap (`github.event_name == pull_request`); otherwise run always but only fail on added lines (empty diff → 0). **Warn-only.**

3. **Optional:** re-run the calibration audit with `--sample 25` and commit the report if numbers moved. At most **three** zone `impact:` demotions with a bullet in the PR citing the uncalibrated row.

4. Tests:

```text
python3 scripts/tests/test_al_bug_lint_high_impact_proven.py
```

Cover: (a) added proven in a high zone without tokens → fail; (b) same line with `cross-tenant` and `200` → pass; (c) `[impact:low]` override → pass; (d) added proven in a **medium** zone → pass; (e) no ledger diff → pass; (f) import does not change `al-bug-audit-proven-rows.py`.

## Acceptance criteria

- Historical proven rows not rewritten except optional ≤3 zone impact fields.
- Validity audit heuristics untouched.
- Report remains honest if regenerated (embarrassing % is OK).

## Constraints

- Do not run `/al-bug`. Do not invent `PD-###` / `TB-###`.
- Do not reopen TB-135/TB-136, G-REAL-05, G-ASSURANCE-02, or GTM M-90/M-44/M-91/M-92.
- Working-tree safety. Check nulls.
- Do not treat this lint as a SOC 2 control or pen test.
