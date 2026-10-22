# DA-02 — Schema: architecture display name + draft FK

**Do not merge** `DraftRequests` and `Runs`. **Do not put sealed manifest bytes on `dbo.Architectures`.** This is the **schema of ADR 0074**. ADR 0074 must be Proposed or Accepted in this PR or already on the branch.

## Goal

Make the physical identity **nameable and parent to drafts**.

1. `dbo.Architectures`: add required **display name** (and optional short description if cheap — do not invent a document column that duplicates `DraftRequests.DocumentJson`).
2. `dbo.DraftRequests`: add nullable `ArchitectureId` FK → `dbo.Architectures`, plus a scoped index. Legacy nulls are DA-12.
3. `ArchitectureIdentityRecord` / Dapper SQL / in-memory repository: persist the new columns.
4. Do not rename `DraftId`. Do not move document JSON onto Architectures.

## Why

Migration 323 created an identity with `CurrentModelId` and `LatestSealedManifestId` only. Architects cannot scan a portfolio of GUIDs. Drafts pin `SpawnedArchitectureVersionId` at spawn but never belong to an architecture **while they are being written**. That is how the SPA ended up calling `draftId` `architectureId`.

## Context

- ADR 0074 (DA-01)
- `ArchLucid.Persistence/Migrations/323_Architectures.sql`
- `ArchLucid.Persistence/Scripts/ArchLucid.sql` + `ArchLucid_Unified_Schema.sql` (both must receive the same DDL)
- `SqlArchitectureIdentityRepository.cs`, `InMemoryArchitectureIdentityRepository.cs`
- `IArchitectureIdentityRepository.cs`
- `DraftRequestResponse.cs` — no `ArchitectureId` today
- `ArchitecturesPhysicalTableMigrationSqlIntegrationTests.cs`
- User rule: one DDL file per database **and** this repo’s numbered DbUp migration. Next file is `NNN` = current max in `ArchLucid.Persistence/Migrations/` + 1.

## What to build

1. Numbered migration `NNN_ArchitectureIdentityDisplayNameAndDraftFk.sql`:
   - `DisplayName NVARCHAR(200) NOT NULL` with a backfill of `N'Untitled architecture'` for existing rows (DA-12 may overwrite from system name).
   - Optional `Description NVARCHAR(500) NULL`.
   - `DraftRequests.ArchitectureId UNIQUEIDENTIFIER NULL` + FK + filtered index `(TenantId, WorkspaceId, ProjectId, ArchitectureId)`.
2. Same statements in `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql` (idempotent `COL_LENGTH` / `IF NOT EXISTS` pattern used by 323).
3. Contract + repositories + in-memory clones.
4. C# tests: create identity requires name; GetById returns name; in-memory and SQL mapping round-trip. Integration test asserts columns exist (extend `ArchitecturesPhysicalTableMigrationSqlIntegrationTests` or sibling file — **one class per file**).
5. Do not add HTTP endpoints here (DA-03). Do not change SPA hooks (DA-05).

## Acceptance criteria

- Existing identity rows remain loadable after migration.
- A draft can be inserted with `ArchitectureId` set or null.
- No sealed-record columns added to Architectures.
- Tenant isolation: all new SQL includes `TenantId` (and workspace/project where the table already scopes).

## Constraints

- Check nulls. Concrete types. Blank line before `if` / `foreach` unless first in method.
- No `ConfigureAwait(false)` in tests.
- `.\scripts\ci\agent-compile-check.ps1` on Persistence + Contracts + Application test projects you touch.
- Do not implement G-REAL-06 engines.
