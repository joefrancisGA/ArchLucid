> **Scope:** ADR 0087 — Optional architecture-scoped sharing inside the tenant (architecture-spine AS-086). Does **not** replace ADR 0037 catalog isolation.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0087: Architecture-scoped sharing inside the tenant (RestrictToShares)

- **Status:** Proposed
- **Date:** 2026-09-10
- **Owner decision:** Optional **restrict-to-shares** per architecture inside a tenant catalog — amends ADR 0074 “no per-architecture ACL in V1” with an opt-in minimum share list (AS-086).

## Context

Consultancies and ARB+delivery teams in one tenant cannot isolate a sensitive package when every workspace member sees every architecture. ADR 0037 keeps **database-per-tenant** isolation. ADR 0074 deferred full ACL rewrite.

**Related:** ADR 0037 (tenant catalog isolation), ADR 0074 (workspace ACL deferral), ADR 0039 (sealed immutability).

## Decision

1. **Default open:** Existing architectures remain workspace-visible (`RestrictToShares = 0` grandfather).
2. **Opt-in restrict:** An architecture may set **RestrictToShares** so only listed shares see it (AS-089).
3. **Share roles:** View, Decide, Admin on `ArchitectureShares` — users/groups inside the tenant only (AS-090+).
4. **App-layer ACL:** Enforcement in API/UI — **no SQL RLS** (AS-097 ratchet).
5. **Not in scope:** Live presence, finding-comment chat, second tenant, or replacing ADR 0037 catalogs.

## Trade-offs

**Gains:** Minimum viable package isolation for mixed delivery teams; IDOR-tested list/hub behavior when opt-in (AS-094 / AS-095).

**Sacrifices:** Share administration overhead; misconfigured restrict could hide a package from everyone unless auto-insert Admin share for setter (AS-089).

**Rejected:** SQL RLS; SCIM-group-only shares without user rows; cross-tenant sharing.

## Constraints

- **Do not** replace ADR 0037 tenant catalog isolation.
- **Do not** add SQL RLS for shares.
- **Do not** invent live presence or finding-comment chat.
- Terraform for net-new infra follows existing SQL/API patterns (AS-087+).

## Expected impact

**System:** ADR-only in AS-086; SQL `ArchitectureShares` + API/UI in AS-087–AS-099.

**Security:** IDOR tests for list/detail/export; 404 vs 403 choice documented in AS-095; audit on grant/revoke.

**Operations:** Grandfather open default avoids breaking existing tenants.

**Cost:** Engineering waves AS-087–AS-099 — not a single prompt.

## Consequences

- **Positive:** Quoteable amend of “no per-architecture ACL” → optional restrict-to-shares inside tenant.
- **Follow-ups:** AS-087 SQL · AS-089 opt-in API · AS-094 hub list · AS-097 no-RLS ratchet.
