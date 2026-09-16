<!-- Inventory-diagram declared vs observed connections — Composer prompts.
     Paste one numbered file per session. Origin: 2026-09-16 owner asked how a
     declared (human) connection is distinguished from an extract-derived edge,
     then asked to restyle human connections. Diagnosis: provenance is dropped
     before DiagramAst, so every renderer paints the same solid gray line.
     Do not implement from this index. -->

# Inventory-diagram declared-connection provenance — Composer prompt set (IDP-01–IDP-04 + hold)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams already **merge** active declared connections into snapshot relationships (`SecurityDeclaredConnectionSnapshotMerger`: `ProvenanceKind.HumanAssertion`, `InferenceSource = human-declared-connection`). The canvas then **forgets** that distinction. `GraphEdge` keeps `InferenceSource` and drops `ProvenanceKind`. `DiagramAstFromGraphCompiler` uses `InferenceSource` only to pick a verb (`connects` / `depends on`) and does not copy it onto `DiagramEdge`. Forest SVG, Mermaid, and Graphviz all draw the same solid `#64748b` line.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-provenance-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not** restyle architecture-review diagrams (they already use solid = asserted / dashed = inferred). **Do not** restyle the evidence-graph React Flow viewer. **Do not** use teal as an edge stroke (teal is interactive affordance, not provenance). **Do not** encode provenance in color alone.

**Do not re-run IDL, IDS, IDT, IDH, IDG, IDR, IE-ND, IE-ID, or IE-DD** inside an IDP session.

## Diagnosis (locked — do not re-diagnose)

### What the owner sees (2026-09-16)

A declared `ConnectsTo` (app → SQL via a connection string that inventory never ingested) and an extract-derived `ConnectsTo` (NIC → subnet) look identical on Inventory diagrams: solid slate line, label `connects`. The Declared connections workbench is the only surface that currently names HumanAssertion, expiry, and revoke.

### Causal chain (locked)

1. `SecurityDeclaredConnectionSnapshotMerger` stamps `ProvenanceKind.HumanAssertion` and `GraphEdgeInferenceSources.HumanDeclaredConnection` on merged snapshot relationships.
2. `AzureInventorySnapshotGraphResolver` copies `InferenceSource` onto `GraphEdge` and **does not copy `ProvenanceKind`**.
3. `DiagramEdge` has `FromNodeId`, `ToNodeId`, `Label`, `IsLayoutOnly` only. The compiler drops `InferenceSource` after labeling.
4. `DiagramForestEdgeLabelSvgEmitter` hard-codes `stroke="#64748b"` with no `stroke-dasharray`.
5. `MermaidDiagramRenderer.AppendEdges` emits solid `-->` only (`~~~` is layout-only).
6. `DiagramAstGraphvizDotEmitter.EmitVisibleEdges` emits unlabeled/labeled `->` with no `style=dashed`.
7. Outline parses from/to/label from Mermaid text. It already understands `-.->` but has no Source column and no declared-connection id.

**Signature (fail this wave if still true after IDP-01–03):** a human-declared edge and an inventory `ConnectsTo` render as the same solid line with the same verb and no outline Source value.

## Visual language (locked)

| Signal | Encodes | Why |
|--------|---------|-----|
| **Dash pattern** | Provenance class | Survives grayscale print/PNG; matches architecture-review legend (solid vs dashed) |
| **The word `declared` in the label** | Same class, in text | Survives screen readers, outline table, Export Mermaid |
| **Color** | **Reserved** | Not used in IDP-01–03. Teal is forbidden as a provenance stroke. Amber is reserved for *expiry near/past* (later), not “this is human” |

IDP-02 dashes **Declared** only. ObservedFact, DerivedFact, DeterministicInference, and AiInference stay **solid** until IDP-04.

IDP-04 maps five `ProvenanceKind` values onto **three** visual kinds (not five line styles):

| `ProvenanceKind` | Visual kind | Stroke | Label extra |
|------------------|-------------|---------|-------------|
| ObservedFact, DerivedFact, DeterministicInference | Observed | solid | none |
| HumanAssertion (`human-declared-connection`) | Declared | dashed | `declared` |
| AiInference | AiInferred | dotted | `inferred` |

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Plumbing** | Provenance dies at `GraphEdge` / `DiagramEdge` | Optional `ProvenanceKind` + `InferenceSource` on `DiagramEdge`; `GraphEdge.ProvenanceKind` additive | IDP-01 |
| **Paint** | Same solid gray `connects` | Dashed + `declared` label in forest SVG, Mermaid, Graphviz; legend when any declared edge exists | IDP-02 |
| **Accountability** | Rationale/expiry trapped on the workbench | Outline **Source** column; click-through to rationale, approver, expiry, workbench link | IDP-03 |
| **Generalize** | Binary declared vs observed | Three visual kinds; AiInference dotted; still not five colors | IDP-04 |

## What this set does *not* change

Keep: inventory-forest packing, Graphviz `fdp` as PNG/fallback, Export Mermaid topology (except edge arrow/label/comments), outline **Nodes** columns, declared-connection create/revoke API, HumanAssertion claim discipline copy on the workbench.

Do **not** promote HumanAssertion to ObservedFact. Do **not** drop declared edges from path engines. Do **not** restyle layout-only `~~~` / `IsLayoutOnly` edges. Do **not** hide desktop review workspace tabs.

## Run order

**01 → 02 → 03.** **04** after 02 (may parallel 03 if file overlap is avoided — 04 should only extend the visual-kind resolver + legend + renderers; 03 owns outline + connection id).

- **01** is design-neutral. No dash, no legend, no label change. May land without 02; do not call the wave done.
- **02** needs 01 (`DiagramEdge` fields + visual-kind helper).
- **03** needs 01. Needs 02 if the outline Source column should agree with the canvas (dash already in Mermaid). Prefer 02 merged first.
- **04** needs 02. Skip until an inventory diagram fixture actually contains `AiInference` edges **or** the owner explicitly starts 04.

**IDP-HOLD** is not implementation. Paste `inventory-diagram-provenance-05-hold.md` only if a session starts coloring edges teal, inventing five line styles, restyling React Flow, or promoting declared edges to observed facts.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-provenance-<short-name>-41fd`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/declared-connection-diagram-prompts-41fd`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-provenance-01-carry-edge-provenance.md` | Provenance dropped before renderers |
| 02 | `inventory-diagram-provenance-02-dash-and-declared-label.md` | Canvas/PNG/Mermaid still look identical |
| 03 | `inventory-diagram-provenance-03-outline-and-rationale.md` | Outline and click-through have no source / rationale |
| 04 | `inventory-diagram-provenance-04-visual-kind-resolver.md` | Binary visual language cannot name AiInference later |
| HOLD | `inventory-diagram-provenance-05-hold.md` | Teal / five colors / React Flow / promote-to-observed temptation |

## Follow-on (do not implement from this file)

Expiry-near amber stroke is a **separate** decay signal. Do not overload dash with “about to expire.” Path-inspector hop tables already print `formatSecurityEvidenceProvenanceKindLabel` — do not rewrite that surface in IDP.

## After each prompt

Summarize: files changed, tests run, whether a merged `human-declared-connection` edge still looks like inventory `connects` (01: yes; 02: no), whether outline Source is `Declared` (03), residual risk (three renderers diverging, unlabeled dashed lines).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Declared connections remain HumanAssertion — not ARM facts.
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` / Vitest named in the prompt. No full-solution build unless the file says so.
- Implement only *What to build*.
