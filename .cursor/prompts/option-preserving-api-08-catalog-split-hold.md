# OP-08 — Hold: catalog / DDL split (last, not gradual-on-day-one)

**Tech backlog:** **TB-2401** — [`docs/library/TECH_BACKLOG_TB2400_INDEX.md`](../../docs/library/TECH_BACKLOG_TB2400_INDEX.md). Pick up **TB-2401** when the owner directs that row; do not implement from this prompt unless the session explicitly names **TB-2401**.

**This prompt is a hold.** Implement **nothing** unless the owner’s message in **this same session** explicitly picks up **TB-2401** (or reopens a **named** second database or a second `ArchLucid.sql` / DbUp journal). “We might split the database later” in a prior chat is **not** a reopen.

## Goal

Keep **one tenant catalog model** and **one DDL file per database** (`ArchLucid.Persistence/Scripts/ArchLucid.sql` + DbUp `Migrations/`).

Do **not**:

- Add `ArchLucid.SecureNow.sql` or a product-line connection string
- Split `Migrations/` by product
- Change ADR 0037 (per-tenant catalogs are **tenant** isolation, not Architecture vs SecureNow)
- Revive SQL RLS as the product-line boundary (`.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc`)
- Let two API hosts both run DbUp against the same `SchemaVersions` journal
- Add cross-database FKs or dual-write “just for now”

If asked to “split the database so the APIs can diverge,” answer with this hold and [`.cursor/prompts/option-preserving-api-00-index.md`](option-preserving-api-00-index.md). The cut lives in OP-01–06 until an **explicit integration contract** exists (events or a tiny shared identity catalog) with **no** leftover FKs across product tables.

## Why

Two HTTP projects on one `ArchLucid.sql` make the schema the real unversioned API. Every new findings↔runs FK makes the later split harder. User/repo rule is **one DDL file per database**. Product-line catalogs would also be a new isolation topology (not ADR 0037’s paying-tenant boundary).

## Context

- `docs/library/SQL_SCRIPTS.md`
- `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- ADR 0037 + `docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`
- OP-01 map `ownerNote`s that mention tables — those are observations, not a license to split

## What to build

Nothing. If the owner explicitly reopens a catalog split in this session, **stop and confirm** before writing code:

1. Which tables move vs stay in a shared identity/platform catalog.
2. How existing FKs are replaced (events, replicated keys, or explicit anti-corruption layer).
3. Who migrates (one migrator).
4. Tenant provisioning: still `SystemWithPerTenantCatalogs` per **customer**, plus product? (If both products share a paying tenant, a product catalog split is the hardest hybrid — confirm that is intended.)
5. Still one DDL file **per** surviving database.
6. OP-07 host split is not implied; quote it separately if both are in scope.

Do not begin that work from this file alone.

## Acceptance criteria

- Session ends with no Persistence script / connection-string / ADR 0037 diff unless the owner’s explicit reopen is quoted in the summary.

## Constraints

- Do not add GTM **M-90 / M-44 / M-91 / M-92** or reopen **TB-135** / **TB-136**.
- Do not treat SingleCatalog local-dev as a product-line split.
- Do not hide desktop review tabs behind **More**.
