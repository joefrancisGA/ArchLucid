> **Scope:** ADR 0101 — AI diagram assist compiles into existing controls.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0101: AI diagram assist compiles into existing controls

- **Status:** Proposed
- **Date:** 2026-09-13
- **Owner decision:** AI may improve diagram *usability* only by compiling human intent into **existing** view tokens, model patches, and citations.

## Context

Owner 2026-09-13 asked how AI could make diagramming more usable without reopening the livelihood failures ADR 0084 already guards against: silent pixel drops, default-on vision, and unconstrained LLM topology. The product already ships inventory workbench modes, peel budgets, neighborhood seeds, dual-pane finding highlight, reconcile correspondence, and opt-in diagram vision. The usability hole is not missing a canvas — it is operators knowing which **existing** control to touch.

Assist features must compile human questions into **`DiagramViewPlan`** (closed `mermaidMode` set), accepted **`ArchitectureDiagramModel`** patches, grounded narration, or path/camera instructions over **already compiled** `DiagramAst` / models. They must not mint a parallel diagram family or relax pixel honesty.

**Related (not rewritten):** ADR 0084 (review inputs + NotVerifiable), ADR 0039 (sealed evidence), ADR 0068 (dual kernel), ADR 0080 (Working seat), ADR 0082 (decision-grade provenance).

## Decision

1. **Assist outputs are compilers, not generators.** Allowed outputs: validated `DiagramViewPlan` (mode, optional RG, seed, snapshot, fit target), accepted model patches, grounded narration from outline/AST counts, deterministic path/camera instructions on visible compiled graphs, and Ask citations from allowlisted structured rows.
2. **Mermaid, DOT, and SVG remain views.** An LLM must not become the diagram of record. Deterministic compilers/renderers (IE-16, IDH, IDG) stay the layout engines. No `mermaid.initialize` input from an LLM completion as source of truth.
3. **Vision/OCR stays Working opt-in, default off** (0084 §5). Per-shape accept is required before vision nodes enter a review model. Unaccepted shapes stay **NotVerifiable**.
4. **No minting or promotion.** AI **cannot** mint `CanonicalObject` / inventory resources from pixels or unlabeled boxes (R5). AI **cannot** promote reconcile `InsufficientEvidence` or `Possible` to `Confirmed`.
5. **Hand-edited models are not silently replaced.** Regenerate must merge or require explicit discard; Working undo/amend rules (ADR 0071) still apply.

**Rejected:** LLM-authored Mermaid as SoT; default-on vision; Lucid-class infinite canvas as this wave; collapsing review workspace tabs; second Azure collector; 40th coverage engine for missing node types.

## Trade-offs

**Gains:** Operators get one-click apply for modes they already have; camera and path helpers reuse compiled AST; Ask stays grounded on structured evidence; reviewers can block unconstrained generation by citing one ADR; cost stays bounded (one view-plan per question, not per-node layout LLM).

**Sacrifices:** Assist cannot invent layout when deterministic compilers refuse (Partitioned / peel); neighborhood and path features require honest “no path on this view” copy; validator strictness may feel rigid versus a free-form chat canvas; simulator templates are less fluent than unconstrained LLM prose; each new assist surface needs allowlist maintenance.

## Constraints

- **Do not** rewrite Accepted/Proposed ADR bodies 0067–0100 except **Related** pointers in follow-on PRs.
- **Do not** flip `ArchLucid:DiagramVision:Enabled` default to true.
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** fork a second Azure inventory collector.
- **Do not** add a coverage engine for “node type missing from diagram” (AS-041).
- Tenant-scoped Ask and vision paths must use **IPromptRedactor** and sealed-manifest guards (ADR 0039).
- Terraform for net-new infra follows existing patterns; this ADR authorizes application-layer compilers only.

## Expected impact

**System:** DAU-02+ ship `DiagramViewPlan` on Infrastructure Ask, workbench apply, density coach, smart camera, walkthrough templates, path highlight, reconcile overlay, and honesty ratchets — all as compilers over existing controls.

**Security:** View plans cannot invent ARM ids; vision stays opt-in; reconcile overlays cannot display Possible bands as Confirmed green; prompt redaction on Real Ask paths limits exfiltration. Tenant isolation (ADR 0037) unchanged.

**Operations:** Simulator honesty remains the default demo path; Real-mode LLM polish is optional and dropped when tokens leave the outline allowlist. Support can distinguish “plan rejected by validator” from “insufficient snapshot scope.”

**Cost:** One Ask completion per question for narration polish (when enabled), not per-node layout generation; no standing LLM layout worker.

**Teams:** Engineering implements closed validators + UI apply buttons; GTM does not need new buyer claims — assist compiles, it does not certify CPA SOC 2 or third-party pen tests.

## Consequences

- **Positive:** PR reviewers can reject LLM Mermaid SoT by citing ADR 0101; usability work stays on the IE/IDH/IDG spine.
- **Negative:** Some operator asks still require manual seed picking when labels are ambiguous.
- **Follow-ups:** DAU-02–DAU-12 implementation waves; acceptance doc `DIAGRAM_AI_USABILITY_ACCEPTANCE_2026-09-13.md` records Shipped/Partial per prompt.
