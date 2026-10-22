# CA-06 — DDL sync and physical table tests

**Do not add product features.** This prompt is the **migration honesty** leftover after CA-02–05.

## Goal

The identity schema cannot exist in only one of the three SQL sources.

1. `ArchLucid.Persistence/Scripts/ArchLucid.sql`
2. `ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql`
3. Numbered `Migrations/NNN_*.sql` from CA-02 / CA-03

Extend `ArchitecturesPhysicalTableMigrationSqlIntegrationTests` **or** add a sibling class (one class per file) that asserts:

- `dbo.Architectures.DisplayName` exists and is NOT NULL
- `dbo.DraftRequests.ArchitectureId` exists
- FK name is stable enough to assert

## Why

This repo has failed before when a migration landed and the unified script did not. A livelihood object that exists only on fresh installs is not a customer object.

## Context

- `ArchLucid.Persistence.Tests/Data/Infrastructure/ArchitecturesPhysicalTableMigrationSqlIntegrationTests.cs`
- `ArchLucid.Architecture.Tests/Adr0064PhysicalTableDdlArchitectureTests.cs`

## What to build

1. Assertions + any missing idempotent DDL in the two script files.
2. Do not invent a fourth schema source.

## Acceptance criteria

- Integration test fails if DisplayName is dropped from the unified script.
- No sealed-byte columns on Architectures.

## Constraints

- Scoped compile on the test project you touch.
- Do not run full-solution build.
