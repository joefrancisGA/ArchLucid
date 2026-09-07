# ABQ-21 — Defect-class taxonomy and saturation cooldown

**After ABQ-06/07 (shipped).** Do not add phrase-list signals to `al-bug-audit-proven-rows.py`. Do not split `GenericArchitectureAdvicePatternsMultiCloudTests.cs`. Do not hunt.

## Goal

New `(proven)` / `(hunt-ready)` rows can carry an explicit **defect class** from a **closed** enum. The picker applies a **class cooldown** (same class, many hits, short window → treat as cooling / print “fix the class, not the instance”). `/al-bug` Phase 2 tells the agent that a matching saturated class must be a **mechanism** fix (shared reader, tokenizer, policy) or a dry/invalid row — not another sibling-file synonym.

## Why

The coercion treadmill (ABQ-03 then 20 copies until ABQ-15) and the redaction/negation treadmills were the same **class** farmed across files. File-level escalation (ABQ-07) only cools when the **same file** is hit three times. Sibling `TryParseBooleanString` copies never tripped it. Class saturation is the signal that should have forced ABQ-15-style consolidation on hunt 3, not hunt 20.

## Context

- `docs/library/AL_BUG_HUNT_LEDGER.md` — hypothesis tags; scoring; hit-rate cooldown
- `scripts/agent/al-bug-pick-zone.ps1` — `CooledByHitRate`, escalation
- `scripts/agent/al-bug-escalation.ps1` — same-file streak
- `.cursor/commands/al-bug.md` — 1.1b, Phase 2
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` — extend with optional `defectClass` (old lines stay valid)
- `scripts/agent/al-bug-audit-proven-rows.py` — **do not** classify historical rows with new regexes. Historical treadmill share stays guard-symbol based.

Closed class enum (keep this list small; do not grow it in this prompt):

| Id | Use when |
| --- | --- |
| `fail-open-validation` | Guard accepts malformed / unauthorized as success |
| `boolean-coercion` | `true`/`on` parsed as number/enum identity |
| `strictmode-script` | PowerShell StrictMode / Pester 3 vs 5 |
| `state-machine-gap` | Illegal transition / missing terminal |
| `null-deref` | Missing null check on a reachable path |
| `off-by-one` | Count/index boundary |
| `authz-scope` | Tenant/workspace/scope bypass |
| `other` | Does not fit; still required so the field is never blank on new proven rows |

## What to build

1. **Tag grammar** (ledger How-to + command 1.1b): new hunt-ready/proven lines **may** include `[class:boolean-coercion]` (or a YAML-ish zone field). Parsing must ignore unknown classes (treat as `other`) so old rows without tags stay valid. **Do not** backfill thousands of historical lines.

2. **Run log:** `/al-bug` Phase 4 / `al-bug-rolling-stats.ps1 -RecordHunt` accepts optional `-DefectClass`. JSONL field `defectClass`. Missing → omit key.

3. **Saturation rule** (picker, next to hit-rate cooldown): a class is **saturated** when, in the last 14 calendar days, **≥ 4 hits** share that class across **≥ 2 zones or ≥ 3 distinct production files** (use jsonl `paths` + `defectClass`; if `paths` missing, count zones only). Saturated class → JSON `saturatedClasses: ["boolean-coercion"]`. Zones whose **open hunt-ready** rows are **only** that class become ineligible as if `cooling` while any other `open`/`unseeded` zone remains. Zones with a different-class hunt-ready row stay eligible.

4. **Command Phase 2:** if picker JSON `saturatedClasses` contains the class of the hypothesis you are about to ship, **do not** add a sibling copy/synonym. Either (a) consolidate to a shared helper (point at ABQ-01/04/15 as pattern), or (b) close `(valid-no-repro)` / `(invalid)` and stop. Print an explicit banner.

5. **Preview table:** show saturated classes when non-empty. Ledger Scoring: one paragraph for class cooldown (do not change speed formula).

6. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugRollingStats.Tests.ps1'
```

Fixture jsonl: 4 hits, class `boolean-coercion`, 3 files → `saturatedClasses` contains that id; a zone whose only hunt-ready row is tagged that class is ineligible while another open zone exists. Three hits → not saturated. Hits without `defectClass` do not count toward saturation.

7. Optional tiny Python lint: unknown `[class:…]` tokens on **new** lines in a diff are not required (agents will typo). Skip unless cheap.

## Acceptance criteria

- Enum is documented in the ledger and the command.
- Picker implements saturation with tests; default catalogs with empty `defectClass` history behave as today.
- Audit script heuristics unchanged.
- No historical proven-row rewrite.

## Constraints

- Do not use this taxonomy to “drive unclassified share down” in the validity audit.
- Do not add open-class English phrases as class detectors.
- Do not run `/al-bug`.
- Working-tree safety. Pester 5. Concrete types over `var`. Check nulls.
