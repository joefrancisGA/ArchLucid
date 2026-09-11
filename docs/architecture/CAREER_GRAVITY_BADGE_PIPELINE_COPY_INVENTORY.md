> **Scope:** Shrink-only inventory — `StatusTag` / pipeline step labels / execution-pipeline copy on Working that can screenshot as Real-complete while Mode is Simulator. **Do not change copy in this file.** CG-031+ owns mutations.

> **Spine:** ADR **0091** · CG-002 · AS-077 · CG-004

# Career-gravity status badge and pipeline copy inventory

**Last reviewed:** 2026-09-11

Badges are what get screenshotted in Slack. Badge honesty is career gravity.

Depends on [`CAREER_GRAVITY_UNLABELED_READY_INVENTORY.md`](CAREER_GRAVITY_UNLABELED_READY_INVENTORY.md) (CG-002). This file adds the **Mode × door matrix** and the Security chooser skip.

## Canonical labels

| Internal (`PIPELINE_STATUS_LABELS`) | Buyer display (`PIPELINE_STATUS_BUYER_DISPLAY_LABELS`) | `StatusTag` kind (`pipeline` domain) |
|--------------------------------------|----------------------------------------------------------|--------------------------------------|
| `Finalized` | **Ready** | `ready` |
| `Ready to finalize` | Needs attention | `needs-attention` |
| `In pipeline` | In progress | `in-progress` |
| `Starting` | Starting | `neutral` |
| `Failed` | Stopped | `blocked` |
| `Partially failed` | Incomplete | `needs-attention` |

Buyer **Ready** is the finalized pill (`PIPELINE_STATUS_BUYER_DISPLAY_LABELS.finalized`). It is not the Ready-to-finalize literal. Screenshots of **Ready** still read as Career-complete.

Honesty helper: `shouldSuppressReadyToFinalizeForCareerHonesty` (pre-commit gate, Rehearsal door, quality gate, Simulator rehearsal). When it fires, Ready-to-finalize becomes **In pipeline**.

`deriveRunListPipelineLabel(run)` **without** honesty options fails open to Ready-to-finalize whenever `hasFindingsSnapshot` is true.

## Matrix — pipeline pill vs structural Mode + effective door

Assume Working desk (`workingDesk === true`) and honesty options **are** passed (as `RunStatusBadge` does). Sample runs are eval-ok.

| Internal label when snapshot matches | Career + Real | Career + Simulator/Fallback | Rehearsal + Simulator | Honesty options omitted |
|--------------------------------------|---------------|----------------------------|-----------------------|-------------------------|
| Starting / In pipeline / Failed / Partially failed | Unchanged | Unchanged | Unchanged | Unchanged |
| Ready to finalize | Shows Ready to finalize (or buyer Needs attention) | **Suppressed** → In pipeline (`shouldSuppressReadyToFinalizeForSimulatorRehearsal`) | **Suppressed** via Rehearsal door **and** Simulator | **Shows Ready to finalize** (bypass) |
| Finalized | Buyer **Ready** | Still **Ready** — no rehearsal band on the pill | Still **Ready** | Same |

`RunStatusBadge` always passes `workingDesk` from `useProductionDeskChrome` and `effectiveWorkingCareerRehearsalDoor` from `useEffectiveWorkingCareerRehearsalDoor`. Direct `deriveRunListPipelineLabel(run)` call sites do not.

## Security product-line chooser skip (AS-077 leftover)

`OperatorShellTopBar.tsx` sets `showWorkingCareerRehearsalChooser = productLine !== "security"`. Security product line **does not render** `WorkingCareerRehearsalChooser`.

Door preference still comes from `localStorage` / AS-080 defaults. Badges still read `effectiveDoor`. Operators on Security cannot see or change the door in the top bar (CG-017). Do not treat the skip as “Security has no Career gravity.”

## Surfaces

| Path | Copy / behavior | Honesty options | Leak class | Owner |
|------|-----------------|-----------------|------------|-------|
| `archlucid-ui/src/lib/pipeline-status-labels.ts` | Dictionary including `Ready to finalize` and buyer **Ready** | N/A | covered (dictionary) | CG-031 / CG-033 |
| `archlucid-ui/src/lib/runs/run-pipeline-status-presentation.ts` | Derives label + `StatusTag` kind | **Yes** when second arg passed | covered | CG-031 |
| `archlucid-ui/src/components/runs/RunStatusBadge.tsx` | `StatusTag` from presentation helper | **Yes** | covered | CG-031 |
| `archlucid-ui/src/components/runs/use-run-progress-tracker.ts` | `Ready to finalize — use Finalize review…` | **Yes** (`gateSuppressesReady`) | covered | CG-032 |
| `archlucid-ui/src/components/runs/RunProgressTracker.tsx` | Renders `liveStatus` | via hook | covered | CG-032 |
| `archlucid-ui/src/lib/enterprise-status-kind-resolver.ts` | Maps Ready / Ready to finalize → tag kinds | N/A | covered | CG-004 |
| `archlucid-ui/src/lib/first-pilot-operating-rail-status.ts` | `deriveRunListPipelineLabel(r) === "Ready to finalize"` | **No** | **bypass** | CG-085 |
| `archlucid-ui/src/lib/run-detail-workspace-derive/workspace-status.ts` | `deriveRunListPipelineLabel(input.run)` | **No** | **bypass** | CG-031 |
| `archlucid-ui/src/lib/first-pilot-command-center-phase.ts` | `Ready to finalize review` | **No** | **bypass** | CG-085 |
| `archlucid-ui/src/hooks/use-review-presenter-elicitation.ts` | default title `Ready to finalize` | **No** | **bypass** | CG-049 |
| `archlucid-ui/src/lib/i18n.ts` | `All analysis is complete. Finalize…` | copy | bypass | CG-033 |
| `archlucid-ui/src/components/shell/OperatorShellTopBar.tsx` | Security skips chooser | N/A | security-skip | CG-017 |
| `archlucid-ui/src/lib/governance/working-career-rehearsal-door.ts` | Door ids / grandfather | AS-080 | mismatch until CG-020 | CG-020 |
| `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageView.tsx` | Print `StatusTag` | presentation-dependent | covered / print leftover | CG-023 |

## Shrink rules

1. **Do not change copy** from this inventory.
2. Bypass rows stay until CG-031 / CG-085 / CG-049 wrap or remove them.
3. Security chooser skip is **CG-017**, not a badge rewrite.
4. Ratchet: `career-gravity-badge-pipeline-copy-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Host `AgentExecution:Mode` default Simulator.
- Merging DraftRequests and Runs.
- Guided / demo Ready teaching.
