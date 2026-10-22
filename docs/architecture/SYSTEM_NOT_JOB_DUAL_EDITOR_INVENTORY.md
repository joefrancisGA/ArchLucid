> **Scope:** Shrink-only inventory — draft workspace vs review **Architecture** tab after spawn-lock (`spawnedRunId`). Names which narrative fields can still diverge in parallel. **Do not change lock behavior in this file.** SN-004 owns spawn-lock mutations.

> **Spine:** ADR **0092** · ADR **0068** · ADR **0072** · IA-007 · `architecture-draft-handoff-gate.ts`

# System-not-job dual live editor inventory (SN-002)

**Last reviewed:** 2026-09-11

After start review, synthesis (`DraftRequests`) and evaluation (`Runs`) stay two kernels. The livelihood failure is **two writers for one narrative** — draft autosave PATCH vs review Architecture tab snapshot / intake rerun.

**IA-007 (Done 2026-07-14)** shipped a soft handoff gate. **RS-04** removed the post-spawn “edit anyway” path. **Working** spawn-locked drafts now render `ArchitectureDraftHandoffPanel` (LK-04 / AO-07) instead of editable fields. This inventory names what remains parallel or alternate-writer — not fixed here.

## Routes

| Surface | Canonical path | Module anchor |
| --- | --- | --- |
| **Draft workspace** | `/architecture/architectures/{architectureId}/drafts/{draftId}` (Working nested); legacy `/architecture/architectures/{draftId}` | `ArchitectureDraftWorkspace` · `use-architecture-draft-workspace.ts` |
| **Review Architecture tab** | `/architecture/reviews/{reviewId}` (`reviewTab=architecture`) | `resolve-run-detail-tabbed-workspace.tsx` · `RunDetailSubmittedArchitectureSection` |

**Spawn-lock signal:** `architectureDraftSpawnedRunId(draft)` → `handoffEditorLocked` disables autosave and form fields (`enabled: !handoffEditorLocked`).

## Parallel classes

| Class | Meaning | Typical owner |
| --- | --- | --- |
| **locked** | Draft PATCH disabled when `spawnedRunId` set; review tab read-only snapshot | SN-004 ratchet only |
| **read-only-snapshot** | Review Architecture tab displays submitted material; no inline editor | SN-004 / SN-013 |
| **alternate-writer** | Different route mutates narrative (not draft autosave) while review is open | SN-003 · SN-004 |
| **separate-kernel** | Review tab content outside synthesis narrative (engines, graph, findings) | intentional — not dual architecture editor |

## Field inventory (draft vs Architecture tab)

