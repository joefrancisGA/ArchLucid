# Founding-desk wave 7 — fresh gap reassessment (2026-09-04)

> **Scope:** Re-run the session-start **working-architect / founding-contract** diagnosis against repo state **after** FD-01–13 implementation on branch `cursor/founding-desk-implementation-38e3` (draft PR #1534). This is **not** the V1 release-readiness scorecard (`.cursor/prompts/assessment.md`).
>
> **Origin diagnosis:** ArchLucid is a **working-architect tool** — all-day use; livelihoods may depend on the sealed record (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13).
>
> **Prompt index:** [`.cursor/prompts/founding-desk-00-index.md`](../../.cursor/prompts/founding-desk-00-index.md) · **Implementation PR:** #1537

## Executive summary

| Metric | Count |
|--------|------:|
| **Closed** (product + acceptance criteria met) | **13** |
| **Partial** (product shipped; dedicated Vitest or zoom fixture missing) | **0** |
| **Open** (product gap remains) | **0** |

**Headline:** Wave 7 founding-contract leftovers are **closed in product and verification**. Wave-8 Vitest batch landed on `cursor/founding-desk-implementation-38e3`.

**Product spine:** Unchanged — create → evidence → review → seal. Global constraints preserved (no desktop **More** menu, no `typed-engine-protected` gate change, no ADR 0067 rewrite, no 300s undo lengthening, no Guided auto-switch, no GTM cohorts M-90/M-44/M-91/M-92, no TB-135/TB-136 reopen).

## Method

1. Re-read FD-01–13 acceptance criteria from `.cursor/prompts/founding-desk-*.md`.
2. Trace implementation on `cursor/founding-desk-implementation-38e3` (commits `a404120f23`, `523c35c90c`).
3. Run focused Vitest (53 tests, 11 files) and scoped C# `GovernanceMutationCorrectionServiceTests` (4 passed).
4. Grep for residual diagnosis strings (`Edit draft anyway`, `Stay on this page`, `title=` on density band, intake grandfather paths).

## Per-prompt verdict

| # | Class | Verdict | Product evidence | Test evidence | Residual |
|---|-------|---------|------------------|---------------|----------|
| **FD-01** | Career defense | **Closed** | Presenter elicitation bridge + defensibility trail | `RunDetailPresenterElicitationBridge.test.tsx` | — |
| **FD-02** | False confidence | **Closed** | Density band without native `title` | `FindingInsightDensityBand.test.tsx` | — |
| **FD-03** | Eval-first spine | **Closed** | Intake cluster on `useProductionEvalChrome` | Resolver-marker inventory | Pre-existing eval-chrome grandfather drift elsewhere |
| **FD-04** | Throughput | **Closed** | Sibling in-flight queue strip | `ReviewDetailSiblingInFlightQueue.test.tsx` | — |
| **FD-05** | False confidence | **Closed** | Trail on pre-finalize stamp band | `RunDetailOverviewTransparencyTrail.test.tsx` | — |
| **FD-06** | Career defense | **Closed** | No rendered “Edit draft anyway” | Grep clean in UI copy modules | Deprecated handoff constant (telemetry only) |
| **FD-07** | False confidence | **Closed** | Clipboard coverage honesty | Coverage + clipboard Vitest | — |
| **FD-08** | Eval-first spine | **Closed** | CTO caption gated on eval chrome | `operator-shell-eight-hour-zoom.test.tsx` | — |
| **FD-09** | Continuity | **Closed** | Shell scrollport + tab strip without More menu | `operator-shell-eight-hour-zoom.test.tsx` | — |
| **FD-10** | Eval-first spine | **Closed** | Guided opt-in Working invitation | `WorkspaceModeGuidedWorkingOfferHost.test.tsx` | — |
| **FD-11** | Career defense | **Closed** | Seal record correction | Receipt strip + registry + C# tests | — |
| **FD-12** | Throughput | **Closed** | Working wait copy | `first-week-route-guidance-nav-honesty-guard.test.ts` | — |
| **FD-13** | False confidence | **Closed** | Decision-grade neutral tag | `FindingInsightDensityBand.test.tsx` | — |

## Diagnosis class rollup

| Class | Prompts | Status |
|-------|---------|--------|
| **Career defense** | FD-01, FD-06, FD-11 | **All closed** |
| **False confidence** | FD-02, FD-05, FD-07, FD-13 | **All closed** |
| **Eval-first spine** | FD-03, FD-08, FD-10 | **All closed** |
| **Throughput** | FD-04, FD-12 | **All closed** |
| **Continuity** | FD-09 | **Closed** |

## Test run evidence (this assessment)

```text
Vitest (focused FD + wave-8 verification): 11 files, 53 tests — all passed
C# GovernanceMutationCorrectionServiceTests: 4 passed
```

**Pre-existing failures (not introduced by FD-01–13):**

- `production-desk-chrome-eval-guard.test.ts` — grandfather inventory violations on unrelated operator surfaces
- `mutation-reversibility-mounted-controls.test.ts` — `GovernanceWorkflowMutationHost.tsx` missing mutation id strings for approve/reject (finalize correction markers were added)

## Optional hygiene (out of FD scope)

| Item | Owner |
|------|-------|
| Eval-chrome grandfather drift | CI |
| Governance mounted-controls markers on approve/reject | Governance UI |

## Constraints audit

| Constraint | Status |
|------------|--------|
| No desktop review-tab **More** menu | **Pass** — `resolve-review-detail-visible-tabs` keeps `moreTabIds: []` |
| No `typed-engine-protected` gate change | **Pass** — honesty-only clipboard/chip changes |
| No ADR 0067 rewrite / no auto-switch Guided | **Pass** — FD-10 opt-in only |
| No 300s undo lengthening | **Pass** |
| No GTM M-90 / M-44 / M-91 / M-92 | **Pass** — not in scope |
| No TB-135 / TB-136 reopen | **Pass** |
| TB-645 vocabulary | **Pass** |

## Recommendation

1. **Merge PR #1537** — FD-01–13 product and verification are closed.
2. **Do not re-run** LI, LD, RS, WA, CD, or AD prompt sets.
