> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompt that makes **existing** inventory swimlane frames enclose their nodes. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-cluster-overflow-00-index.md`](../../.cursor/prompts/inventory-diagram-cluster-overflow-00-index.md) (one numbered file per session).
>
> **Do not** re-run **IDL / IDS / IDT / IDH / IDG / IDR**. **Do not** pack inventory-forest by resource group (**IDR-HOLD** still stands). This wave does **not** draw new forest boxes; it repairs lying cluster chrome on Graphviz/Mermaid canvases.

# IDF-01 — Inventory diagrams: cluster box must contain member nodes

**Observed (2026-09-16):** Owner Inventory diagrams Executive, snapshot captured 9/10/2026 (424 resources). All always-show tiers on. Nested dashed swimlanes. Circled node **`avd01 pner nonprod persistens...`** sticks out of the parent bounding box. Shorter nodes in the same column stay inside.

**Prior waves:** **IDL/IDS/IDT/IDH** Mermaid layout; **IDG** Graphviz `fdp` from `DiagramAst` (emits `cluster_*` for remaining subgraphs); **IDR** forest **captions** only — forest still does not paint RG frames. Residual: clustered fallback canvases use the layout engine’s cluster bb, which is narrower than the widest truncated-label node.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Cluster chrome from fdp/dagre bb, not painted node union | **IDF-01** | Owner screenshot unchanged: wide `...` node hangs out of the dashed box |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDF-01** Fit cluster rect/polygon to member-node union after labels are final | First | trunk |

**Run one prompt per chat.** Feature branch: `cursor/inventory-diagram-cluster-bbox-e579`.

## Shared constraints

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- The circled overflow is a **frame vs node-width** bug, not missing inventory and not a camera crop (nodes remain visible because SVG overflow is visible and crop prefers node union).
- Inventory-forest does not paint these boxes. Nested dashed frames mean Graphviz `fdp` clusters and/or Mermaid subgraphs. Fix **both** in `sanitizeArchitectureDiagramSvg` so `layoutSvg` and client Mermaid share the pass.
- Graphviz `fdp` does not layout clusters; DOT still emits `subgraph cluster_*`. Do not switch the default engine to `dot` to “get clusters for free.”
- Auto-generated names ellipsize to one long line; that line is wider than short siblings. Uniform 400px wrappingWidth is **not** the painted node width.
- **IDR-HOLD** forbids drawing **new** forest RG frames from an IDR chat. IDF-01 only **resizes existing** `g.cluster` chrome.

---

# IDF-01 — Fit cluster frames to member-node union

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-cluster-bbox-e579`

**Paste file:** [`.cursor/prompts/inventory-diagram-cluster-overflow-01-cluster-bbox-from-node-union.md`](../../.cursor/prompts/inventory-diagram-cluster-overflow-01-cluster-bbox-from-node-union.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: after inventory/architecture SVG labels are final, rewrite each existing g.cluster frame (Mermaid rect, Graphviz polygon) to the SVG user-space union of its member nodes plus pad, so a wide truncated-label node cannot stick out of the dashed swimlane. Do not move nodes. Do not pack forest by resource group. Do not switch fdp to dot. Do not retune nodeSpacing.

Owner screenshot (do not re-diagnose): Inventory diagrams Executive, 9/10/2026 snapshot, always-show tiers on, nested dashed boxes, node "avd01 pner nonprod persistens..." sticking out of the parent bounding box.

This is NOT IDL/IDS/IDT/IDH/IDG/IDR. Do not draw new forest RG frames (IDR-HOLD). Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- .cursor/prompts/inventory-diagram-cluster-overflow-00-index.md
- .cursor/prompts/inventory-diagram-cluster-overflow-01-cluster-bbox-from-node-union.md
- archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts
- archlucid-ui/src/lib/help/help-mermaid.ts (mapLocalBBoxToSvgUserSpace, queryInventoryDiagramNodeElements)
- ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'
Exit 2 → skip that path and report.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/architecture/fit-inventory-diagram-cluster-frames.ts src/lib/architecture/architecture-diagram-svg.ts
(adjust paths to the files you actually add/extend)

Done when:
- Overflow fixture: cluster contains the wide "..." node plus pad; node geometry unchanged
- Nested clusters: inner then outer
- Forest SVG with no g.cluster is unchanged
- Probe: without the rewrite the overflow fixture fails
```
