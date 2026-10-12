# RTA-01 — Show the operational finding that was already recorded

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement RTA-02 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Reconciliation to action (**RTA**). **Depends on:** DIC-01 through DIC-05 on current `master`.

## Goal

On the sealed Diagram reconciliation path, a refresh shows **Finding recorded**, **Open finding**, and the conflict **Open in factory** link for a row whose operational finding already exists.

## Why

`buildDiagramReconcileOperationalFindingRequestItem` already posts `sourceSystem = DiagramReconciliation` and `sourceFindingId = diagram-reconcile:{runId}:{snapshotId}:{correspondenceId}`. `OperationalSecurityFindingIngestService` stores that row and dedupes on the natural key (`tenant`, provider, source system, source finding id). `DiagramReconcileWorkbenchClient` keeps the returned finding id in `ingestedFindingIds`, which is component state. After refresh the same row offers **Create operational finding** again, and `buildDiagramReconcileRemediationHref` loses `findingId`.

`GET /v1/operational-security/findings` lists the tenant. Do not call that from the browser and filter it.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient.tsx` (`runCreateFinding`, `ingestedFindingIds`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url.ts` (`buildDiagramReconcileRemediationHref`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IOperationalSecurityFindingRepository.cs` (`TryGetByNaturalKeyAsync`)
- `ArchLucid.Api/Controllers/OperationalSecurity/OperationalSecurityFindingsController.cs`
- `ArchLucid.Application/InfraEvidence/OperationalSecurityFindings/OperationalSecurityFindingIngestService.cs`

## What to build

1. Branch `cursor/rta-01-restore-finding-link` from current `master`.
2. Add a read lookup that accepts `sourceSystem` plus a list of `sourceFindingId` values. Suggested: `POST /v1/operational-security/findings/lookup`. Same read policy and tenant scope as the existing finding list. Return only `findingId`, `sourceFindingId`, and status for rows in the caller’s scope. Omit ids that are missing. Do not 404 the batch because one id is missing. Cap the list at the existing findings page size (200). Reject an empty list and a longer list.
3. Look up with the repository natural key. Do not scan every tenant finding into the UI.
4. On the sealed path, after a reconciliation result is loaded or just created, call the lookup with `DiagramReconciliation` and `buildDiagramReconcileOperationalFindingFingerprint` for each correspondence row. Put the matches into the same state that **Finding recorded** already reads.
5. A matched row shows **Finding recorded** and **Open finding**. A Conflict row keeps **Open in factory** with that finding id. A row with no match still shows **Create operational finding**. Loading does not call ingest.
6. When the sealed review id is blank (advisory compare), skip the lookup. Leave the create button as it is. RTA-02 decides who may create a finding.
7. Tests: a known fingerprint returns its finding id; a different tenant returns no row; a missing id is omitted; the workbench renders **Finding recorded** from the lookup without a second ingest.

## Acceptance criteria

- Refresh on a sealed reconciliation that already has a diagram-reconciliation finding does not offer **Create operational finding** for that row.
- **Open finding** goes to the existing finding.
- A Conflict row’s factory link still includes the finding id after refresh.
- The lookup does not return another tenant’s finding.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not add a documentation-decision table. That is RTA-03.
- Do not hide **Create operational finding** based on match kind. That is RTA-02.
- Do not change finding status, and do not auto-close a finding.
- Do not weaken `DiagramInfrastructureReconciliationSealedManifestHashGuard` on the run-linked reconcile route.
- Do not call Azure or apply Terraform.
- Working-tree safety. Stage only the lookup, its tests, and the workbench reload. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~OperationalSecurityFinding
```

Add the new lookup test to that filter or a second scoped filter. From `archlucid-ui`, run the existing `DiagramReconcileWorkbenchClient` Vitest file. One `scripts/ci/agent-compile-check.ps1` on the API project you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**. Use the sealed reconcile path with a review id and a capture.

1. Run Compare. On one row, choose **Create operational finding**. The row says **Finding recorded**.
2. Hard-refresh the same review and capture.
3. That row still says **Finding recorded** and **Open finding** opens the same finding.
4. If the row is a Conflict, **Open in factory** is still present.
5. A row you did not turn into a finding still offers **Create operational finding**.
6. The network call is the lookup, not a second ingest, and not the full tenant finding list.

Wait for that look before any commit.
