# IDP-04 — Three visual kinds (Observed / Declared / AiInferred)

**Wave:** inventory-diagram-provenance (**IDP**). **Depends on:** IDP-02. **Do not** start this prompt until an inventory-diagram fixture actually contains `ProvenanceKind.AiInference` edges **or** the owner explicitly asks to run IDP-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Keep **three** visual kinds, not five colored line styles. Wire `AiInferred` to a **dotted** stroke and an `inferred` label extra. Collapse ObservedFact, DerivedFact, and DeterministicInference to **Observed** (solid, no extra word). HumanAssertion stays **Declared** (dashed, `declared`) from IDP-02. Update the legend only when the AST contains that kind.

## Why

IDP-02 is binary on purpose: the owner asked how to tell human declarations from extract. The plane has five `ProvenanceKind` values. Five strokes plus five colors is a legend nobody memorizes and a grayscale-print failure. Architecture-review diagrams already use two patterns (solid/dashed). A third pattern (dotted) is the budget for AI-authored inventory edges. DerivedFact / DeterministicInference remain visually Observed because they are still inventory-backed, not human-declared.

## Context

- `ArchLucid.ArtifactSynthesis/DiagramEdgeVisualKind.cs` (enum already has `AiInferred` from IDP-01)
- Forest / Mermaid / Graphviz emitters from IDP-02
- `InfraEvidenceDiagramLegend`
- `archlucid-ui/src/lib/security-evidence-path-presentation.ts` (keep path-inspector labels; do not change that table to dotted lines)
- Plane: [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) — AI explains evidence; AI is not the evidence. Dotted `inferred` must not read as ObservedFact.

If **no** production inventory path currently sets `AiInference` on snapshot relationships, still implement the renderer branches and tests with **constructed AST fixtures**. Do **not** mint fake AiInference edges in `SecurityDeclaredConnectionSnapshotMerger` or the Azure collector to “have something to draw.”

## What to build

1. Label helper (IDP-02):
   - `Declared` → `declared · {verb}` (unchanged)
   - `AiInferred` → `inferred · {verb}` (or `inferred` when verb empty)
   - `Observed` → verb only
2. Forest SVG:
   - Observed: solid `#64748b`
   - Declared: dash `4 3`, same stroke
   - AiInferred: **dotted** `stroke-dasharray="1 3"` (must not equal declared `4 3`), same stroke
   - `data-visual-kind` on the edge group (`observed` / `declared` / `ai-inferred`)
3. Mermaid:
   - Observed `-->`
   - Declared `-.->`
   - AiInferred: use Mermaid dotted `-.->` **only if** you can still distinguish declared vs inferred via the `%% al-provenance=` comment **and** the `inferred ·` label. Do **not** collapse declared and AI to the same arrow **without** both comment and label. Prefer `-.->` for both non-solid kinds **only because** label+comment carry the class (document that in the legend: “Dashed — not observed; read the label”).
   - **Locked decision:** Mermaid  flowchart does not give a third arrow that PNG/export users will notice. Forest + Graphviz must show dotted vs dashed. Mermaid export relies on **label extra** (`declared` vs `inferred`) + `al-provenance`. Tests assert those, not a fictional third arrow token.
4. Graphviz:
   - Declared: `style=dashed`
   - AiInferred: `style=dotted`
   - Observed: default solid
   - Color remains `#64748b` when set
5. Legend:
   - Rows present only for kinds that appear:
     - `Solid — observed in Azure inventory`
     - `Dashed — declared (human assertion; not an ARM fact)`
     - `Dotted — AI inference (not an ARM fact; confirm)`
   - Do not list unused kinds. Do not list all five provenance enum names.
6. Tests:
   - Resolver still maps DerivedFact and DeterministicInference → Observed (solid, no extra word).
   - Constructed AiInference `DiagramEdge` is dotted in forest + `style=dotted` in DOT + label starts with `inferred`.
   - Declared fixture from IDP-02 still dashed, not dotted.
   - Legend shows the AI row only when an inferred edge exists; does not show it on a declared-only diagram.
7. No outline Source values beyond observed/declared unless you add `Inferred` as a third source string — **allowed** (`"observed" | "declared" | "inferred"`). If you add it, sort + sentence-case **Inferred**. Do not call it Observed.
8. No teal. No collector changes. No promoting AiInference to ObservedFact.

## Acceptance criteria

- Five provenance enum values never become five strokes.
- AI-inferred inventory edges cannot be mistaken for HumanAssertion (dotted vs dashed on forest/PNG; `inferred` vs `declared` in the label everywhere including Mermaid).
- Inventory ObservedFact edges unchanged from IDP-02.
- Path inspector copy still uses `formatSecurityEvidenceProvenanceKindLabel` (full enum names there are correct).

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** run this prompt as busy-work before AiInference exists on the canvas unless the owner names IDP-04.
- **Do not** use color to split the three kinds.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification:
  - `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramEdgeVisualKind|FullyQualifiedName~DiagramForestLayoutSvgRendererTests|FullyQualifiedName~MermaidDiagram|FullyQualifiedName~DiagramAstGraphvizDotEmitterTests'`
  - `cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx`
  - Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
