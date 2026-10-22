# IDG-02 — Render DiagramAst DOT with fdp to sanitized SVG

**Wave:** inventory-diagram-graphviz (**IDG**). **Depends on:** IDG-01 on the same branch lineage / trunk. **Do not** implement IDG-03–05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The API runtime must turn IDG-01 DOT into **sanitized SVG** via Graphviz **`fdp`** (not `dot`). Missing binary or non-zero exit **fails soft** to “no SVG” so Mermaid can still serve. Raw Graphviz SVG must pass the existing SVG sanitizer before any HTTP response.

## Why

Client Mermaid/dagre is the layout that produces the white sea. Server-side `fdp -Tsvg` is the layout engine. The Container App already installs Chromium + `@mermaid-js/mermaid-cli` for PNG; this prompt adds the much smaller `graphviz` apk package beside that, same pattern as mermaid-cli (image, not Terraform).

## Context

- IDG-01 emitter (`IDiagramAstGraphvizDotEmitter`)
- `ArchLucid.Api/Dockerfile` — runtime `apk add` already has `icu-libs nodejs npm chromium ttf-dejavu fontconfig`
- `ArchLucid.Application/Diagrams/MermaidCliDiagramImageRenderer.cs` — process + timeout pattern to **mirror**, do not call `mmdc` for Graphviz
- `ArchLucid.ContextIngestion/Diagram/SvgDiagramSanitizer.cs` — **reuse**. Do not fork a second sanitizer.
- `ArchLucid.Host.Composition` — register the new renderer
- `docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md` — raw `image/svg+xml` stays forbidden on authority ingest; this SVG is a **render artifact**, not a decide-path upload. Do not weaken the ingest allowlist.

## What to build

1. `IGraphvizLayoutRenderer` + `GraphvizFdpLayoutRenderer` (own files under Application or ArtifactSynthesis — pick one project and keep the interface with the implementation; prefer ArtifactSynthesis next to the emitter if it avoids a new package):
   - `Task<GraphvizLayoutRenderResult> RenderSvgAsync(string dot, CancellationToken ct)`
   - Result: `Succeeded`, `Svg` (sanitized), `Error` (safe, no DOT dump of customer graphs in logs beyond length/exit code).
   - Invoke `fdp` (or `dot -Kfdp`) with `-Tsvg`, stdin DOT, stdout SVG. Timeout (e.g. 10s). Working directory a temp folder deleted in `finally`.
   - Never `shell: true` with interpolated DOT. Arguments are fixed; DOT on stdin.
   - Configurable binary path: `ArchLucid:Graphviz:FdpPath` default `fdp`. `ArchLucid:Graphviz:Enabled` default `true` when you can detect the binary; if not found, `Succeeded=false` without throwing.
2. Sanitize: `SvgDiagramSanitizer.Sanitize(svg)`. If sanitizer rejects, treat as failed layout (fail-soft), do not return unsanitized markup.
3. Dockerfile runtime stage: `apk add --no-cache graphviz` with the existing font packages (DejaVu already present). Comment: inventory `fdp` layout; mermaid-cli remains for Mermaid PNG of **non-inventory** / export-mermaid paths until IDG-04. Do **not** run Graphviz as root; `USER archlucid` stays after the `apk` layer (apk must stay in the root `RUN` **before** `USER`, same as today).
4. Tests:
   - Emitter + renderer integration: if `fdp` is not on the test agent PATH, skip or stub process — **do not** fail CI on Windows agents without Graphviz. Prefer: unit-test the argv/stdin wiring with a fake process; plus a Linux-only test `Fact`/`Trait` that runs real `fdp` when `GetFullPath` finds it.
   - Sanitizer: Graphviz SVG containing `<script>` or `onclick` is stripped/rejected (reuse sanitizer tests; add one fixture that looks like Graphviz `g.node` output).
   - Fail-soft: missing binary → `Succeeded=false`, `Svg=null`, no exception.
5. Composition: register scoped renderer. Do **not** change mermaid routes' JSON shape yet (IDG-03). A small internal API used by tests is enough.
6. No UI. No OpenAPI unless you must — prefer not in this prompt.

## Acceptance criteria

- `fdp` on PATH + owner-shape DOT → sanitized SVG with 11 node groups and 6 edges, **not** a 4000-wide empty plate (assert viewBox width/height ratio or node transform spread in a unit parse of the SVG when `fdp` is available).
- Docker file lists `graphviz`. No Terraform module (same as mermaid-cli).

## Constraints

- Working-tree safety before tracked edits.
- **Do not** use Graphviz `dot` layered layout as the default command.
- **Do not** log full DOT or SVG (customer architecture).
- **Do not** edit `scripts/azure/Get-ArchLucidAzurePackage.ps1`.
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~Graphviz'` (and Application.Tests if the renderer lives there).
- Compile if C# public surface moved: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'` with heartbeat >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
