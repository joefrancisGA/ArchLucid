# RTA-05 — Remember a documentation decision for one drawing

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement RTA-06 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Reconciliation to action (**RTA**). **Depends on:** RTA-04. Today that code is on `cursor/rta-luna-prompts-f8f4` (`410_InfrastructureDiagramDocumentationDecisions.sql` and `TryGetLatestBySubjectAsync`). It is not on `master`. `master` has RTA-01 and RTA-02 only.

## Goal

A documentation decision follows the same parsed drawing. It does not follow the same Azure resource onto a different drawing.

## Why

`CompareAsync` creates a new comparison id on every advisory compare. `TryGetLatestBySubjectAsync` then loads the newest decision for a tenant, subject kind, and subject key. An inventory subject key is a cloud resource id. A connector subject key contains the two resource ids. The same resource in a second drawing can inherit **Accept as undocumented** from the first drawing.

A new diagram-document table is not the fix. The parsed drawing is already the identity: node id and label, plus edge source, target, and label. `InfrastructureDiagramComparisons` already stores `SourcesJson`.

## Read first

- `ArchLucid.Application/InfraEvidence/InfrastructureDiagramComparisonService.cs`
- `ArchLucid.Persistence/Architecture/SqlInfrastructureDiagramDocumentationDecisionRepository.cs`
- `ArchLucid.Persistence/Migrations/407_InfrastructureDiagramComparisons.sql`
- `ArchLucid.Persistence/Migrations/410_InfrastructureDiagramDocumentationDecisions.sql`
- `ArchLucid.ContextIngestion/Diagram/MermaidDiagramSourceParser.cs`

## What to build

1. Branch `cursor/rta-05-diagram-fingerprint` from `cursor/rta-luna-prompts-f8f4`, or from whichever tip has already landed that decision migration. Do not branch from `master`.
2. Add `DiagramFingerprint` to `dbo.InfrastructureDiagramComparisons` and `dbo.InfrastructureDiagramDocumentationDecisions`. Use the next unused migration prefix. Make the column nullable for rows already stored. New comparisons and decisions write it. This is a new column. Do not reuse `EvidenceFingerprint`. That column is the row evidence RTA-04 already stores (match class, resource, and security discrepancy, or edge-gap kind and endpoints).
3. Compute the fingerprint from the parsed `ArchitectureDiagramModelRecord`, not from the file name or raw text. Include each node id and label, and each edge source, target, and label. Sort before hashing. Use SHA-256 and store lowercase hex. Whitespace that does not change the parsed model keeps the same fingerprint.
4. `TryGetLatestBySubjectAsync` takes the fingerprint and returns a decision only when the tenant, fingerprint, subject kind, and subject key match. A null fingerprint on an old row does not match a new drawing.
5. Saving a decision stores the current comparison’s fingerprint. A second compare of the same drawing can read the earlier decision. A different drawing with the same cloud resource id cannot.
6. Tests: the same parsed nodes and edges produce the same fingerprint; a label change changes it; the same resource on a different fingerprint does not return the first decision; the same fingerprint does.

## Acceptance criteria

- Re-uploading the same drawing still shows the saved decision.
- A different drawing does not inherit that decision for a shared resource.
- No new diagram-document table or collector is added.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not build the missing-subject list. That is RTA-06.
- Do not add sealed-path decisions. That is RTA-07.
- Do not delete old decisions that have a null fingerprint.
- Do not call Azure or apply Terraform.
- Working-tree safety. Stage only the fingerprint path, its migration, and tests. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~DiagramInfrastructure
```

One `scripts/ci/agent-compile-check.ps1` on the API project you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**.

1. Compare a drawing, save **Accept as undocumented** on one inventory resource, and compare the same drawing again. The decision is still there.
2. Compare a different drawing that contains the same resource. That row has no saved decision.
3. The match counts do not change.

Wait for that look before any commit.
