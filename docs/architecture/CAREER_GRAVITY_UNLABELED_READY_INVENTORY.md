> **Scope:** Shrink-only inventory — Working surfaces that can show Ready / complete / finalize-able chrome while structural execute is Simulator or Fallback without Rehearsal labeling. **Do not change copy in this file.** CG-021+ owns mutations.

> **Spine:** ADR **0091** · ADR **0086** · LP-06 · AS-079 · CG-002

# Career-gravity unlabeled Simulator Ready inventory

**Last reviewed:** 2026-09-11

Chooser chrome (AS-076–085) does not help if pipeline copy still screenshots as Career-complete. ADR **0091**: Simulator is not the unlabeled Working day.

**Do not add Ready literals** to Working review surfaces without a row here. Shrink rows when CG-021+ wires honesty; do not grow the scan set without a named leftover.

## Leak classes

| Class | Meaning | Typical owner |
|-------|---------|---------------|
| **covered** | LP-06 / AS-079 already suppress Ready on Working Rehearsal / Simulator when the helper is passed | CG-030 leftover only if a call site skips the helper |
| **bypass** | Ready / finalize-able copy that does **not** call `shouldSuppressReadyToFinalizeForCareerHonesty` | CG-030 / CG-031 / CG-085 |
| **mismatch** | Career door + Simulator Mode can still look complete if `structuralExecutionMode` is missing | CG-020 |
| **eval-ok** | Guided / demo / help teaching — not Working Career gravity | leave |

## Scan ratchet (shrink-only)

Vitest scans `archlucid-ui/src` (non-test, non-generated) for `Ready to finalize` and `PIPELINE_STATUS_LABELS.readyToFinalize`. Every hit must appear in the table. Baseline count must not grow.

## Ready-literal surfaces (scanner)

| Path | String | LP-06 / AS-079 | Leak class | Notes |
|------|--------|----------------|------------|-------|
| `lib/pipeline-status-labels.ts` | `Ready to finalize` | Dictionary only | covered | Canonical label; honesty belongs at call sites |
| `lib/runs/run-pipeline-status-presentation.ts` | `PIPELINE_STATUS_LABELS.readyToFinalize` | **Yes** when `workingDesk` + Mode/door helpers are passed | covered | Suppresses via `shouldSuppressReadyToFinalizeForCareerHonesty` |
| `components/runs/use-run-progress-tracker.ts` | `Ready to finalize — use Finalize review…` | **Yes** (`gateSuppressesReady`) | covered | Hardcoded sentence still exists; suppressed when honesty fires |
| `components/reviews/PreFinalizeChecklistPanel.tsx` | `Ready to finalize` | **Yes** (AS-079 door) | covered | Checklist label; Rehearsal suppresses |
| `lib/enterprise-status-kind-resolver.ts` | `PIPELINE_STATUS_LABELS.readyToFinalize` | N/A (kind map) | covered | Maps label → StatusTag kind; not a screenshot string by itself |
| `lib/runs/run-work-queue-groups.ts` | comment `Ready to finalize` | Comment | covered | Groups needs-attention; uses `deriveRunListPipelineLabel` |
| `lib/first-pilot-operating-rail-status.ts` | `deriveRunListPipelineLabel(r) === "Ready to finalize"` | **No** — helper not passed | **bypass** | Home / first-pilot rail can show Ready without Working honesty |
| `lib/first-pilot-command-center-phase.ts` | `Ready to finalize review` | **No** | **bypass** | Headline when a run exists without a seal |
| `hooks/use-review-presenter-elicitation.ts` | default title `Ready to finalize` | **No** | **bypass** | Presenter empty-prompt fallback |
| `lib/resolve-core-pilot-help-workflow-step-status.ts` | `Ready to finalize` | eval-ok | eval-ok | Help workflow step label |

## Related surfaces (no Ready-to-finalize literal; still gravity)

| Path | String / behavior | LP-06 / AS-079 | Leak class | Notes |
|------|-------------------|----------------|------------|-------|
| `components/runs/RunStatusBadge.tsx` | derived pipeline label | **Yes** when `workingDesk` | covered | Prompt-named leftover; uses presentation helper |
| `components/runs/RunProgressTracker.tsx` | renders `liveStatus` | via hook | covered | Prompt-named leftover |
| `components/reviews/RunDetailPreFinalizeGateHonestyStrip.tsx` | Rehearsal / gate banners | **Yes** (door) | covered | Prompt-named leftover |
| `lib/governance/simulator-career-honesty.ts` | career-complete block | **Yes** (LP-06) | covered | Owner helper; not a Ready string |
| `lib/governance/working-career-rehearsal-door.ts` | new-tenant Career default | AS-080 | mismatch | Career gravity vs Simulator Mode until CG-020 |
| `lib/provenance-review-context.ts` | `resolveRunPipelineStatusPresentation(summary)` only | **No** | **bypass** | Provenance header can show Ready without Working honesty |
| `app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideWalkthrough.tsx` | `readyToFinalize` CTA gate | **Yes** (CG-091 suppress) | **covered** | First-review guide finalize path |
| `lib/i18n.ts` | `All analysis is complete. Finalize…` | copy | bypass | Complete-as-Career tooltip adjacent to pipeline labels |

## Shrink rules

1. **Do not grow** the Ready-literal scan set. New Working `Ready to finalize` strings fail Vitest until listed — then CG-021+ must remove or honesty-wrap them, then drop the row.
2. **Bypass** rows are the CG-030 / CG-085 / first-pilot leftovers. Do not “fix” copy in CG-002.
3. **Eval-ok** help/demo strings stay until a named help prompt. They must remain listed so they cannot hide as unlabeled Working Career.
4. Ratchet: `career-gravity-unlabeled-ready-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Host `AgentExecution:Mode` default Simulator.
- ADR 0086 door chrome rewrite.
- Guided / demo Ready teaching.
