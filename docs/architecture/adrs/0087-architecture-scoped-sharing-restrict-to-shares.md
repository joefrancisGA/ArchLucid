> **Scope:** ADR 0087 — Optional **restrict-to-shares** per architecture inside a tenant workspace (architecture-spine AS-086). Does **not** replace ADR 0037 catalog isolation or introduce SQL RLS.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0087: Architecture-scoped sharing inside the tenant (RestrictToShares)

- **Status:** Proposed
- **Date:** 2026-09-10
- **Owner decision:** V1 adds an optional **share list** per architecture for consultancies and ARB+delivery in one tenant — not a second tenant, not finding-comment chat, not live presence
- **Amends:** ADR **0074** decision 6 only — “no per-architecture ACL in V1” becomes **optional restrict-to-shares** (default off / workspace-visible)

## Context

ADR **0074** productized customer-visible **architecture identity** (`dbo.Architectures`) as the Working noun. ADR **0037** keeps tenant isolation on **database-per-tenant catalogs** with app-layer scope — **no SQL RLS**.

**Livelihood gap:** A consultancy or enterprise program may host **multiple delivery teams in one tenant** while needing one sensitive architecture package visible only to named collaborators. A full workspace ACL rewrite was deferred; wave 22 adds the **minimum share list** without replacing catalog isolation.

ADR **0079** / **0077** explicitly rejected **per-architecture ACL** and **live presence / finding-comment chat** for V1. This ADR **narrows** that rejection: optional **RestrictToShares** is allowed; chat and presence remain out of scope.

**Related (not rewritten):** ADR 0037 (tenant catalog boundary), ADR 0039 (sealed immutability), ADR 0068 (dual kernel), ADR 0074 (architecture identity), ADR 0079 (Working desk), ADR 0083 (same-tx Required audit pattern for share mutations — AS-093), ADR 0084 (kernel decide inputs).

## Decision

1. **Default remains workspace-visible (grandfather):** Existing and new architectures default to **workspace-visible** — any workspace member with existing draft/review access can see the architecture unless an owner opts in to restriction (AS-088).
2. **Optional RestrictToShares:** An architecture may set **`RestrictToShares = true`**. When enabled, only principals on the architecture **share list** (plus tenant/workspace admins per product policy) may read or act per their share role. Hub list, search, and API honor the flag (AS-094, AS-095).
3. **Share roles (V1):** Grants are **per user** (Entra `oid` / stable user id — AS-096). Roles on a share row:
   - **View** — read architecture desk, sealed history, and exports allowed by existing gates.
   - **Decide** — View plus Working decide actions on in-flight reviews bound to the architecture (promote/submit/activate paths unchanged; audit co-commit per ADR 0083 / AS-093).
   - **Admin** — Decide plus manage share list and RestrictToShares opt-in/out (subject to Required durable audit).
4. **Inside the tenant only:** Sharing does **not** create a second tenant, cross-tenant catalog access, or SCIM group expansion in this wave (AS-096). Catalog routing stays ADR 0037.
5. **No SQL RLS:** Enforcement is **application-layer** on repositories and HTTP handlers (AS-091, AS-097 ratchet). Do not introduce `rls.*` policies for `ArchitectureShares`.
6. **Hidden architecture response (AS-095):** Unshared principals receive **404 Not Found** (not 403 Forbidden) for restricted architecture ids — avoids leaking existence to workspace members who are not on the share list. Admin/audit surfaces may use explicit 403 where policy requires a denial reason.
7. **Audit:** Grant, revoke, role change, and RestrictToShares toggles **co-commit** Required durable audit with the domain write (ADR 0083 pattern — AS-093). Fail closed if audit insert fails.
8. **Explicit non-goals:** This ADR does **not** add **finding-comment chat**, **live presence avatars**, or a **second tenant** model. Collaboration remains shared identity + review history under workspace scope.

### Quoteable amend (ADR 0074)

| Prior (0074 §Decision 6) | After 0087 |
| --- | --- |
| **Permissions:** No per-architecture ACL in V1. Workspace scope (ADR 0037) is the permission boundary. | **Permissions:** Default **workspace-visible** (unchanged). **Optional** `RestrictToShares` per architecture with a named user share list (View / Decide / Admin). Still **no SQL RLS**; ADR 0037 catalog boundary unchanged. |

## Trade-offs

**Gains:** Sensitive packages can be isolated inside one tenant without a full ACL platform; quoteable answer to “can I share one architecture with two principals?”; IDOR tests and audit co-commit have a named contract (AS-091–AS-093).

**Sacrifices:** More authorization branches on list/get/decide paths; share panel UX and OpenAPI surface (AS-092, AS-099); 404-vs-403 support training; user-grant maintenance (no SCIM groups in V1).

**Rejected:** SQL RLS for shares; SCIM group grants in V1; finding-comment chat or presence; replacing ADR 0037 catalog split; making RestrictToShares the default for all new architectures; cross-tenant sharing.

## Constraints

- **Do not** replace ADR **0037** tenant catalog isolation or add SQL RLS for `ArchitectureShares` (AS-097 ratchet).
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** add finding-comment chat or live presence avatars.
- **Do not** flip `AgentExecution:Mode` host default (ADR 0086).
- **TB-645 vocabulary** on share panel and help (AS-098). **TB-2005** on share grant forms.
- V1 share principals are **users** (`oid`), not SCIM groups (AS-096).

## Expected impact

**System:** AS-087–AS-099 implement `ArchitectureShares` storage, API, UI panel, IDOR tests, help copy, and OpenAPI. Default grandfather keeps existing workspaces unchanged until opt-in.

**Security:** RestrictToShares closes IDOR where workspace membership alone previously implied read access to every architecture. 404-on-miss reduces enumeration. Required audit on share mutations supports SOC-style access reviews. Tenant boundary remains catalog-per-tenant (0037) — shares never span tenants.

**Scalability:** Share list is bounded per architecture (product caps in AS-087 SQL); list/search filters add predicates — acceptable for V1 consultancy scale.

**Reliability:** Fail-closed audit co-commit rolls back share mutations on audit failure (0083 pattern).

**Cost:** Incremental SQL rows and API checks; no second database per share; no RLS policy operational overhead.

**Teams:** Consultancies can run ARB + delivery in one tenant; security reviewers get a written 404 policy and audit trail; support cites 0087 + help topic (AS-098) for “sharing is not a second tenant.”

## Consequences

- **Positive:** 0087 becomes the merge-blocking question for “add RLS / group ACL / chat for shares?”; wave 22 share cluster can proceed after ADR lands.
- **Negative:** Contract-only until AS-087 SQL ships; 404 default may confuse operators expecting 403 — document in AS-095 and help.
- **Follow-ups:** AS-087 SQL `ArchitectureShares` + flag; AS-088 grandfather default; AS-089 opt-in API; AS-090 role matrix; AS-091 IDOR tests; AS-092 UI share panel; AS-093 audit co-commit; AS-094 hub/search filters; AS-095 404 policy implementation; AS-096 users-only; AS-097 no-RLS ratchet; AS-098 help; AS-099 OpenAPI + tests; AS-100 wave close audit (**ratchet:** `ArchitectureSpineAs086ArchitectureShareAclArchitectureTests` when landed).
