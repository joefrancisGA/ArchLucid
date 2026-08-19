> **[Superseded 2026-06-06]** SQL RLS removed per ADR 0037. Database-per-tenant catalogs + app-layer scope predicates are the production controls. This document is retained as historical context only.

> **Scope:** ADR 0003: SQL RLS and SESSION_CONTEXT - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).


# ADR 0003: SQL RLS and SESSION_CONTEXT

- **Status:** Superseded by [ADR 0037](0037-tenant-isolation-without-rls-defense-in-depth.md) (2026-06-06) for production posture. Historical record only.
- **Date:** 2026-04-04

## Context

Multi-tenant data in SQL Server should be isolated even if application bugs omit scope predicates.

## Decision

Deploy RLS policies with **`SqlServer:RowLevelSecurity:ApplySessionContext=true`** in **Production** when `ArchLucid:StorageProvider=Sql`. The applicator sets `SESSION_CONTEXT` keys for tenant/workspace/project per connection.

## Consequences

- **Positive:** Defense in depth aligned with enterprise expectations.
- **Negative:** Connection setup overhead; misconfiguration fails startup validation by design.

## Links

- `docs/security/MULTI_TENANT_RLS.md` (if present) or migration `036_RlsArchiforgeTenantScope.sql` (the policy / predicate / SESSION_CONTEXT key names defined in 036 were renamed atomically by `108_RlsRenameToArchLucid.sql` (2026-04-21) to `rls.ArchLucidTenantScope` / `rls.archlucid_*_predicate` / `al_*` — see MULTI_TENANT_RLS § 10).
