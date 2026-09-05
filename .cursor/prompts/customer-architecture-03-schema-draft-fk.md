# CA-03 — Schema: DraftRequests.ArchitectureId FK

**Do not merge tables.** **Do not move DocumentJson onto Architectures.** Display name (CA-02) must exist on the branch or in this PR as a prior migration.

## Goal

Drafts **belong to** an architecture while they are being written.

1. `dbo.DraftRequests`: nullable `ArchitectureId UNIQUEIDENTIFIER NULL`.
2. FK → `dbo.Architectures(ArchitectureId)`.
3. Filtered index `(TenantId, WorkspaceId, ProjectId, ArchitectureId)` (use the actual draft scope columns already on the table).
4. Legacy nulls are CA-18.

## Why

Drafts pin spawn metadata at start-review but never belong to an architecture **while they are being written**. That is how the SPA ended up calling `draftId` `architectureId`.

## Context

- `DraftRequests` table in `ArchLucid.sql` / migration history
- `DraftRequestResponse.cs` — no `ArchitectureId` today
- CA-02 display-name migration (do not combine unless NNN would collide)

## What to build

1. Numbered migration `NNN_DraftRequestsArchitectureId.sql`.
2. Same DDL in both script files.
3. A draft can be inserted with `ArchitectureId` set or null.
4. Do not change HTTP (CA-11) or SPA hooks (CA-22).

## Acceptance criteria

- FK rejects a draft pointing at another tenant’s architecture (scope columns + FK; add a test if the existing tenant pattern does).
- Null FK still allowed for legacy.
- No rename of `DraftId`.

## Constraints

- All new SQL includes tenant/workspace/project where the parent table already scopes.
- One class per file if you add a SQL integration test class.
- Blank line before `if` / `foreach` unless first in method.