| Field | Draft route | Review Architecture tab | Spawn-locked? | Parallel live edit after spawn? |
| --- | --- | --- | --- | --- |
| **`systemName`** | `ArchitectureDraftFormFields` → PATCH `document.systemName` | `userAssertions.architectureName` in `ArchitectureStructuredContentPanel` (read-only) | **Yes** — `editorLocked` + autosave off | **No** — draft disabled; tab snapshot only |
| **`freeTextIntent`** (architecture overview) | Textarea → PATCH `document.freeTextIntent` | Submitted narrative markdown preview / structured panel source text | **Yes** | **No** on draft; tab read-only |
| **`businessOutcome`** | Textarea → PATCH `document.businessOutcome` | `userAssertions.businessOutcome` (read-only) | **Yes** | **No** |
| **`structuredBrief`** (constraints, assumptions, capabilities, quality, failure mode, owner) | `ArchitectureDraftStructuredBriefFields` → PATCH `document.structuredBrief` | Not inline-edited on Architecture tab (derived from submitted/handoff snapshot) | **Yes** | **No** |
| **`openQuestions`** | Textarea → PATCH `document.openQuestions` | Not shown as editable on Architecture tab | **Yes** | **No** |
| **`actorSet`** (people and systems) | `DraftIntakeActorEditor` → PATCH `document.actorSet` | `userAssertions.peopleAndSystems` (read-only) | **Yes** | **No** |
| **`autosavePatch`** (all document fields) | `useArchitectureDraftAutosave` on draft routes | N/A | **Yes** — `enabled: !handoffEditorLocked` | **No** |
| **`aiRefineReasoning`** | `ArchitectureDraftAiRefinePanel` · `DraftIntakeReasoningPanel` | N/A | **Yes** — hidden/disabled when `handoffEditorLocked` | **No** |
| **`scopeUnderstandingCheck`** | `ArchitectureScopeUnderstandingCheckPanel` | N/A | **Yes** — intake stack disabled with `editorLocked` | **No** |
| **`invariantEnvelopePreview`** | `DraftInvariantEnvelopePreview` | N/A | **Yes** — hidden when `handoffEditorLocked` (Working) | **No** |
| **`startArchitectureReview`** | `ArchitectureDraftWorkspaceStartReviewFooter` | N/A | **Yes** — footer disabled when `handoffEditorLocked` | **No** |
| **`workLease`** (acquire/steal) | `useArchitectureDraftWorkLease` | N/A | **Yes** — `workLeaseEnabled` false when spawn-locked | **No** |
| **`submittedArchitectureSnapshot`** | Handoff panel shows frozen field summary only (Working) | `RunDetailSubmittedArchitectureSection` — copy + expand; not inline PATCH | **Yes** on draft | **No** inline; see alternate-writer row |
| **`editSourceGuidedIntakeRerun`** (Edit source) | N/A (not draft workspace) | Suppressed for **Created**-origin in-flight reviews; **Reviewed**-origin may rerun guided intake when `!manifestId` | **Yes** for Created-origin | **No** — SN-004 one writer; Architecture tab is review snapshot |
| **`technologyBaseline`** | N/A | `RunDetailTechnologyBaselineSection` (read-only) | N/A | **No** — separate-kernel display |
| **`architectureGraph`** | N/A | `RunDetailArchitectureGraphIsland` (derived) | N/A | **No** — separate-kernel display |
| **`findingsEvidenceDecisions`** | N/A | Other review workspace tabs | N/A | **No** — evaluation kernel; not architecture draft editor |

## IA-007 leftover (named — not fixed in SN-002)

| Leftover | Evidence | Owner |
| --- | --- | --- |
| **Soft gate → hard Working handoff** | IA-007 originally allowed “edit anyway” with this-browser ack; RS-04 clears ack and locks spawned drafts | Shipped — `architecture-draft-handoff-gate.ts` |
| **Review “Edit source” alternate writer** | SN-004 suppresses guided-intake rerun for Created-origin; Reviewed-origin rerun remains when `!manifestId` | **SN-004** (shipped one-writer ratchet) |
| **Legacy draft URL bookmark** | `/architecture/architectures/{draftId}` — SN-003 snapshot handoff; SN-005 back targets review job or desk via `working-back-href` | **SN-005** (shipped) |
| **Working nested draft redirect** | Spawn-locked nested draft URL redirects to identity desk (`drafts/[draftId]/page.tsx`) but legacy path may still load workspace | **SN-003** |
| **Repeat-seat server-visible ack** | RS-04 / repeat-seat-04 — cross-browser divergence choice deferred | GTM / repeat-seat wave |

## Shrink rules

1. **Do not grow** parallel-live-edit rows without a named SN prompt. New alternate writers fail Vitest until listed.
2. **Locked** rows should stay **spawn-locked? = Yes** and **parallel = No** after SN-004; shrink when behavior tightens.
3. **Alternate-writer** class should not return for synthesis narrative fields after SN-004; shrink when behavior tightens.
4. Ratchet: `system-not-job-dual-editor-inventory.test.ts`.

## Verification

```bash
cd archlucid-ui && npm run test -- src/lib/system-not-job-dual-editor-inventory.test.ts
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj --filter 'FullyQualifiedName~SystemNotJobSn002DualEditor'
```
