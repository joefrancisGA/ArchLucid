# ABQ-35 — Severity / impact calibration audit

**After ABQ-06/16 (shipped).** Do **not** rewrite historical `bugs-found` or mass-edit ledger checkboxes. Do not hunt. Do not treat this as a V1 assessment scorecard.

## Goal

A sampled audit answers: of **N** recent rows tagged **high** impact (zone `impact: high` and/or hunt-ready/proven text that claims high/medium), how many **name user-visible harm** per `/al-bug` 1.1b (secret in a summary, cross-tenant **200**, committed bad manifest)? Publish a short report so the impact multiplier stays honest. Optional lint: **new** high-impact proven lines must contain a harm token from a **closed** list.

## Why

Picker score uses `impact_multiplier` (high ×1.40, medium ×1.00, low ×0.65). Agents can mark a zone `high` or a row “high” because the file is scary, not because the repro shows user-visible harm. ABQ-06 added the multiplier; nothing checks calibration. Goodhart: hunt yield × unearned high impact.

## Context

- `docs/library/AL_BUG_HUNT_LEDGER.md` — zone `impact:`; scoring block
- `scripts/agent/al-bug-pick-zone.ps1` — `Get-ImpactMultiplier`
- `.cursor/commands/al-bug.md` § 1.1b **Guard failure direction**: “Severity must name user-visible harm … ‘Test disagreed with an allowlist’ is not medium/high.”
- `scripts/agent/al_bug_ledger.py` — `parse_zones`, `collect_proven_rows`, `ProvenRow`
- `docs/library/AL_BUG_HUNT_VALIDITY_AUDIT.md` — **do not replace**; this is impact honesty, not treadmill-vs-substantive
- `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md` — do not imply CPA SOC 2

Closed **harm** tokens (do not grow into English-phrase validity signals). Examples — keep the list **small** and **structural**:

- `cross-tenant` + `200` (same row)
- `secret` / `password` / `apikey` **in a user-visible surface** (summary, packet, export) — prefer pairing with `summary` / `export` / `packet`
- `committed` + `manifest` (bad persist)
- `404`/`403` expected but `200` on authz

If the row cannot match a closed token, it is **uncalibrated**, not automatically `invalid`.

**Do not** add these tokens to `al-bug-audit-proven-rows.py`. A **sibling** script only.

## What to build

1. **`scripts/agent/al-bug-audit-severity-calibration.py`:**

   - `--sample N` (default 25), `--since YYYY-MM-DD`, `--report docs/library/AL_BUG_SEVERITY_CALIBRATION_AUDIT.md`.
   - Population: proven (and optionally hunt-ready) rows whose **zone** `impact` is `high`, **or** whose line contains `high` as a severity word (be conservative — prefer zone impact to avoid matching `highlight`).
   - Classify each sampled row: `harm-named` / `uncalibrated` / `skipped` (no date).
   - Report: counts, % harm-named, list uncalibrated citations (zone id + truncated line). Honest title: “sample of high-impact rows,” not “all high bugs are user-visible.”

2. **Optional CI grep on **git diff** of the ledger** (PR-only): new lines matching `(proven)` in a `impact: high` zone that are **not** `invalid`/`valid-no-repro` should include at least one closed harm token **or** an explicit `[impact:medium]` / `[impact:low]` override on the row. Warn-only (`continue-on-error`) until the owner ratchets. Do **not** fail `master` on historical rows.

3. **Command 1.1b:** one reminder: high impact requires named harm; link the audit report when present.

4. **Picker:** **no** formula change in this prompt. If calibration % is low, the report may recommend lowering specific **zone** `impact:` values — the implementer may change **at most three** zone impact fields with evidence in the report, or change none.

5. Tests:

```text
python3 scripts/tests/test_al_bug_audit_severity_calibration.py
```

Cover: (a) fixture row “cross-tenant GET returned 200” + high zone → `harm-named`; (b) fixture “test disagreed with allowlist” → `uncalibrated`; (c) `--sample` does not read the whole ledger when a fixture ledger is passed; (d) audit script import does not change `al-bug-audit-proven-rows.py` heuristics (no new functions there).

## Acceptance criteria

- Report file generated in the PR (even if % is embarrassing — that is the point).
- Historical `bugs-found` / checkboxes unchanged except optional ≤3 zone `impact:` edits with citations.
- Validity audit phrase-list **untouched**.
- Empty sample (no high rows in window) → report says so; exit 0.

## Constraints

- Do not run `/al-bug`. Do not invent `PD-###` / `TB-###`.
- Do not reopen TB-135/TB-136, G-REAL-05, G-ASSURANCE-02, or GTM M-90/M-44/M-91/M-92.
- Working-tree safety. Check nulls.
- Do not hide desktop review workspace tabs.
- Do not treat this audit as a pen test or SOC 2 control.
