# CA-02 — Schema: architecture display name

**Do not merge** `DraftRequests` and `Runs`. **Do not put sealed manifest bytes on `dbo.Architectures`.** **Do not add the draft FK here** (CA-03). ADR 0074 must be Proposed or Accepted on the branch (CA-01).

## Goal

Make the physical identity **nameable**.

1. `dbo.Architectures`: required **DisplayName** `NVARCHAR(200) NOT NULL`.
2. Optional **Description** `NVARCHAR(500) NULL` — not a document column that duplicates `DraftRequests.DocumentJson`.
3. Existing rows: backfill `N'Untitled architecture'` (CA-18 may overwrite from system name).
4. Do not rename `ArchitectureId`. Do not add `CurrentDraftId` as a stored column (CA-05 computes pointers).

## Why

Migration 323 created an identity with `CurrentModelId` and `LatestSealedManifestId` only. Architects cannot scan a portfolio of GUIDs. A livelihood object has a name you can say in a meeting.

## Context

- ADR 0074 (CA-01)
- `ArchLucid.Persistence/Migrations/323_Architectures.sql`
- `ArchLucid.Persistence/Scripts/ArchLucid.sql` + `ArchLucid_Unified_Schema.sql`
- User rule: one DDL file per database **and** numbered DbUp migration. Next file is current max + 1 (today **366** if 365 is still the max).

## What to build

1. Numbered migration `NNN_ArchitectureIdentityDisplayName.sql` with `COL_LENGTH` / `IF NOT EXISTS` guards matching 323.
2. Same statements in `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`.
3. Do **not** change C# repositories yet (CA-04) unless the migration cannot be reviewed without a failing column-exists test — then add only the SQL integration assert.

## Acceptance criteria

- Existing identity rows remain loadable after migration.
- New inserts without a name fail at the database (NOT NULL).
- No sealed-record columns added.

## Constraints

- Tenant isolation: do not drop `TenantId` / workspace / project columns.
- Check nulls. No `ConfigureAwait(false)` in tests.
- Do not implement CA-03 FK in the same file unless you are blocked — prefer a dedicated migration so rollback is obvious.
