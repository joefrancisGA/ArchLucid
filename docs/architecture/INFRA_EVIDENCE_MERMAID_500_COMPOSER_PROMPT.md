> **Scope:** Copy-paste Composer prompt to stop HTTP 500 on inventory Mermaid after **#2931**. Index: [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). Contract: [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
>
> **Do not** re-implement **#2931** (`fe05a0d776` — sparse ARM id / duplicate `CloudResourceId`). That patch is on master. This 500 is a different hole.

# IE-HOTFIX — Mermaid snapshot 500 after #2931

**Observed (operator diagrams workbench):**

```text
GET /api/proxy/v1/infra-evidence/snapshots?page=1&pageSize=50  → 200 (~57ms)
GET /v1/infra-evidence/snapshots/{id}/mermaid/preview           → 500 (~218ms)
GET /v1/infra-evidence/snapshots/{id}/mermaid?mode=executive → 500 (~214ms)
```

Snapshot id in the failing traces: `bebca1aa-9fba-408a-b9ce-2794678c4281`. List succeeds; both Mermaid routes fail in nearly the same time (preview does **not** take ~5× executive). That means the throw is in the **shared prefix** (`TryGetSnapshotDetailAsync` / `BuildGraph` / first executive compile), not a later preview mode.

**#2931 already shipped** (empty `AzureResourceId` + duplicate `CloudResourceId`). Tests:

- `Snapshot_with_blank_arm_id_still_renders_executive_mermaid` (uses `string.Empty`, **not** null)
- `Snapshot_with_duplicate_cloud_resource_ids_still_renders_executive_mermaid`

Those tests do **not** cover SQL 208 on a detail-only table.

## Diagnosis (do not skip)

### Primary — SQL 208 on `dbo.AzureInventoryDefenderSummaries`

`SqlAzureInventorySnapshotRepository.TryGetSnapshotDetailAsync` **always** runs:

```sql
SELECT ResourceId, SecureScore, SourceEvidenceReference
FROM dbo.AzureInventoryDefenderSummaries
WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
```

`ListSnapshotsAsync` never touches that table, so the workbench list stays 200.

`MaterializeSnapshotAsync` INSERTs defender rows **only when** `writeRequest.DefenderSummaries.Count > 0`. A snapshot with no Defender companion still materializes. The later **read** still SELECTs the table.

DDL drift:

| Artifact | `CREATE TABLE dbo.AzureInventoryDefenderSummaries` |
| --- | --- |
| `ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql` | **Present** |
| `ArchLucid.Persistence/Scripts/ArchLucid.sql` | **Missing** (UnknownResources is there; Defender is not) |
| `ArchLucid.Persistence/Migrations/*.sql` | **Missing** (347 creates UnknownResources, not DefenderSummaries) |
| Rollback scripts | **Missing** |

Catalogs that only applied numbered DbUp migrations therefore have snapshots but **no** `AzureInventoryDefenderSummaries`. SQL Server error **208** (invalid object name) is mapped by `ApplicationDatabaseExceptionMapper` to HTTP **500** `"Database Query Failed"` — not 404/400. That matches the proxy logs.

### Secondary — remaining uncaught exceptions still 500

`InfraEvidenceSnapshotsController` only catches `ConflictException`. `ApiProblemDetailsExceptionFilter` maps `ArgumentException` / `ArgumentNullException` to **400**, `InvalidOperationException` to **400**, and SQL 208 to **500**. **`NullReferenceException` is unmapped → 500.**

`AzureInventorySnapshotGraphResolver.ResolveLabel` still does `resource.AzureResourceId.LastIndexOf('/')` with no null guard. `#2931` tests empty string. Dapper can still hand back **null** for a C# `string` even when the column is `NOT NULL` if the mapper/left-join path is dirty. Preview has no per-mode try/catch: one throw fails the whole preview.

Do **not** treat `#2931` as done for fail-soft. Keep compile/render from throwing on dirty inventory **after** the SQL 208 is gone.

---

# Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH off current master. Goal: stop HTTP 500 on GET /v1/infra-evidence/snapshots/{snapshotId}/mermaid and …/mermaid/preview for snapshots that already list as 200.

This is NOT a re-do of #2931 (fe05a0d776). Master already falls back to resource-row-{ResourceRowId} when ARM/cloud ids are blank, and already dedupes duplicate CloudResourceId node ids. Do not revert that. Do not re-open TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not add a second Azure collector. Do not hide desktop review workspace tabs.

