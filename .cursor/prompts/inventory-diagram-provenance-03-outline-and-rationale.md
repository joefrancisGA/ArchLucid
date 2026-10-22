# IDP-03 — Outline Source column and click-through to declaration accountability

**Wave:** inventory-diagram-provenance (**IDP**). **Depends on:** IDP-01 (required), IDP-02 (preferred so Mermaid `-.->` and `%% al-provenance` already exist). **Do not** implement IDP-04 AiInference dotted styling.

Do not implement from the wave index. Implement only *What to build*.

## Goal

The Inventory diagrams **Edges** outline must say whether a connector is **Observed** or **Declared**. Activating a declared row must show the accountability already stored on the declaration: rationale, optional evidence reference, approver, expiry, status, and a link to the Declared connections workbench. Do not invent a second REST collection.

## Why

Dash + `declared` on the canvas is necessary and still the worst place to read a 20-character rationale. The workbench already requires rationale, approver, and expiry. None of that is reachable from the diagram. An auditor asking “why does this line exist?” is the moment the feature pays for itself.

## Context

- `ArchLucid.Application/InfraEvidence/SecurityDeclaredConnections/SecurityDeclaredConnectionSnapshotMerger.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AzureInventorySnapshotDetailReadModel.cs` (`AzureInventoryResourceRelationshipReadModel`)
- `ArchLucid.Contracts/Persistence/Graph/GraphEdge.cs` (`Properties` dictionary already exists; prefer a typed optional id on `DiagramEdge` rather than a magic property key **on the AST**)
- `ArchLucid.ArtifactSynthesis/Models/DiagramEdge.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` (previous-line `%%` comments)
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-outline-sort.ts` (`InfraEvidenceDiagramOutlineEdgeSortKey` is `"from" | "relationship" | "to"`)
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`
- `archlucid-ui/src/lib/security-declared-connection-api.ts` (list / create / revoke — **no GET-by-id** today)
- `archlucid-ui/src/lib/governance/governance-infrastructure-route-paths.ts` (`GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH`, `SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH`)
- `archlucid-ui/src/lib/product-line/securenow-infrastructure-routes.ts` (`infrastructureDeclaredConnectionsPathForProductLine`)
- `archlucid-ui/src/lib/security-evidence-path-presentation.ts` (`formatSecurityEvidenceProvenanceKindLabel`)

There is no `GET /v1/operational-security/declared-connections/{id}` in the generated contract. **Do not add one in this prompt** unless list is already unbounded and you cannot match by id in memory. Default: stamp the id on the edge, list declared connections when the panel opens (or reuse a React Query hook if one exists), match `connectionId`. If the row is missing (revoked/expired since render), show honest empty + workbench link.

## What to build

1. Merger: when adding a declared relationship, also carry `DeclaredConnectionId = connection.ConnectionId` (new optional `Guid?` on `AzureInventoryResourceRelationshipReadModel` only — **not** a SQL column; merge-time only). Do not persist the id into snapshot relationship tables.
2. Graph resolver: copy id onto `GraphEdge` as optional `string? DeclaredConnectionId` **or** `Properties["declaredConnectionId"]` (pick **one**; prefer a typed optional string on `GraphEdge` if you already added `ProvenanceKind` in IDP-01 — still SchemaVersion 1 additive). Update `GraphEdgeJsonConverter` the same way as provenanceKind (missing → null).
3. `DiagramEdge`: optional `string? DeclaredConnectionId`. Compiler copies it.
4. Mermaid: extend the previous-line `%%` comment with `al-declared-id=<guid>` when set. Keep `al-provenance` / `al-inference` from IDP-02 (if 02 not merged, still emit all three from DiagramEdge fields).
5. Outline parser:
   - `InfraEvidenceMermaidOutlineEdge` gains `source: "declared" | "observed"` (default observed) and `declaredConnectionId: string | null`.
   - Parse the `%%` comment immediately above an edge line (mirror how node `al-type` comments work). `al-provenance=HumanAssertion` or `al-inference=human-declared-connection` ⇒ `source: "declared"`.
   - `-.->` alone may also mark declared if comments are stripped in a fixture — do not rely on dash only when comments exist.
6. Outline UI:
   - New sortable **Source** column (`declared` / `observed`, sentence case labels **Declared** / **Observed**). Add `"source"` to `InfraEvidenceDiagramOutlineEdgeSortKey`.
   - Declared rows are a **button or link** (not a clickable `<div>`). Accessible name includes from/to.
   - Observed rows are not clickable for this prompt.
7. Detail panel (own component, Carbon side panel or existing operator drawer if one is already used on this workbench — reuse; do not add a modal library):
   - Title: `Declared connection`
   - Fields: from, to, relationship type, provenance (`Human assertion` via existing formatter), rationale, evidence reference or —, approved by, expires (locale string), status.
   - Actions: `Open declared connections` → product-line path helper (Architecture `/governance/infrastructure/declared-connections`, Security `/infrastructure/declared-connections`). Close control is `outline` Button, not ghost.
   - Loading / not-found / error: inline, no validation toasts. System failures may `showError`.
   - Do **not** embed create/revoke forms here (workbench owns mutations). A read-only revoke status is enough; optional “Revoke” that calls existing `revokeSecurityDeclaredConnection` is allowed if the button is disabled until the row is loaded and status is Active — keep it small or omit.
8. Tests:
   - Merger test: Active connection adds relationship with `DeclaredConnectionId` set; expired still skipped; duplicate inventory key still not added.
   - Parser: `%% al-provenance=HumanAssertion al-declared-id=...` then `-.->|"declared · connects"|` ⇒ source declared + id.
   - Parser: solid `-->` without comment ⇒ observed, id null.
   - Outline: Source column present; sort by source; declared row has a control; observed does not open the panel.
   - Panel: matching list row fills rationale and expiry; missing id shows honest empty + workbench link.
9. No AiInference dotted. No teal. No new GET endpoint unless you prove list cannot be used (document that proof in the PR if you add GET — OpenAPI snapshot + route-tier policy).

## Acceptance criteria

- Edges table shows **Declared** vs **Observed** for a mixed diagram.
- Opening a declared row shows the rationale captured at create time (or honest not-found).
- Workbench link uses the product-line route (no `/governance` in the Security shell).
- Observed inventory edges do not grow a fake rationale panel.
- Snapshot SQL schema unchanged.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Button vs link: panel open = Button; workbench navigation = `Link`. No ghost/link Button variants.
- Sentence case. TB-645 vocabulary. Claim discipline: still not an ARM fact.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification:
  - `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~SecurityDeclaredConnectionSnapshotMergerTests|FullyQualifiedName~AzureInventorySnapshotGraphResolver'`
  - `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~MermaidDiagram|FullyQualifiedName~DiagramAstFromGraphCompilerTests'`
  - `cd archlucid-ui && npx vitest run src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.test.ts src/lib/infra-evidence/infra-evidence-diagram-outline-sort.test.ts src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx`
  - Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
