# RTA-02 — Create an operational finding only for a security or conflict row

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement RTA-03 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Reconciliation to action (**RTA**). **Depends on:** RTA-01 on `master`.

## Goal

**Create operational finding** is offered only for a row that is a security discrepancy or a multi-candidate conflict. An exact match, a diagram-only label, and an inventory-only resource stay documentation rows.

## Why

`runCreateFinding` builds a finding for every correspondence row. `buildDiagramReconcileOperationalFindingRequestItem` marks Conflict as high and both DiagramOnly and InfrastructureOnly as medium. That turns a documentation gap into an operational security finding.

`DiagramInfrastructureMatcher.BuildMatchedRow` sets `SecurityDiscrepancy` when the drawing implies private exposure and the capture shows public exposure, and it promotes that exact match to Conflict. `BuildConflictRow` is the other Conflict: several inventory candidates, and it leaves `SecurityDiscrepancy` false. Both are worth a finding. A diagram-only name is not.

Advisory compare has no run id. `runCreateFinding` returns before the request. The button still renders and does nothing.

## Read first

- `DiagramReconcileWorkbenchClient.tsx` (the actions cell)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation.ts`
- `ArchLucid.Application/InfraEvidence/DiagramReconciliation/DiagramInfrastructureMatcher.cs` (`BuildMatchedRow`, `BuildConflictRow`, `DetectSecurityDiscrepancy`)
- `ArchLucid.Contracts/Architecture/DiagramInfrastructureCorrespondenceRow.cs`

## What to build

1. Branch `cursor/rta-02-security-finding-gate` from current `master`.
2. Show **Create operational finding** only when the sealed path has a run id and the row has `securityDiscrepancy` or `matchKind` Conflict. Keep the RTA-01 **Finding recorded** state for a row that already has a finding, including a finding created before this gate.
3. Do not show **Create operational finding** for Exact, Probable, Possible, Confirmed, DiagramOnly, InfrastructureOnly, Unknown, or an edge-gap row.
4. On advisory compare, do not show **Create operational finding**. Confirmed mapping stays on Diagram only.
5. Leave **Open in factory** on Conflict rows. It may omit a finding id until the operator creates one.
6. Tests: a private-versus-public Conflict shows the button; a multi-candidate Conflict shows the button; a Diagram only row and an Exact row do not; advisory compare does not show the button; an already-linked finding still shows **Finding recorded** after the gate.

## Acceptance criteria

- A documentation gap cannot be posted as an operational security finding from this page.
- A security discrepancy and a multi-candidate conflict still can.
- Existing findings from RTA-01 still reload.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not add the documentation-decision control. That is RTA-03.
- Do not delete findings that were created earlier for a diagram-only row.
- Do not change match kinds or the sealed-manifest guard.
- Do not call Azure or apply Terraform.
- Working-tree safety. Stage only the gate and its tests. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

From `archlucid-ui`, run the `DiagramReconcileWorkbenchClient` Vitest file. If you touch the matcher, add:

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~DiagramInfrastructureMatcher
```

One `scripts/ci/agent-compile-check.ps1` on the project you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**.

1. Sealed path. An exact or probable row has no **Create operational finding**.
2. A Diagram only row has no **Create operational finding**. Confirmed mapping still saves.
3. A Conflict row, or a row whose explanation says security discrepancy, still has **Create operational finding**.
4. Create one. Refresh. **Finding recorded** remains.
5. Advisory compare, with the sealed review id empty, does not show **Create operational finding**.

Wait for that look before any commit.
