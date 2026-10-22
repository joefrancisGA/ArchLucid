# RTA-07 — Save a documentation decision on the sealed path

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not start another RTA prompt in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Reconciliation to action (**RTA**). **Depends on:** RTA-06. The sealed decision route is not on `master`.

## Goal

A sealed reconciliation can save and reload **Update the drawing**, **Accept as undocumented**, and **Check the inventory** for the same documentation gaps as advisory compare.

## Why

The decision control renders only when `advisoryComparisonPath` and `comparisonId` are set. Sealed reconcile persists `ArchitectureDiagramReconciliations` by run and snapshot. It does not create an `InfrastructureDiagramComparisons` row, so the operator cannot record a documentation answer there.

## Read first

- `DiagramReconcileWorkbenchClient.tsx`
- `ArchitectureDiagramReconciliationController`
- `InfrastructureDiagramComparisonService`
- The RTA-05 fingerprint and RTA-06 decision list
- `DiagramInfrastructureReconciliationSealedManifestHashGuard`

## What to build

1. Branch `cursor/rta-07-sealed-decisions` from the RTA-06 tip (`cursor/rta-06-absent-subject-list` once that branch exists). Do not branch from `master`.
2. Add save and list routes under the existing run-linked diagram API. Suggested: `PUT` and `GET /v1/architecture/runs/{runId}/diagrams/documentation-decisions`. Require the snapshot id. Use the same execute policy as sealed reconcile.
3. Keep the sealed-manifest guard. An unsealed review still returns 409. Do not reuse the advisory route to bypass it.
4. Store the decision with the RTA-05 fingerprint of the sealed diagram model. Scope it by tenant, run id, and fingerprint. A decision saved on advisory compare is not copied onto the sealed path unless the fingerprint matches and the operator saved it there.
5. Show the same select and **Save decision** on sealed diagram-only rows, inventory-only resources, and connector gaps. Conflict and security-discrepancy rows still have no documentation decision.
6. The RTA-06 absent list works for the sealed fingerprint. Tests: an unsealed run is rejected; a sealed diagram-only decision reloads; a conflict row is rejected; another tenant cannot read it.

## Acceptance criteria

- The sealed page can save Update the drawing and show it after refresh.
- The advisory page does not lose the decisions it already has.
- The sealed-manifest guard still rejects an unsealed review.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not remove or skip `DiagramInfrastructureReconciliationSealedManifestHashGuard`.
- Do not create an operational finding from this control.
- Do not call Azure or apply Terraform.
- Working-tree safety. Stage only the sealed decision path and its tests. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~DiagramInfrastructure
```

From `archlucid-ui`, run the `DiagramReconcileWorkbenchClient` Vitest file. One `scripts/ci/agent-compile-check.ps1` on the API project you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**. Use the sealed path.

1. A diagram-only row has **Save decision**. Save **Update the drawing**. Refresh. It remains.
2. A conflict row has no documentation decision.
3. An unsealed review still cannot reconcile.
4. Advisory compare still saves a decision on its own drawing.

Wait for that look before any commit.
