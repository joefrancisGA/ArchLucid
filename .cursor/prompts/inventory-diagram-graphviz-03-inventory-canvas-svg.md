# IDG-03 — Inventory workbench paints Graphviz SVG; Export Mermaid stays Mermaid

**Wave:** inventory-diagram-graphviz (**IDG**). **Depends on:** IDG-01 and IDG-02. **Do not** implement IDG-04–05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`GET` inventory snapshot mermaid (existing route family) must also return a **sanitized layout SVG** when Graphviz succeeded. The Inventory diagrams workbench paints that SVG in the existing viewport chrome (zoom, fullscreen, outline tables). **Export Mermaid (saved)** still downloads `DiagramAst` Mermaid text. Review-detail architecture diagrams that are human Mermaid artifacts stay on client Mermaid.

## Why

Owner will not get an acceptable Executive picture until the workbench stops asking the browser to dagre-layout the forest. The outline tables already have the right 11 nodes / 6 edges. Only the canvas engine changes.

## Context

- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceMermaidRenderResponse.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs`
- `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceSnapshotsController.cs` mermaid actions
- OpenAPI snapshot + `ARCHLUCID_REGENERATE_UI_API_TYPES` if the contract grows (see PR template)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx`
- `archlucid-ui/src/lib/mermaid-import-policy.test.ts` — inventory may **avoid** dynamic mermaid import when SVG is present (bundle win). Do not add a static `from "mermaid"` import.
- `docs/library/API_CONTRACTS.md` / OpenAPI drift rules

## What to build

1. Extend `InfraEvidenceMermaidRenderResponse` (keep the type name to avoid a wholesale rename in this prompt):
   - `string? LayoutSvg` — sanitized SVG or null
   - `string? LayoutEngine` — `"graphviz-fdp"` | `"mermaid-dagre"` (or omit when mermaid-only)
   - `Mermaid` **always** still populated on success (export + outline parsers that read source)
2. `InfraEvidenceSnapshotMermaidService`: after AST compile, emit DOT (IDG-01) and render SVG (IDG-02). If Graphviz fails, `LayoutSvg=null`, `LayoutEngine=mermaid-dagre`, status remains the Mermaid pipeline status (do not fail the whole render because `fdp` is missing in a dev profile).
3. OpenAPI contract snapshot + generated TS types. Additive JSON fields, nullable.
4. UI:
   - When `layoutSvg` is a non-empty string, `ArchitectureDiagramViewer` (or a sibling `ArchitectureDiagramSvgCanvas` in its own file) paints SVG via the **existing sanitizer/innerHTML path used for mermaid SVG** — do not `dangerouslySetInnerHTML` unsanitized. Prefer inserting already-sanitized markup the same way mermaid SVG is inserted today.
   - When `layoutSvg` is null, keep today’s client Mermaid path (fail-soft).
   - Export Mermaid button still uses `mermaid` string. Do not export DOT from this prompt unless you already have a tiny “copy DOT” behind a disclosure — default **no** (operators asked for diagrams, not Graphviz source).
5. Tests:
   - API/application: owner-shape compile sets `LayoutEngine` to `graphviz-fdp` when the renderer stub returns SVG; mermaid string still contains `flowchart` and 6 `peered` edges.
   - UI: workbench with `layoutSvg` does not call `mermaid.render` (mock). Workbench without `layoutSvg` still does.
   - mermaid-import-policy still holds if you touch imports.
6. Do **not** implement fit/PNG (IDG-04) beyond “SVG shows in the viewport at natural size”. A slightly loose Graphviz viewBox is OK until 04.

## Acceptance criteria

- Inventory Executive with Graphviz up: canvas is SVG from `fdp`, outline still 11/6, Export Mermaid still `.mmd`.
- Graphviz down: canvas still Mermaid (today’s behavior), no 500.

## Constraints

- Working-tree safety before tracked edits.
- **Do not** retune Mermaid `nodeSpacing`. **Do not** change the extractor.
- Visible-boundary `Button`. Sentence case. No ghost/link.
- If OpenAPI changes: follow `docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md` regenerate notes — only if this prompt’s contract actually changed.
- Verification:
  - `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaid'`
  - `cd archlucid-ui && npx vitest run src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx src/components/architecture/ArchitectureDiagramViewer.test.tsx`
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
