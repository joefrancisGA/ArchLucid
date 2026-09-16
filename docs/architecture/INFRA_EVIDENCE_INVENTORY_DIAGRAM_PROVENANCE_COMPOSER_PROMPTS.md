> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **Inventory diagrams** distinguish human-declared connections from extract-derived edges. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-provenance-00-index.md`](../../.cursor/prompts/inventory-diagram-provenance-00-index.md) (one numbered file per session).
>
> **Do not** use teal as a provenance stroke. **Do not** encode provenance in color alone. **Do not** re-run **IDL / IDS / IDT / IDH / IDG / IDR**.

# IDP-01–IDP-04 — Declared connections vs inventory edges on diagrams

**Observed (2026-09-16):** Owner asked what distinguishes a declared connection from a connection derived from extracted data, then asked to restyle human connections. Backend already merges active declarations into snapshot relationships as `ProvenanceKind.HumanAssertion` + `InferenceSource = human-declared-connection`. Inventory diagrams then drop that distinction: `DiagramEdge` has no provenance fields; forest SVG, Mermaid, and Graphviz all paint a solid `#64748b` line labeled `connects`.

**Product framing (locked):** dash pattern + the word `declared` in the label. Color is not the signal. Carry provenance through the AST before painting. Click-through to rationale/expiry lives on the outline, not on the line.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| `ProvenanceKind` dropped at `GraphEdge`; `InferenceSource` dropped at `DiagramEdge` | **IDP-01** | IDP-02 has nothing to style |
| Three renderers share one unlabeled solid stroke | **IDP-02** | Canvas honest, PNG/Mermaid liars (or the reverse) |
| Rationale/approver/expiry trapped on the workbench | **IDP-03** | Auditor cannot ask “why does this line exist?” from the diagram |
| Binary visual language cannot name `AiInference` later | **IDP-04** | Do not start until AI-inferred inventory edges exist **or** owner names 04 |
| Teal / five-color / promote-to-observed | **IDP-HOLD** | Honesty regression |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDP-01** Carry provenance onto `GraphEdge` / `DiagramEdge` | First | trunk (declared-connection merger already on trunk) |
| **IDP-02** Dash + `declared` label in forest, Mermaid, Graphviz + legend | After 01 | IDP-01 |
| **IDP-03** Outline Source + rationale panel | After 01; after 02 preferred | IDP-01 (IDP-02 preferred) |
| **IDP-04** Three visual kinds (dotted `inferred`) | After 02; skip until gated | IDP-02 |
| **IDP-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-provenance-<short-name>-41fd`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- HumanAssertion stays HumanAssertion. Do not promote declared edges to ObservedFact.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Merger already stamps HumanAssertion + `human-declared-connection`. The gap is the diagram pipeline, not collection.
- `GraphEdge` SchemaVersion 1: additive optional fields only. Store `ProvenanceKind` as `string?` on `GraphEdge` (Contracts must not reference the Core enum).
- Live Full subscription canvas is inventory-forest SVG when `layoutSvg` is present. PNG still goes through Graphviz. Mermaid is export + client fallback. Style all three or none.
- Architecture-review diagrams already use solid = asserted / dashed = inferred. Inventory must rhyme (`ArchitectureDiagramLegend`) — do not restyle that surface.
- Teal (`--al-accent-interactive`) is CTA/focus, not provenance. Color-only encoding fails grayscale PNG.
- Mermaid `%%` comments must be **previous-line**, not inline after `-->` (node metadata already learned this).
- `linkStyle N` is forbidden (packing `~~~` edges shift indexes).

### Locked visual language

| Kind | Stroke | Label extra | When |
|------|--------|-------------|------|
| Observed (ObservedFact, DerivedFact, DeterministicInference) | solid `#64748b` | none | IDP-02 |
| Declared (HumanAssertion / `human-declared-connection`) | dashed `4 3`, same slate | `declared ·` | IDP-02 |
| AiInferred (AiInference) | dotted `1 3` on forest/Graphviz; Mermaid uses label+comment | `inferred ·` | IDP-04 only |

---

# IDP-01 — Carry provenance onto GraphEdge and DiagramEdge

**Depends on:** trunk · **Branch:** `cursor/inventory-diagram-provenance-carry-fields-41fd`

