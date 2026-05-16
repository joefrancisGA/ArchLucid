> **Scope:** Next refactorings - full detail, tables, and links in the sections below.
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Next refactorings

**Last updated:** 2026-05-07.

**Where to start:** [START_HERE.md — What to open first](../START_HERE.md) (Mermaid + table).

## Archive (full historical backlog)

The **complete** numbered backlog (§8–§342, batch checklists, and completed batch logs through 2026-04-14) is preserved verbatim in:

**[`docs/archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md`](../archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md)**

Use that file when you need the original write-ups for items already marked done in checklists, or for copy-paste context when reviving a deferred idea. **This page** stays short so new contributors are not confronted with 2k+ lines at the front door.

## Active items (prioritized top 10)

1. **Unify Data and Persistence:** Merge overlapping `ArchLucid.Persistence.*` projects to simplify dependency graphs. (See `PERSISTENCE_CONSOLIDATION_PLAN.md`).
2. **Connection factory alignment:** Standardize `ISqlConnectionFactory` vs `IDbConnectionFactory`. (2026-05-08: removed unused `ArchLucid.Persistence.Data.Infrastructure.SqlConnectionFactory` that read `IConfiguration` directly; SQL hosts remain `SqlScopedResolutionDbConnectionFactory` → scoped `ISqlConnectionFactory`.)
3. **Magic numbers / named bounds (MN-1 phase 2):** Complete NSwag-generated client style (`is null` / templates or post-process), optional `IOptions` for commit backoff.
4. **Error Message Sanitization:** Ensure internal pipeline nomenclature (e.g. "Authority") does not leak in HTTP 400/500 responses.
5. **Configuration Boilerplate Reduction:** Strip `appsettings.json` boilerplate so pilots only see the absolute minimum connection strings.

*(Only keep the top 10 actionable items here. Migrate completed items to the archive.)*

## Contracts note (unchanged)

Move heavy **service interfaces** out of **`ArchLucid.Contracts`** into owning assemblies when team boundaries justify churn; keep DTOs in **Contracts**. See **ADR 0013** (`docs/adr/0013-api-versioning-and-json-schema-versioning.md`).
