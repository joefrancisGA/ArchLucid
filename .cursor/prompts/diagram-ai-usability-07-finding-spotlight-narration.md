# DAU-07 — Finding spotlight narration on the dual pane

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-04 (camera). **Do not** implement DAU-08–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When a finding is selected in the architecture findings dual pane, show **one or two sentences** that name the linked diagram component and the finding’s cited evidence — not only a highlight and “Linked component: …”.

## Why

`resolveFindingDiagramSelectionSync` already maps finding → node by id or label heuristic. Operators still have to bounce to Findings to learn *why*. Narration must stay grounded: finding title + match kind + `diagram:` citation if present. No new finding engine.

## Context

- `archlucid-ui/src/lib/architecture/architecture-findings-dual-pane.ts`
- `archlucid-ui/src/components/architecture/ArchitectureFindingsDualPane.tsx`
- `archlucid-ui/src/lib/findings/diagram-evidence-citation.ts`
- `ArchLucid.Decisioning/Findings/FindingDiagramEvidenceRefs.cs`
- Copy: `ARCHITECTURE_FINDINGS_DUAL_PANE_INTRO`, `formatLinkedComponentStatus`
- Simulator pattern: deterministic template first

AS-041 forbids a coverage engine for “node type missing from diagram.” This prompt only **explains an existing finding’s location**.

## What to build

1. `buildFindingDiagramSpotlight(sync, finding)` (pure TS):
   - `matchKind=none`: keep `ARCHITECTURE_FINDINGS_DUAL_PANE_NO_NODE_MATCH` (no invented component).
   - `node-id`: “This finding cites {label} on the diagram.”
   - `label-heuristic`: “Linked by name to {label} — not a package citation. Open findings for the full record.”
   - Append finding title, trimmed. Do not paraphrase severity into a fake score.
2. Dual-pane UI: `role="status"` under the linked-component line. Camera already fits via DAU-04 if wired; this prompt may pass `matchedNodeId` to `onHighlightedNodeIdChange` only if that callback exists and is unused for this path.
3. Optional Real LLM polish: **default skip**. If you add it, require `diagram:` or relatedNodeIds in the finding wire and drop the completion when it names a node not in `diagramNodes`.
4. Vitest: none / node-id / label-heuristic cases; heuristic copy must not claim a package citation.

## Acceptance criteria

- Selecting a finding with `RelatedNodeIds` matching a node shows that label and does not claim “evidence-backed” unless a `diagram:` ref exists.
- No match ⇒ existing empty copy, no guessed box.
- No new `IFindingEngine`.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** collapse workspace tabs. Dual pane stays on the Architecture tab.
- Sentence case. Visible-boundary buttons unchanged.
- Verification: `npx vitest run src/lib/architecture/architecture-findings-dual-pane.test.ts src/components/architecture/ArchitectureFindingsDualPane.test.tsx` plus new helper tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
