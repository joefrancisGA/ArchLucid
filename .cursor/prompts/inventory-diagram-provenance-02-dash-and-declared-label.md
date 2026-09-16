# IDP-02 — Dash declared edges and put `declared` in the label

**Wave:** inventory-diagram-provenance (**IDP**). **Depends on:** IDP-01. **Do not** implement IDP-03 outline click-through or IDP-04 AiInference dotted styling.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On Inventory diagrams, a human-declared edge must be **visually and textually** distinct from an extract-derived edge in **all three** renderers: forest SVG (usual canvas), Graphviz DOT/PNG, and Mermaid (export + client fallback). Pattern is the primary signal. Color stays the current slate. A legend appears when the AST contains at least one Declared edge.

## Why

IDP-01 carries the fields. Without this prompt the owner still cannot see the difference. Three renderers: if only forest dashes, Export Mermaid and Download PNG lie. Architecture-review diagrams already teach solid = asserted / dashed = inferred (`ArchitectureDiagramLegend`). Inventory should rhyme, not invent teal.

## Context

- `ArchLucid.ArtifactSynthesis/DiagramEdgeVisualKind.cs` (from IDP-01)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs` — hard-coded `stroke="#64748b"`, no dash
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` — `AppendEdges` solid `-->` ; node metadata is a **previous-line** `%%` comment (inline `%%` after a statement breaks Mermaid parse)
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` — `EmitVisibleEdges`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramLegend.tsx` — **pattern to copy**, do not reuse that component (it is review-diagram specific)
- `archlucid-ui/src/lib/architecture/architecture-diagram-copy.ts` — review legend strings; write **new** infra copy
- `archlucid-ui/src/lib/security-evidence-path-presentation.ts` — `formatSecurityEvidenceProvenanceKindLabel` (`HumanAssertion` → `Human assertion`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/MermaidDiagramRenderPipelineTests.cs` (or renderer tests that assert `-->`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstGraphvizDotEmitterTests.cs`
- `archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts` — may need a dashed fixture **only** if existing specs parse `-->` exclusively and would false-fail; do not churn IDH owner `.mmd`

Locked stroke for observed **and** declared: `#64748b` (current forest). Declared adds `stroke-dasharray`. Do **not** use `--al-accent-interactive` / teal on the line.

## What to build

1. Label (single helper, own file if it is more than a one-liner; otherwise a static method next to the visual-kind resolver):
   - When visual kind is `Declared`, prefix the humanized verb with `declared · ` (example: `declared · connects`, `declared · depends on`).
   - When the humanized label is empty, use `declared`.
   - Observed / AiInferred (until IDP-04): unchanged humanizer output.
   - Apply this at `DiagramAstFromGraphCompiler` when setting `DiagramEdge.Label` so forest, Mermaid, and Graphviz share one string. Do not re-prefix in each renderer.
2. Forest SVG (`DiagramForestEdgeLabelSvgEmitter.EmitEdgeGroup`):
   - Keep `stroke="#64748b"` and `stroke-width="1.5"`.
   - When kind is `Declared`, add `stroke-dasharray="4 3"`.
   - Set `data-provenance` and `data-inference` attributes on the `<g class="edge">` when those fields are non-empty (for tests and a11y, not color).
3. Mermaid (`AppendEdges`):
   - Layout-only: still `~~~`.
   - Observed: still `-->` / `-->|"label"|`.
   - Declared: `-.->` / `-.->|"label"|`.
   - When provenance or inference is set, emit a **previous-line** `%%` comment like nodes: `%% al-provenance=HumanAssertion al-inference=human-declared-connection` (quote values with the existing node metadata quoter).
   - Do **not** use `linkStyle` (index-fragile after packing `~~~` edges).
4. Graphviz (`EmitVisibleEdges`):
   - Declared: `[style=dashed, color="#64748b", label=...]` (include color so PNG does not pick a default rainbow). Observed stays as today plus explicit color only if tests require parity — prefer minimal diff: dashed+label for declared; untouched for observed.
5. Legend (UI):
   - New `InfraEvidenceDiagramLegend` (own file under `archlucid-ui/src/components/infra-evidence/`).
   - Show only when the rendered outline/AST/mermaid contains at least one declared edge (detect `-.->` **or** label starting with `declared` — prefer parsing metadata comments once IDP-03 lands; for this prompt, `-.->` and/or `declared ·` in edge labels is enough).
   - Copy (sentence case):
     - Heading: `Diagram legend`
     - `Solid — observed in Azure inventory`
     - `Dashed — declared (human assertion; not an ARM fact)`
   - Do not count nodes. Do not mention teal. Place it near the existing outline / under the viewer in `DiagramsWorkbenchClient` (both Architecture `/governance/infrastructure/diagrams` and SecureNow `/infrastructure/diagrams` share the client).
6. Tests:
   - Compiler/humanizer: HumanAssertion edge label is `declared · connects` (or the actual humanized verb for that fixture); inventory nic-subnet is **not** prefixed.
   - Forest: declared `<line>` has `stroke-dasharray`; observed line has no dasharray (or empty). Both `stroke="#64748b"`.
   - Mermaid: declared uses `-.->` and a `%% al-provenance=` line; observed still `-->`; `~~~` unchanged.
   - Graphviz: declared `style=dashed`; observed has no dashed style.
   - Vitest: legend hidden when only solid edges; visible when a `declared ·` / `-.->` edge exists; copy matches.
7. No outline Source column. No click-through. No AiInference dotted. No React Flow. No architecture-review legend edits.

## Acceptance criteria

- A merged declared `ConnectsTo` is dashed, labeled with `declared`, slate-colored, in forest SVG **and** Mermaid **and** Graphviz.
- An inventory nic-subnet (or peering) edge remains a solid slate line with today's verb.
- Download PNG (Graphviz path) and on-screen forest cannot disagree about dash vs solid for the same AST edge.
- Legend appears only when a declared edge is present.
- Layout-only edges stay invisible (`~~~` / `IsLayoutOnly`).

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** use teal or `--al-status-warn` as the declared stroke. **Do not** implement five provenance colors. **Do not** restyle architecture-review Mermaid (`architecture-diagram-mermaid.ts`).
- If an IDH owner `.mmd` fixture has no declared edges, leave it alone.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- UI: Carbon, sentence case, `OPERATOR_TYPOGRAPHY`. No desktop tab collapse.
- Verification:
  - `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~MermaidDiagram|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests|FullyQualifiedName~DiagramEdgeVisualKind'`
  - `cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx`
  - Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
