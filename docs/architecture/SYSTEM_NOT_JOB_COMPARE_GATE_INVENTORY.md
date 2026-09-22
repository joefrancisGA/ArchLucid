> **Scope:** Shrink-only inventory — Working user journeys that **die at the Compare gate** (two committed golden manifests). Documents current behavior; **do not implement draft-diff Compare here.** Cheap sketch path is **SN-008** (clone-from-snapshot) per ADR **0092**.

> **Spine:** ADR **0092** · ADR **0068** · R12 · `AuthorityCompareService` · `compare-baseline-run.ts`

# System-not-job Compare gate inventory (SN-006)

**Last reviewed:** 2026-09-12

All-day architects sketch in Working. **Compare** is the Career proof engine: it diffs **two sealed golden manifests** (`GoldenManifestId` + `ManifestHash`). In-flight drafts, spawn-locked handoffs, and labeled envelopes **do not** satisfy that gate.

**ADR 0092** allows a **labeled cheap what-if envelope** without merging `DraftRequests` and `Runs`. That path is **not** draft-diff Compare. **SN-008** owns clone-from-snapshot on the desk; **CE** wave owns the runner.

## Compare gate (current)

| Layer | Gate | Module anchor |
| --- | --- | --- |
| **Backend** | `CompareRunsAsync` loads both runs; manifest diff runs only when **both** `GoldenManifestId` values are set | `ArchLucid.Persistence/Coordination/Compare/AuthorityCompareService.cs` |
| **Manifest diff** | `CompareManifestsAsync` loads sealed `ManifestDocument` rows by id | `IGoldenManifestRepository` |
| **UI inventory** | Compare pickers always use `committedOnly: true` (Working + buyer) and `hasGoldenManifest` | `CompareRunPickersSection` · `useCompareFinalizedRunAvailability.ts` |
| **Baseline anchor** | `isRunCommittedForBaseline` requires `hasGoldenManifest === true` | `compare-baseline-run.ts` |
| **409 copy** | Lifecycle/sealed-hash prerequisite failures surface via `compareRunPairBlockedReason` | `compare-run-pair-blocked-reason.ts` |
| **R12 branch** | Parent vs branch auto-compare polls until `bothRunsReadyForBranchCompare` | `draft-branch-auto-compare.ts` · `WhatIfBranchCompareBanner` |

**Rejected:** draft-to-draft Compare as Career proof (R12; SN-038 residual). **Do not** implement here.

## Surfaces

| Surface | Path | Notes |
| --- | --- | --- |
| **Compare two reviews** | `/insights/compare-two-reviews` | `CompareForm` · tenant-wide finalized inventory |
| **Nested architecture Compare** | `/architecture/architectures/{architectureId}/compare` | `ArchitectureNestedComparePageClient` — same gate, architecture-scoped pickers |
| **What-if branch banner** | `/architecture/reviews/{reviewId}?parentRunId=&autoCompare=1` | Polls until both seals exist |
| **Compare to baseline** | Review detail CTA | `CompareToBaselineCta` — still requires finalized pair at API |
| **Envelope preview** | Draft workspace | `DraftInvariantEnvelopePreview` — orientation only |
| **Seal delta** | Architecture desk | `ArchitectureSealDeltaPanel` — orientation only, not Compare |

## Journey table (Working — dies at Compare gate)

| Journey | User intent | Left | Right | Outcome | Blocked reason | Cheap path |
| --- | --- | --- | --- | --- | --- | --- |
| **draftVsDraft** | Compare two drafts as Career | Unsealed draft | Unsealed draft | **Blocked** | Draft-to-draft rejected (R12) | **SN-008** clone sketch |
| **draftVsSealedRun** | Diff live draft vs finalized review | In-flight draft | Sealed manifest | **Blocked** | Draft is not a manifest anchor | **SN-008** |
| **spawnLockedDraftVsSealedRun** | Compare spawn-locked handoff to seal | Spawn-locked handoff | Sealed manifest | **Blocked** | Synthesis handoff ≠ Compare side | **SN-008** |
| **inFlightRunVsSealedRun** | Compare in-progress run to baseline | Run w/o manifest | Sealed manifest | **Blocked** | Manifest diff skipped / 409 copy | — |
| **inFlightRunVsInFlightRun** | Compare two in-flight runs | Run w/o manifest | Run w/o manifest | **Blocked** | Neither side sealed | — |
| **labeledEnvelopePreview** | Treat envelope preview as Compare | Local preview | Any seal | **Orientation only** | Preview is not sealed Compare | **SN-008** |
| **labeledEnvelopeVsSeal** | Compare Rehearsal envelope to Career seal | ADR 0092 committed envelope | Career sealed manifest | **Allowed** | Both sides committed; stamps on pickers (SN-014 / CG-057) | **SN-014** |
| **whatIfBranchBeforeFinalize** | Auto-compare parent vs branch after submit | Parent run | Branch run | **Polls until sealed** | `bothRunsReadyForBranchCompare` | — |
| **comparePageInsufficientFinalized** | Open Compare with &lt;2 finalized reviews | Scope inventory | N/A | **Blocked** | `insufficientForCompare` | — |
| **nestedArchitectureCompareScoped** | Compare from architecture desk | Finalized (scoped) | Finalized (scoped) | **Blocked** until 2 seals | Same gate; scope filters pickers only | — |
| **architectureSealDeltaOrientation** | Use seal-delta as Compare | Current draft | Prior seal | **Orientation only** | Honesty copy — not Career Compare | **SN-008** |
| **compareToBaselineUnfinalizedCurrent** | Baseline vs in-flight current | Sealed baseline | In-flight run | **Blocked** | API 409 / missing manifest | — |

## Cheap path pointer (SN-008)

When a journey row lists **SN-008**, the operator should use **clone-from-snapshot** on the Working desk — a **Rehearsal-stamped** labeled envelope per ADR **0092**, not draft-diff Compare. **SN-009** adds cost-cap chrome; **CE** wave mounts the runner.

## Shrink rules

1. **Do not add** draft-diff Compare journeys without explicit owner approval (rejected by ADR 0092 / R12).
2. **Blocked** and **orientation-only** rows document honesty gaps — shrink when CE runner or SN-008 desk path resolves them.
3. Ratchet: `system-not-job-compare-gate-inventory.test.ts`.

## Verification

```bash
cd archlucid-ui && npm run test -- src/lib/system-not-job-compare-gate-inventory.test.ts
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj --filter 'FullyQualifiedName~SystemNotJobSn006CompareGate'
```
