# DAU-01 — ADR 0101: AI diagram assist compiles into existing controls

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** none. **Do not** implement DAU-02–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Record the kernel so later PRs cannot “help usability” by emitting Mermaid from an LLM, turning vision on by default, or minting inventory resources from pixels.

## Why

Owner 2026-09-13 asked how AI could make diagramming more usable. The product already has modes, peel, neighborhood seed, dual-pane highlight, reconcile, and opt-in vision. The failure mode is unconstrained generation: LLM Mermaid as source of truth, default-on OCR, or a second diagram model family. ADR **0084** already forbids silent PNG drops and default-on vision. This ADR adds the **assist compiler** rule without rewriting 0084.

## Context

- Template: `docs/architecture/adrs/template.md` (mandatory Trade-offs / Constraints / Expected impact)
- Numbering: `docs/architecture/adrs/README.md` — next number is **0101** (do not reuse 0084–0100)
- Related (do not rewrite bodies): ADR 0084, 0039, 0068, 0080, 0082
- Honesty: `docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md`
- Plane: `docs/library/INFRA_EVIDENCE_PLANE.md`
- Wave index: `.cursor/prompts/diagram-ai-usability-00-index.md`

## What to build

1. New ADR `docs/architecture/adrs/0101-ai-diagram-assist-compiles-to-existing-controls.md`:
   - **Status:** Proposed
   - **Date:** 2026-09-13
   - **Owner decision:** AI may improve diagram *usability* only by compiling human intent into **existing** view tokens, model patches, and citations.
   - **Decision (must include all of):**
     1. Assist outputs are `DiagramViewPlan` (closed `mermaidMode` set matching inventory workbench), accepted `ArchitectureDiagramModel` patches, grounded narration, or path/camera instructions over **already compiled** `DiagramAst` / `ArchitectureDiagramModel`.
     2. **Mermaid, DOT, and SVG remain views.** An LLM must not become the diagram of record. Deterministic compilers/renderers (IE-16, IDH, IDG) stay the layout engines.
     3. Vision/OCR stays **Working opt-in, default off** (0084 §5). Per-shape accept is required before vision nodes enter a review model. Unaccepted shapes stay **NotVerifiable**.
     4. AI **cannot** mint `CanonicalObject` / inventory resources from pixels or unlabeled boxes (R5). AI **cannot** promote reconcile `InsufficientEvidence` or `Possible` to `Confirmed`.
     5. Hand-edited model versions must not be silently replaced by regenerate; merge or explicit discard.
   - **Rejected:** LLM-authored Mermaid as SoT; default-on vision; Lucid-class canvas as this wave; collapsing review tabs; second Azure collector; 40th coverage engine for missing node types.
   - Fill **Trade-offs**, **Constraints**, **Expected impact** with substantive prose (security: tenant-scoped Ask/vision + prompt redaction; cost: view-plan per question, not per-node layout LLM; ops: Simulator honesty).
2. Index row in `docs/architecture/adrs/README.md` immediately after 0100. Do not renumber.
3. Pointer from `docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md` **Related** to ADR 0101 (one sentence: assist compiles to view plans / patches; does not relax pixel rules).
4. Tests: none required beyond any existing ADR-index drift guard. If `docs/architecture/adrs/README.md` is asserted by a test, update that test.

## Acceptance criteria

- A reviewer can refuse a PR that adds `mermaid.initialize` input from an LLM completion by citing ADR 0101.
- ADR 0084 body is unchanged.
- Vision default-off is restated, not loosened.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** rewrite Accepted/Proposed ADR bodies 0067–0100 except a **Related** pointer in 0084 only if that file is clean — prefer the input-contract pointer instead of editing 0084.
- **Do not** implement DAU-02+ product code.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Verification: none beyond markdown + any ADR index test. No `dotnet build`.
