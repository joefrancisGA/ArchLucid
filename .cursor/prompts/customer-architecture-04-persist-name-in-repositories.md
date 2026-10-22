# CA-04 — Persist display name in identity contracts and repositories

**Do not add HTTP.** **Do not ensure-on-save** (CA-09 / CA-14). Schema columns from CA-02 (and FK from CA-03 if already present) must exist.

## Goal

`ArchitectureIdentityRecord` and both repositories round-trip **DisplayName** (and Description if CA-02 added it).

1. Extend `ArchitectureIdentityRecord` with `DisplayName` (required string) and optional `Description`.
2. `IArchitectureIdentityRepository.CreateAsync` takes a name (or a create args type in its **own file**).
3. `SqlArchitectureIdentityRepository` + `InMemoryArchitectureIdentityRepository` persist the new columns.
4. `CreateAsync` without a name is illegal in Application (null/whitespace → throw `ArgumentException`).

## Why

DDL without mapping leaves the desk reading GUIDs. Every later CA prompt assumes the record has a name.

## Context

- `ArchLucid.Contracts/Architecture/ArchitectureIdentityRecord.cs`
- `SqlArchitectureIdentityRepository.cs`, `InMemoryArchitectureIdentityRepository.cs`
- `IArchitectureIdentityRepository.cs`
- `ArchitectureIdentityService.cs` — update call sites that `CreateAsync` without a name (legacy Created-origin: pass system name or `Untitled architecture`)

## What to build

1. Contract + repository mapping.
2. C# tests: create requires name; GetById returns name; in-memory and SQL mapping round-trip.
3. Do not add `ListAsync` (CA-07).

## Acceptance criteria

- Existing `ArchitectureIdentityServiceTests` compile and still isolate by tenant.
- No identity row written with empty DisplayName from Application.

## Constraints

- Check nulls. Concrete types. One new type per file.
- `.\scripts\ci\agent-compile-check.ps1` on Persistence + Contracts + Application test projects you touch.
- No `ConfigureAwait(false)` in tests.
