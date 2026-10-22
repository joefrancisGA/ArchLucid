# DAU-05 — Viewport walkthrough and click-to-explain from the AST

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-04. **Do not** implement DAU-06–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Give a grounded **plain-language walkthrough** of the current inventory/review diagram from the outline/AST (not from pixels), and a click-to-explain line that reuses provenance rules: evidence-backed / inferred / user-drawn / NotVerifiable.

## Why

`InfraEvidenceDiagramOutline` is the WCAG 1.1.1 peer. Sighted operators still get a picture with no caption. Provenance (`ArchitectureDiagramProvenancePanel`) answers “why is this here?” for review diagrams only, as a selected-element panel. Inventory nodes have ARM metadata in the outline table but no spoken/written summary of the *graph*.

## Context

- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`
- `archlucid-ui/src/lib/architecture/architecture-diagram-provenance.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramProvenancePanel.tsx`
- Ask Simulator: `InfraEvidenceAskPromptBuilder.BuildSimulatorAnswer` — pattern for deterministic templates
- TB-645 / NotVerifiable: `docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md`

AI is optional on Real; Simulator and default path must be a **deterministic template** from counts + labels. LLM may rewrite the template only if every noun is in the outline allowlist (same citation allowlist pattern as Ask).

## What to build

1. `buildDiagramWalkthrough(outline)` (pure TS, own file):
   - Example shape: “11 virtual networks in 5 connected groups. 6 visible peerings. 0 subgraphs.”
   - Use outline node/edge/subgraph counts already parsed. No LLM required for v1 of this helper.
2. `buildDiagramNodeExplain(node, provenanceClass, inventoryRow?)`:
   - Evidence-backed: cite ARM id / brief span already on the model.
   - Inferred: “Inferred from the brief — confirm or remove.”
   - User-drawn: existing editor copy.
   - NotVerifiable / missing inventory: TB-645 “Not verifiable from this diagram source.”
   - Never invent an ARM id when the outline cell is `—`.
3. UI:
   - Inventory workbench: a `role="status"` walkthrough line above the canvas (not a new tab). Optional **Read aloud** is **out of scope** unless `aria-live="polite"` on the status is already enough.
   - Review Architecture diagram: keep provenance panel; add the same walkthrough line from the model (node/edge counts, inferred pending count).
4. Optional Real-mode sentence polish: only behind existing Ask/LLM client + IPromptRedactor; output dropped if it contains a token not in the outline labels/ids. Default **off** if wiring is large — ship the deterministic template first.
5. Vitest for walkthrough strings on the owner-shape counts (11 nodes, 6 edges, 0 subgraphs) and NotVerifiable explain.

## Acceptance criteria

- Owner-shape outline produces a walkthrough that includes 11 and 6 and does not mention ARM ids that are not on the outline.
- Clicking a node without an ARM id does not fabricate one.
- No Mermaid regeneration.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** compute X→Y paths (DAU-06).
- **Do not** default-on LLM narration.
- Sentence case. `OPERATOR_TYPOGRAPHY`.
- Verification: focused Vitest. No full `npm run build`.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
