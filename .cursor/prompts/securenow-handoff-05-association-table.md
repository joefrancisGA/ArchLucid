# SN-HAND-05 — Verified remediation association table

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`

**Depends on:** SN-HAND-01 design note, gap 5. Do not implement SN-HAND-06 in this session.

## Goal

Add one tenant-scoped association row that can say "verified instance X, inventory snapshot Y, control Z." Store identifiers only. Do not copy snapshot bytes, evidence rows, or verification JSON into a second store.

## Why

`dbo.RemediationInstances` already has `ControlId` and `VerificationSnapshotId` as columns on the instance. Those columns are not a statement that this verified instance evidenced this control. Audit evidence lineage does not read them. Gap 5 is that missing statement.

## Read first

- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` gap 5 and "What not to build"
- `ArchLucid.Persistence/Migrations/360_RemediationInstances.sql`
- `ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs` (scope pattern)
- `ArchLucid.Host.Composition/Configuration/SqlStorageProviderRegistrar.TenantRepositories.ExtractorsProvenance.cs`
- `ArchLucid.Host.Composition/Configuration/InMemoryStorageProviderRegistrar.GovernanceFindings.FindingsInspect.cs`
- `docs/library/SQL_SCRIPTS.md` §3.7 and the migration checklist
- `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md`

## What to build

Branch from current `master` as `cursor/sn-hand-05-association`. If the session requires a branch suffix, append it. Do not change the prompt id.

One class per file.

**Data model.** Table `dbo.VerifiedRemediationControlAssociations`:

- `AssociationId` uniqueidentifier, primary key
- `TenantId`, `WorkspaceId`, `ProjectId` uniqueidentifier, not null
- `InstanceId` uniqueidentifier, not null, foreign key to `dbo.RemediationInstances (InstanceId)`
- `VerificationSnapshotId` uniqueidentifier, not null, foreign key to `dbo.AzureInventorySnapshots (SnapshotId)`
- `ControlId` uniqueidentifier, not null
- `AssessmentId` uniqueidentifier, null
- `CreatedUtc`, `UpdatedUtc` datetime2, not null

Unique key: `TenantId`, `InstanceId`, `VerificationSnapshotId`, `ControlId`. A second write of the same key updates `UpdatedUtc`. A later snapshot for the same instance is a second row.

Indexes: `(TenantId, ControlId, VerificationSnapshotId)` and `(TenantId, InstanceId)`.

No payload column. No copy of `AuditEvidenceSnapshotItems`, `RemediationEvidence.PayloadJson`, or `VerificationResultJson`.

**Interface.** `IVerifiedRemediationControlAssociationRepository` with SQL (Dapper) and in-memory implementations, registered beside `IProjectScopedRemediationInstanceRepository` for both storage providers. Every read and write takes the project scope. A row in another tenant, workspace, or project is not found.

**Migration.** Next unused numeric prefix under `ArchLucid.Persistence/Migrations/`. Prefixes 409 and 410 are already duplicated; do not reuse a prefix. Add the matching rollback. Add the same DDL to `ArchLucid.Persistence/Scripts/ArchLucid.sql`. Regenerate `ArchLucid_Unified_Schema.sql` with the repo script named in `docs/library/SQL_SCRIPTS.md`. No SQL row-level security.

Do not call this repository from verification yet. That is SN-HAND-06.

## Tests

1. Insert returns the row in the same scope.
2. A second insert of the same tenant, instance, snapshot, and control updates `UpdatedUtc` and does not add a row.
3. A different `VerificationSnapshotId` for the same instance adds a second row.
4. A row in another tenant is not returned.
5. SQL and in-memory repositories pass the same contract tests.

## Concerns

- **Security.** Scope is tenant, workspace, and project. No RLS. No Azure write.
- **Scale.** One small identifier row per verified triple. No snapshot payload.
- **Reliability.** The unique key makes a repeat write idempotent.
- **Cost.** No second blob or evidence-item copy.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Explicit types over `var`. Null-check inputs. A blank line before `if` and `foreach` unless it is the first line in the method. No `ConfigureAwait(false)` in tests.
- Do not change `AuditEvidenceLineageRecord`, the lineage controller, or the remediation verify method.
- Do not change ReadyForPositiveCheckbox, human disposition, or any finding list.
- Do not commit.

## Done when

The table, both repositories, and the contract tests exist, and verification behavior is unchanged.
