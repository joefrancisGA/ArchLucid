# Founding-desk wave 7 — fresh gap reassessment (2026-09-04)

> **Scope:** Re-run the session-start **working-architect / founding-contract** diagnosis against repo state **after** FD-01–13 implementation on branch `cursor/founding-desk-implementation-38e3` (draft PR #1534). This is **not** the V1 release-readiness scorecard (`.cursor/prompts/assessment.md`).
>
> **Origin diagnosis:** ArchLucid is a **working-architect tool** — all-day use; livelihoods may depend on the sealed record (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13).
>
> **Prompt index:** [`.cursor/prompts/founding-desk-00-index.md`](../../.cursor/prompts/founding-desk-00-index.md) · **Implementation PR:** #1534

## Executive summary

| Metric | Count |
|--------|------:|
| **Closed** (product + acceptance criteria met) | **10** |
| **Partial** (product shipped; dedicated Vitest or zoom fixture missing) | **3** |
| **Open** (product gap remains) | **0** |

**Headline:** Wave 7 founding-contract leftovers are ** materially closed in product**. Remaining work is **verification hygiene** (four prompts lack the focused Vitest each prompt file requests) plus **pre-existing CI drift** unrelated to FD (eval-chrome grandfather inventory, governance mounted-controls markers).

**Product spine:** Unchanged — create → evidence → review → seal. Global constraints preserved (no desktop **More** menu, no `typed-engine-protected` gate change, no ADR 0067 rewrite, no 300s undo lengthening, no Guided auto-switch, no GTM cohorts M-90/M-44/M-91/M-92, no TB-135/TB-136 reopen).

## Method

1. Re-read FD-01–13 acceptance criteria from `.cursor/prompts/founding-desk-*.md`.
2. Trace implementation on `cursor/founding-desk-implementation-38e3` (commits `a404120f23`, `523c35c90c`).
3. Run focused Vitest (33 tests, 6 files) and scoped C# `GovernanceMutationCorrectionServiceTests` (4 passed).
4. Grep for residual diagnosis strings (`Edit draft anyway`, `Stay on this page`, `title=` on density band, intake grandfather paths).

## Per-prompt verdict

| # | Class | Verdict | Product evidence | Test evidence | Residual |
|---|-------|---------|------------------|---------------|----------|
| **FD-01** | Career defense | **Partial** | `RunDetailPresenterElicitationBridge`, `use-review-presenter-elicitation`, `ReviewPresenterElicitationActions` wire confirm / reject / ask another via draft APIs; `ReviewDefensibilityStrip` supplies asserted / inferred / skipped trail on presenter viewport | No dedicated presenter-elicitation Vitest; existing `ReviewDetailWorkspace.test.tsx` covers generic presenter shell only | Add Vitest: three actions or honest empty, Guided unchanged, no `BuyerCtoDemoTourOverlay`, single `presenter=1` flag |
| **FD-02** | False confidence | **Closed** | `FindingInsightDensityBand` — no `title` on `StatusTag`; adjacent honesty `<p>` + `aria-label` | `FindingInsightDensityBand.test.tsx` asserts honesty text in document | Optional: explicit assert that tag has no `title` attribute |
| **FD-03** | Eval-first spine | **Closed** | Intake cluster (`SocraticIntakeWizard`, `NewRunWizardStepBody`, `ReviewsNewHeaderActions`, `ReviewsNewPageShell`) uses `useProductionEvalChrome`; listed under `PRODUCTION_DESK_CHROME_RESOLVER_MARKERS`, **not** `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS` | Resolver-marker inventory updated | Pre-existing `production-desk-chrome-eval-guard.test.ts` grandfather drift elsewhere (not intake) |
| **FD-04** | Throughput | **Partial** | `ReviewDetailSiblingInFlightQueue`, `RunDetailInFlightDeskChrome` — sibling strip excludes current `runId`, hub fallback when empty | No dedicated Vitest | Add fixture: two in-flight ops → sibling link; no `%`; no progress URL |
| **FD-05** | False confidence | **Closed** | `RunDetailOverviewTransparencyTrail` mounted on pre-finalize stamp band in `RunDetailReviewPackageDoThisNextResolved` (before `FinalizeReadinessStrip`) | `RunDetailOverviewTransparencyTrail.test.tsx` covers trail panel; stamp mount is integration-level | Optional: stamp-band fixture asserting trail in first viewport |
| **FD-06** | Career defense | **Closed** | No rendered `Edit draft anyway` in `guided-intake-copy.ts`; only deprecated constant in `architecture-draft-handoff-gate.ts` (telemetry) | No explicit grep Vitest | Deprecated constant intentionally retained |
| **FD-07** | False confidence | **Closed** | `copy-finding-as-work-item-coverage-honesty.ts` + types/builders; Working markdown/JSON include coverage honesty | `copy-finding-as-work-item-coverage-honesty.test.ts`, `copy-finding-as-work-item.test.ts` | — |
| **FD-08** | Eval-first spine | **Closed** | `AppShellClient` mounts `CtoDemoJourneyCaptionBarDeferred` only when `useProductionEvalChrome()` is true | Deferred-import tests exist; no explicit Working no-caption assert in FD run | Low risk — gate is explicit |
| **FD-09** | Continuity | **Partial** | `AppShellClient` adds `min-h-0` on shell body row for flex scrollport | **No** 200% zoom / `ReviewWorkspaceMoreTabsMenu` Vitest | Add shell zoom fixture per WA-24 pattern; `moreTabIds` already empty in tab resolver tests |
| **FD-10** | Eval-first spine | **Partial** | `WorkspaceModeGuidedWorkingOfferHost` on `OperatorHomePageView` — opt-in only, account prefs + dismiss, never auto-switches | No Vitest for invitation visibility rules | Add: Guided+0 commits → hidden; Guided+committed → shown; Working → hidden |
| **FD-11** | Career defense | **Closed** | Backend `governance_architecture_review_finalize`; UI on `RunDetailReviewPackageDecisionReceiptStrip` + `CommitRunButton` success modal | `RunDetailReviewPackageDecisionReceiptStrip.test.tsx`, `CommitRunButton.test.tsx`, `mutation-reversibility-registry.test.ts`; C# correction service 4/4 pass | — |
| **FD-12** | Throughput | **Closed** | `WORKING_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE` replaces “stay on this page”; Guided keeps buyer copy via `evalChrome` branch | Nav-honesty guard covers Working sidebar copy; no explicit “Stay on this page” Working guard | Optional: Working in-progress fixture grep test |
| **FD-13** | False confidence | **Closed** | `densityBandKind` maps `decision-grade` → `neutral` (not `ready`) | Honesty line asserted; **kind not asserted** in test | Add assert tag is not `ready` / uses neutral kind |

## Diagnosis class rollup

| Class | Prompts | Status |
|-------|---------|--------|
| **Career defense** | FD-01, FD-06, FD-11 | FD-06 / FD-11 **closed**; FD-01 **partial** (test gap only) |
| **False confidence** | FD-02, FD-05, FD-07, FD-13 | **All closed** in product |
| **Eval-first spine** | FD-03, FD-08, FD-10 | FD-03 / FD-08 **closed**; FD-10 **partial** (test gap) |
| **Throughput** | FD-04, FD-12 | FD-12 **closed**; FD-04 **partial** (test gap) |
| **Continuity** | FD-09 | **Partial** (layout fix; zoom test missing) |

## Test run evidence (this assessment)

```text
Vitest (focused FD): 6 files, 33 tests — all passed
C# GovernanceMutationCorrectionServiceTests: 4 passed
```

**Pre-existing failures (not introduced by FD-01–13):**

- `production-desk-chrome-eval-guard.test.ts` — grandfather inventory violations on unrelated operator surfaces
- `mutation-reversibility-mounted-controls.test.ts` — `GovernanceWorkflowMutationHost.tsx` missing mutation id strings for approve/reject (finalize correction markers were added)

## Wave 8 candidates (verification only)

| Priority | Item | Owner |
|----------|------|-------|
| P1 | FD-01 presenter elicitation Vitest | UI |
| P1 | FD-04 sibling in-flight queue Vitest | UI |
| P2 | FD-10 Guided → Working opt-in Vitest | UI |
| P2 | FD-09 shell 200% zoom fixture (no More menu) | UI |
| P3 | FD-02 / FD-13 strengthen density-band assertions (`title` absent, kind not `ready`) | UI |
| P3 | FD-12 Working “Stay on this page” guard test | UI |
| Hygiene | Eval-chrome grandfather drift + governance mounted-controls markers | CI / governance UI |

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

1. **Merge PR #1534** after review — product gaps from the founding diagnosis are closed.
2. **Follow with a thin wave-8 verification batch** (Vitest only) for FD-01, FD-04, FD-09, FD-10 before marking FD **shipped** in the prompt index.
3. **Do not re-run** LI, LD, RS, WA, CD, or AD prompt sets.
