# DIC-03 — Compare drawn connectors to inventory relationships

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DIC-04 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Diagram import comparison (**DIC**). **Depends on:** DIC-01 and DIC-02 on `master`.

## Goal

When both ends of a connector already match an inventory resource, the comparison says whether that connector was drawn and missing from inventory, or present in inventory and missing from the drawing.

## Why

`ArchitectureDiagramModelRecord.Edges` is populated by structured ingest. `DiagramInfrastructureMatcher.Match` iterates nodes only. Week 3 calls connectivity the difference class that rots fastest. Authorization edges are not traffic, so this session stays on structural relationships the snapshot already stored.

## Read first

- `ArchLucid.Contracts/Architecture/ArchitectureDiagramEdgeRecord.cs`
- `ArchLucid.Contracts/Architecture/DiagramInfrastructureReconciliationResult.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.Application/InfraEvidence/DiagramReconciliation/DiagramInfrastructureMatcher.cs`
- The DIC-01 result type and workbench table

## What to build

1. Branch `cursor/dic-03-edge-gaps` from current `master`.
2. Add an `EdgeGaps` list on the reconciliation result. Do not overload node `MatchKind`. Each gap has a stable id, the two cloud resource ids, the diagram edge id when one exists, the association type when one exists, a kind, and one explain sentence.
3. Kinds:
   - `DrawnNotPresent` — a non-removed diagram edge whose source and target nodes are each Exact, Probable, or Confirmed, and no structural relationship connects those two resources.
   - `PresentNotDrawn` — a structural relationship between two resources that are each Exact, Probable, or Confirmed, and no diagram edge connects their nodes.
4. Structural types for `PresentNotDrawn` are only: `nicToSubnet`, `vmToNic`, `publicIpToNic`, `vnetPeering`, `privateEndpointTarget`, `peToNic`, `peToSubnet`, `lbToBackend`, `agwToBackend`, `appServiceToSubnet`. Skip `appAuthorizedAccess`, `hostnameInferredTarget`, `diagnosticToDestination`, `nsgAllowRule`, and `observedDependency`.
5. Skip an edge when either endpoint is DiagramOnly, Possible, Unknown, or InfrastructureOnly. Do not invent a relationship the snapshot does not have.
6. Show the gap list under the node table. Column headings in sentence case: Drawing, Inventory, Gap. Explain sentences: “Drawn on the diagram and not present in this inventory capture.” and “Present in this inventory capture and not drawn.”
7. Tests: two matched nodes with a diagram edge and no relationship produce one `DrawnNotPresent` gap; two matched VNets with `vnetPeering` and no diagram edge produce one `PresentNotDrawn` gap; an `appAuthorizedAccess` row produces neither; an edge with one unmatched end produces neither.

## Acceptance criteria

- Node rows from DIC-01 and Confirmed rows from DIC-02 are unchanged aside from the new list.
- Gaps are advisory documentation accuracy. They are not findings and not ObservedFact.
- A drawing with edges and a capture with no relationships still returns node rows.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- No new collector and no Azure HTTP.
- Do not group InfrastructureOnly rows and do not add CSV (DIC-04).
- Do not paint the drawing (DIC-05).
- Stage only the matcher gap pass, the result contract, the table, and tests. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

Scoped `dotnet test` for `DiagramInfrastructureMatcher`. One compile check, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**.

1. Use a drawing whose two matched nodes have a connector, and whose capture has no relationship between those resources. After Compare, the gap list has one row: drawn, not in this inventory capture.
2. Use two matched virtual networks that the capture already relates with `vnetPeering`, and omit that connector from the drawing. The gap list has one row: in this inventory capture, not drawn.
3. A May access or hostname-inferred relationship does not appear as a gap by itself.
4. A connector that touches **Member Portal — Prod** before anyone confirms a mapping does not appear as a gap. After DIC-02 confirms that box, rerun Compare. The gap can appear only once both ends are matched.
5. The node table is still there. The page still says advisory documentation accuracy.

Wait for that look before any commit.