Read first:
- ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Read.cs (defender SELECT is unconditional)
- ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Materialize.cs (INSERT only if Count > 0)
- ArchLucid.Persistence/Migrations/347_InfraEvidenceFoundation.sql (UnknownResources present; DefenderSummaries absent)
- ArchLucid.Persistence/Scripts/ArchLucid.sql (same gap after UnknownResources)
- ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql (canonical CREATE TABLE dbo.AzureInventoryDefenderSummaries — copy this DDL, do not invent columns)
- ArchLucid.Api/ProblemDetails/ApplicationDatabaseExceptionMapper.cs (SQL 208 → HTTP 500)
- ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs (ResolveLabel NRE if AzureResourceId is null)
- ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceSnapshotsController.cs (only ConflictException is caught)
- ArchLucid.Architecture.Tests/LostWriteLw089ArchitectureWorkLeasesDdlArchitectureTests.cs (DDL + migration + rollback + both schema files pattern)

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'
Exit 2 → skip that path and report.

Work — primary (required, this is the production 500):
1. Re-check the current max numbered migration under ArchLucid.Persistence/Migrations/ immediately before authoring. Add NNN_AzureInventoryDefenderSummaries.sql (NNN = max+1) that CREATE TABLE dbo.AzureInventoryDefenderSummaries matching Unified_Schema.sql (DefenderSummaryRowId, SnapshotId, TenantId, ResourceId NVARCHAR(1024) NOT NULL, SecureScore INT NOT NULL, SourceEvidenceReference NVARCHAR(512) NULL, PK, FK to AzureInventorySnapshots, IX_AzureInventoryDefenderSummaries_Tenant_Snapshot). IF OBJECT_ID IS NULL. No SQL RLS / no CREATE SECURITY POLICY.
2. Add matching Rollback/RNNN_AzureInventoryDefenderSummaries.sql that DROP TABLE if exists.
3. Insert the same CREATE TABLE block into ArchLucid.sql immediately after AzureInventoryUnknownResources (the table is missing there today). Unified_Schema.sql already has it — do not duplicate or rename columns; if Unified_Schema already matches, leave it unless you find a column mismatch with Read/Materialize.
4. Architecture tests (own file): migration contains CREATE TABLE dbo.AzureInventoryDefenderSummaries + index + FK; rollback drops it; ArchLucid.sql contains the table; Unified_Schema.sql contains the table; SqlAzureInventorySnapshotRepository.Read.cs still references the table. No SQL RLS.
5. Optional cheap ratchet: a test that every dbo table name in TryGetSnapshotDetailAsync FROM clauses exists in at least one numbered migration (prevents the next detail-only table from shipping SQL-only in Unified_Schema).

Work — secondary (required, so Mermaid never 500s on dirty rows after the table exists):
1. AzureInventorySnapshotGraphResolver.BuildGraph / ResolveLabel / property assignment: null-safe AzureResourceId, ResourceType, relationship ARM ids. Dictionary<string,string> must not be assigned null. OrderBy string keys must not be null (coalesce to empty). Prove with a test that AzureResourceId = null and ResourceType = null still returns Succeeded preview/executive (Dapper-null shape, not just string.Empty).
2. InfraEvidenceSnapshotMermaidService.TryGetPreviewAsync: isolate per-mode RenderModeAsync in try/catch. A throw in one DiagramMode must become that mode's Status=Failed (no mermaid text), not fail the whole preview. TryGetMermaidAsync for a single mode: catch compile/render exceptions and return Succeeded=false with a clear ErrorMessage (controller already maps that to 400) OR return a Failed render payload with HTTP 200. Prefer HTTP 200 + Status=Failed for inventory that exists — operators should see an honest Failed card, not a proxy 500. Do not swallow ConflictException (sealed manifest stays 409).
3. Do not catch SQL exceptions in the mermaid service and pretend the snapshot has no defender rows. The primary fix is the missing table. Fail-soft is for graph/compile/render only.

Do not:
- Change mermaid-import-policy or statically import mermaid on UI hot paths.
- Mark huge graphs Succeeded (thresholds stay).
- terraform apply / ARM writes.
- git add -A. Stage only this hotfix's paths.

Tests:
- New architecture DDL tests as above.
- Application.Tests: null AzureResourceId + null ResourceType still preview/executive without throw.
- Application.Tests: preview continues other modes when one mode's render throws (inject a throwing compiler/pipeline fake for one DiagramMode if needed).
- Existing #2931 tests still pass.

Compile (one scoped check, heartbeat every 8s if >15s):
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
If you added Architecture.Tests: one more compile for ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj.
Run:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj --filter 'FullyQualifiedName~DefenderSummaries'

Done when:
- DbUp-only catalogs gain dbo.AzureInventoryDefenderSummaries so TryGetSnapshotDetailAsync no longer SQL-208s.
- GET mermaid/preview and GET mermaid?mode=executive return 200 for a listable snapshot (Failed/Partitioned/Succeeded are OK; 500 is not).
- Dirty null ARM rows cannot NRE the resolver.
- #2931 behavior is unchanged.
```