**Paste file:** [`.cursor/prompts/inventory-diagram-provenance-01-carry-edge-provenance.md`](../../.cursor/prompts/inventory-diagram-provenance-01-carry-edge-provenance.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: copy ProvenanceKind and InferenceSource from snapshot relationships onto GraphEdge and DiagramEdge. Add DiagramEdgeVisualKindResolver (Observed / Declared / AiInferred). Do not dash, recolor, or change labels.

Locked diagnosis: SecurityDeclaredConnectionSnapshotMerger already stamps HumanAssertion + human-declared-connection. AzureInventorySnapshotGraphResolver drops ProvenanceKind. DiagramAstFromGraphCompiler uses InferenceSource only inside the label humanizer. DiagramEdge is From/To/Label/IsLayoutOnly.

This is NOT IDP-02/03/04. No -.->, no stroke-dasharray, no legend.

Read first:
- .cursor/prompts/inventory-diagram-provenance-00-index.md
- .cursor/prompts/inventory-diagram-provenance-01-carry-edge-provenance.md
- ArchLucid.Contracts/Persistence/Graph/GraphEdge.cs
- ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs
- ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~DiagramEdgeVisualKind'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AzureInventorySnapshotGraphResolver|FullyQualifiedName~SecurityDeclaredConnectionSnapshotMergerTests'
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~GraphEdgeJsonConverterTests'

Done when:
- A HumanAssertion graph edge becomes a DiagramEdge with ProvenanceKind and InferenceSource set
- Labels are still connects / depends on with no declared prefix
- Old graph JSON without provenanceKind still deserializes
```

---

# IDP-02 — Dash declared edges and put `declared` in the label

**Depends on:** IDP-01 · **Branch:** `cursor/inventory-diagram-provenance-dash-label-41fd`

**Paste file:** [`.cursor/prompts/inventory-diagram-provenance-02-dash-and-declared-label.md`](../../.cursor/prompts/inventory-diagram-provenance-02-dash-and-declared-label.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: declared inventory-diagram edges are dashed slate lines labeled "declared · {verb}" in forest SVG, Mermaid, and Graphviz. Observed edges stay solid. Legend appears only when a declared edge exists.

Locked stroke: #64748b for both kinds. No teal. Style all three renderers. Mermaid uses -.-> and a previous-line %% al-provenance comment. No linkStyle. Prefix the label once in the compiler so PNG/export cannot diverge.

This is NOT IDP-03 click-through, NOT IDP-04 dotted AI, NOT architecture-review legend edits.

Read first:
- .cursor/prompts/inventory-diagram-provenance-00-index.md
- .cursor/prompts/inventory-diagram-provenance-02-dash-and-declared-label.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs
- ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs
- ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs
- archlucid-ui/src/components/architecture/ArchitectureDiagramLegend.tsx

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~MermaidDiagram|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests|FullyQualifiedName~DiagramEdgeVisualKind'
cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx

Done when:
- Declared ConnectsTo is dashed + "declared" in forest, Mermaid, and Graphviz
- Inventory nic-subnet remains solid with today's verb
- Legend hidden on declared-free diagrams
```

---

# IDP-03 — Outline Source column and click-through to declaration accountability

**Depends on:** IDP-01; IDP-02 preferred · **Branch:** `cursor/inventory-diagram-provenance-outline-rationale-41fd`

**Paste file:** [`.cursor/prompts/inventory-diagram-provenance-03-outline-and-rationale.md`](../../.cursor/prompts/inventory-diagram-provenance-03-outline-and-rationale.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Inventory diagrams Edges outline has a Source column (Declared / Observed). Activating a declared row opens a read-only panel with rationale, evidence reference, approver, expiry, status, and a product-line link to the Declared connections workbench.

Stamp DeclaredConnectionId at merge time onto the relationship/graph/AST (not a SQL column). Parse %% al-declared-id from Mermaid. Do not add GET-by-id unless list cannot match. Security shell link is /infrastructure/declared-connections.

This is NOT IDP-04. Do not embed the create form in the panel.

Read first:
- .cursor/prompts/inventory-diagram-provenance-00-index.md
- .cursor/prompts/inventory-diagram-provenance-03-outline-and-rationale.md
- ArchLucid.Application/InfraEvidence/SecurityDeclaredConnections/SecurityDeclaredConnectionSnapshotMerger.cs
- archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts
- archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx
- archlucid-ui/src/lib/security-declared-connection-api.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~SecurityDeclaredConnectionSnapshotMergerTests|FullyQualifiedName~AzureInventorySnapshotGraphResolver'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~MermaidDiagram|FullyQualifiedName~DiagramAstFromGraphCompilerTests'
cd archlucid-ui && npx vitest run src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.test.ts src/lib/infra-evidence/infra-evidence-diagram-outline-sort.test.ts src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx

Done when:
- Mixed diagram outline shows Declared vs Observed
- Declared row control opens rationale/expiry (or honest not-found) + workbench link
- Snapshot SQL unchanged
```

---

# IDP-04 — Three visual kinds (Observed / Declared / AiInferred)

**Depends on:** IDP-02 · **Gate:** run only when an inventory-diagram fixture has AiInference edges **or** the owner names IDP-04 · **Branch:** `cursor/inventory-diagram-provenance-ai-inferred-kind-41fd`

**Paste file:** [`.cursor/prompts/inventory-diagram-provenance-04-visual-kind-resolver.md`](../../.cursor/prompts/inventory-diagram-provenance-04-visual-kind-resolver.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: map five ProvenanceKind values onto three visual kinds. Observed stays solid. Declared stays dashed + "declared". AiInferred is dotted on forest/Graphviz with "inferred ·" in the label. Legend row for dotted only when that kind is present.

Do not mint fake AiInference collector edges. Do not use five colors. Mermaid has no reliable third arrow — label + %% al-provenance distinguish declared vs inferred there.

This is NOT IDP-03. Do not restyle path-inspector tables.

Read first:
- .cursor/prompts/inventory-diagram-provenance-00-index.md
- .cursor/prompts/inventory-diagram-provenance-04-visual-kind-resolver.md
- ArchLucid.ArtifactSynthesis/DiagramEdgeVisualKind.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramEdgeVisualKind|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~MermaidDiagram|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'
cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx

Done when:
- DerivedFact/DeterministicInference still render as Observed
- Constructed AiInference edge is dotted (forest/DOT) and labeled inferred
- Declared remains dashed, not dotted
```

---

# IDP-HOLD — No teal, no five-color legend, no promote-to-observed

**Not implementation.** Paste file: [`.cursor/prompts/inventory-diagram-provenance-05-hold.md`](../../.cursor/prompts/inventory-diagram-provenance-05-hold.md)

---

## Follow-on (not IDP-05)

Expiry-near amber (decay) is a separate signal. Do not overload dash with “about to expire.” Path-inspector hop provenance labels stay the five-enum table language.
