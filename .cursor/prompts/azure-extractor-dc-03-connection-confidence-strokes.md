# AX-DC-03 — Connection confidence strokes (Probable / Inferred vs Proven)

**Wave:** AX-DC. **Depends on:** AX-DC-01; IDP-01–02 landed. **Replaces** stock IDP-04 behavior for inventory connection edges — coordinate with [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md).

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

Inventory diagrams must **rhyme** with [`AZURE_CONNECTION_POINT_DISCOVERY.md`](../../docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md) §5 bands:

| Band | `ProvenanceKind` / edge class | Visual (forest + Mermaid + Graphviz) |
|------|------------------------------|--------------------------------------|
| **Proven** | `ObservedFact` (PE, Service Connector, ARM-id diagnostics dest, etc.) | solid `#64748b` (unchanged) |
| **Probable** | `DerivedFact` (`appAuthorizedAccess`, ADF declared I/O, Logic connection, …) | dashed `4 3` — **no** `declared` prefix (that remains HumanAssertion only) |
| **Inferred** | `DeterministicInference` (`hostnameInferredTarget`, hostname-only ADF resolve, …) | dotted `1 3` or Mermaid label `likely ·` per IDP-04 pattern |
| **Declared** | `HumanAssertion` | IDP-02 dashed + `declared ·` (unchanged) |
| **AiInferred** | `AiInference` | IDP-04 dotted + `inferred ·` (unchanged) |

Do **not** promote Probable/Inferred to solid Observed.

## Why

`DiagramEdgeVisualKindResolver.From` maps everything except HumanAssertion and AiInference to **Observed**. RBAC **May access** (`DerivedFact`) therefore looks as strong as a private endpoint (`ObservedFact`). That contradicts discovery doc honesty and SecureNow path confidence semantics.

## Context

- `ArchLucid.ArtifactSynthesis/DiagramEdgeVisualKindResolver.cs`
- `ArchLucid.ArtifactSynthesis/DiagramEdgeVisualKind.cs`
- `ArchLucid.ArtifactSynthesis/Renderers/DiagramForestLayoutSvgRenderer.cs` (or current forest stroke resolver)
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramEmitter.cs`, `DiagramAstGraphvizDotEmitter.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs` — `DefaultProvenanceKind` per type
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramLegend.tsx`

## What to build

1. Extend `DiagramEdgeVisualKind` with **Probable** and **Inferred** (or rename to match IDP naming — keep **Declared** and **AiInferred** stable).
2. Update `DiagramEdgeVisualKindResolver`:
   - HumanAssertion → Declared (unchanged)
   - AiInference → AiInferred (unchanged)
   - `DerivedFact` → Probable
   - `DeterministicInference` → Inferred
   - `ObservedFact` → Observed
   - Null/unknown provenance → Observed (conservative for legacy JSON)
3. Paint strokes in forest SVG, Mermaid export, and Graphviz DOT using the locked table above. Reuse IDP dash arrays where possible (`4 3` probable, `1 3` inferred).
4. Legend: add short entries **Probable authorization / declared wiring** and **Inferred hostname match** — text only, no five-color legend (IDP-HOLD).
5. Labels: keep humanizer strings (**May access**, **Likely connected to**) — do not add “confirmed” wording.
6. Tests:
   - `appAuthorizedAccess` edge → Probable stroke, solid label without `declared`
   - `hostnameInferredTarget` → Inferred stroke
   - `privateEndpointTarget` / `serviceConnectorLink` ObservedFact → solid
   - HumanAssertion still dashed + `declared ·`

## Acceptance criteria

- Three-band inventory connection honesty without teal or color-only encoding.
- IDP-02 declared edges unchanged.
- Document in AX-DC composer doc that **IDP-04** for inventory is satisfied by AX-DC-03 (amend IDP index footnote if needed in AX-DC-01 follow-up).

## Constraints

- `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramEdgeVisualKind'`
- `cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx`
- Heartbeat if >15s.

## Done when

A reviewer can distinguish PE (solid) from **May access** (dashed) from hostname inference (dotted) on the same Executive canvas.
