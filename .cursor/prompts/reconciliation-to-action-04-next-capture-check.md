# RTA-04 — Say whether a documentation decision still holds on a later capture

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a fifth RTA prompt in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Reconciliation to action (**RTA**). **Depends on:** RTA-03 on `master`.

## Goal

When the same diagram is compared again, each saved documentation decision says **Still open**, **No longer in this capture**, or **Evidence changed**. An operational finding is left untouched.

## Why

RTA-03 binds a decision to one run or one comparison. The next inventory capture is the check that the gap was fixed, accepted, or has moved. Closing that loop by deleting the decision, or by marking a security finding resolved, would hide an operator’s earlier answer.

## Read first

- The RTA-03 decision repository and workbench control
- `DiagramInfrastructureCorrespondenceRow` (`DiagramNodeId`, `AzureResourceId`, `MatchKind`, `SecurityDiscrepancy`)
- `DiagramInfrastructureEdgeGapRow`
- `docs/library/INFRA_EVIDENCE_PLANE.md` section 8 (verify on a later capture; do not apply)

## What to build

1. Branch `cursor/rta-04-next-capture-check` from current `master`.
2. When a compare result is shown, load documentation decisions for the same tenant whose subject id matches a current row or an earlier row for the same diagram node id, Azure resource id, or edge identity (the two endpoint resource ids plus gap kind). Prefer the latest decision. Do not copy it into a new row until the operator saves again.
3. Classify each carried decision:
   - **Still open** — the same subject is present and the match class is unchanged (Diagram only stays Diagram only, Inventory only stays Inventory only, the same connector gap kind remains).
   - **No longer in this capture** — the subject is absent from this result. Show it in a short list under the table. Do not delete the stored decision.
   - **Evidence changed** — the subject is present but the match class, the Azure resource id, or `securityDiscrepancy` differs. Keep the old decision visible and say it is not settled.
4. **Accept as undocumented** stays in the Diagram only or Inventory only count. It does not become Matched.
5. Do not change operational finding status. A security finding that no longer has a matching discrepancy stays open until an operator closes it in the finding workflow.
6. Tests: an unchanged diagram-only decision is Still open; removing that node yields No longer in this capture and leaves the stored row; a diagram-only node that later matches is Evidence changed; a finding status is unchanged by the compare.

## Acceptance criteria

- A later compare shows the earlier documentation decision with one of the three labels.
- The stored decision and any operational finding remain after the compare.
- Accepted gaps are not counted as matched.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not auto-resolve, auto-close, or ingest a finding in this session.
- Do not call Azure or apply Terraform.
- Do not promote the decision to Confirmed or Exact.
- Working-tree safety. Stage only the carry-forward classification, its tests, and the workbench labels. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~DiagramInfrastructure
```

From `archlucid-ui`, run the `DiagramReconcileWorkbenchClient` Vitest file. One `scripts/ci/agent-compile-check.ps1` on the project you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**.

1. Compare a drawing that has Member Portal — Prod and no inventory resource by that name. Save **Update the drawing**.
2. Compare the same drawing to the same capture again. The row says Still open and Update the drawing.
3. Compare a drawing that omits Member Portal — Prod. A line says that decision is no longer in this capture. The stored decision still exists.
4. Compare a drawing where that label now matches a real resource. The row says Evidence changed. It is not Matched because of the old decision.
5. Create a conflict finding first. Run the later compare. The finding is still open.

Wait for that look before any commit.
