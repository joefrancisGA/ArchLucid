# RTA-03 — Save a documentation decision for a gap that is not a security finding

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement RTA-04 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Reconciliation to action (**RTA**). **Depends on:** RTA-02 on `master`.

## Goal

For a diagram-only row, an inventory-only row, or a connector gap, the operator can save one documentation decision and see it after refresh. The decision is not an operational security finding and it does not change the match kind.

## Why

RTA-02 correctly keeps those rows off the security-finding button. They still have no durable operator answer. Confirmed mapping answers “this box is that resource.” It does not answer “this box should be removed from the drawing” or “this resource is absent from the drawing on purpose.”

## Read first

- `DiagramReconcileWorkbenchClient.tsx`
- `ArchLucid.Contracts/Architecture/DiagramInfrastructureEdgeGapRow.cs`
- `ArchLucid.Contracts/Architecture/DiagramInfrastructureEdgeGapKinds.cs`
- `ArchLucid.Persistence/Migrations/408_InfrastructureDiagramNodeMappings.sql` (pattern for a tenant-scoped mapping table; do not reuse that table)
- `docs/library/INFRA_EVIDENCE_PLANE.md` section 8 (no apply; AI cannot mint Exact)

## What to build

1. Branch `cursor/rta-03-documentation-decision` from current `master`.
2. Add a tenant-scoped table and repository. Use the next unused numeric prefix under `ArchLucid.Persistence/Migrations/`. Store one decision per subject:
   - **Update the drawing**
   - **Accept as undocumented**
   - **Check the inventory**
   Absence of a row means Open. Do not store an Open row.
3. Scope the row to the sealed run id or the advisory comparison id, plus a subject:
   - diagram node id for Diagram only
   - Azure resource id for Inventory only
   - edge gap id for a connector gap
   Record the snapshot id as context. The unique key is tenant, scope, and subject, so a second compare in the same run or comparison updates the context instead of inserting a second decision.
4. Allow the decision only when `securityDiscrepancy` is false and the row is DiagramOnly, InfrastructureOnly, or an edge gap (`DrawnNotPresent` or `PresentNotDrawn`). Conflict, security discrepancy, Exact, Probable, Possible, Confirmed, and Unknown do not get the control.
5. Save and fetch on a route under the existing infrastructure diagram API, with the same tenant scope and execute policy as advisory compare. A decision for another tenant is not found.
6. On the workbench, the control is a select and **Save decision**. After refresh, the row shows the saved label. Sentence case. The scorecard counts do not change: an accepted row stays Diagram only or Inventory only. It does not become Matched.
7. Tests: save and reload each of the three decisions; a second save replaces the first; a Conflict row is rejected; another tenant cannot read the row; the scorecard count for Diagram only stays the same after Accept as undocumented.

## Acceptance criteria

- A diagram-only row can say Update the drawing, and a refresh still says that.
- The row does not become a finding, a Confirmed match, or a Matched count.
- A security discrepancy row has no documentation-decision control.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not carry the decision onto a different snapshot’s compare. That is RTA-04.
- Do not close or create an operational finding from this control.
- Do not call Azure or apply Terraform.
- Do not let the matcher emit Confirmed because a decision exists.
- Working-tree safety. Stage only the decision path, its migration, tests, and the workbench control. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~DiagramInfrastructure
```

Add the new decision tests to that filter or a second scoped filter. From `archlucid-ui`, run the `DiagramReconcileWorkbenchClient` Vitest file and the scorecard Vitest file. One `scripts/ci/agent-compile-check.ps1` on the API project you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**. Advisory compare is enough.

1. On Member Portal — Prod (Diagram only), save **Update the drawing**. Refresh. The row still says Update the drawing.
2. On an inventory-only group or resource, save **Accept as undocumented**. The Diagram only and Inventory only counts do not move into Matched.
3. On a connector gap, save **Check the inventory**. Refresh. It remains.
4. A Conflict row has **Create operational finding** or **Finding recorded**, and no documentation decision.
5. Saving a decision does not add a row under operational findings.

Wait for that look before any commit.
