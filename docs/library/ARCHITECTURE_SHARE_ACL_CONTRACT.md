> **Scope:** Engineering contract for optional **restrict-to-shares** per architecture inside a tenant (architecture-spine AS-086–AS-099 / ADR 0087). **Contributor-reference** — internal only.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md) · **Kernel ADR:** [ADR 0087](../architecture/adrs/0087-architecture-scoped-sharing-restrict-to-shares.md) · **Inventory bind (intersection example):** [`ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md`](ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md)

# Architecture share ACL contract

## Purpose

Consultancies need a **named user share list** per architecture without a second tenant or SQL RLS. Wave 22 adds **optional** `RestrictToShares` on `dbo.Architectures` plus `dbo.ArchitectureShares` grants. This document is the reviewer-facing matrix for how share roles intersect **existing** workspace authority — not a parallel permission kernel.

**Default (grandfather):** `RestrictToShares = 0` — workspace-visible; behavior unchanged until opt-in (AS-088).

---

## Role definitions (ADR 0087)

| Share role | Grants on a **restricted** architecture |
|------------|----------------------------------------|
| **View** | Read architecture desk, sealed history, and exports already allowed by workspace **ReadAuthority** |
| **Decide** | View plus Working decide actions (dispositions, inventory bind/unbind, finalize) — **only when** the principal also holds workspace **ExecuteAuthority** |
| **Admin** | Decide plus manage share list and `RestrictToShares` opt-in/out |

Roles are cumulative: **Admin** satisfies **Decide** and **View** minimums; **Decide** satisfies **View**.

---

## Authority intersection (merge-blocking)

Share gates **add** checks on restricted architectures. They **do not** replace ADR 0034 / `ArchLucidPolicies` workspace roles.

| Capability | Workspace-visible (`RestrictToShares = 0`) | Restricted (`RestrictToShares = 1`) |
|------------|---------------------------------------------|-------------------------------------|
| **Read** | `ReadAuthority` | `ReadAuthority` **and** share ≥ View, **or** workspace/tenant admin bypass |
| **Decide** (dispose, bind inventory, finalize) | `ExecuteAuthority` | `ExecuteAuthority` **and** share ≥ Decide, **or** workspace/tenant admin bypass with `ExecuteAuthority` |
| **Admin** (shares + restrict flag) | `ExecuteAuthority` (first opt-in) | share **Admin**, **or** workspace/tenant admin bypass |

### Acceptance rows (AS-090)

| Principal | Restricted? | Share | Workspace authority | Decide allowed? |
|-----------|-------------|-------|---------------------|-----------------|
| A | Yes | Decide | Reader only | **No** — Decide share without ExecuteAuthority cannot dispose |
| B | Yes | *(none)* | ExecuteAuthority | **No** — ExecuteAuthority without share cannot dispose |
| C | Yes | Decide | ExecuteAuthority | **Yes** — intersection |
| D | No | *(n/a)* | ExecuteAuthority | **Yes** — grandfather workspace-visible |

Server helper: `ArchitectureShareAccessEvaluator` (AS-090). Enforcement on HTTP handlers uses `IArchitectureShareAccessService` plus existing `[Authorize(Policy = …)]` attributes.

---

## Explicit non-goals

| Forbidden | Why |
|-----------|-----|
| SQL RLS on `ArchitectureShares` | ADR 0037 app-layer scope; AS-097 ratchet |
| SCIM group grants in V1 | AS-096 users-only |
| Finding-comment chat or live presence | ADR 0087 |
| Replacing `ExecuteAuthority` with share alone | Livelihood writes stay on workspace execute gate |

---

## Related spine prompts

| Prompt | Topic |
|--------|-------|
| AS-087 | SQL `ArchitectureShares` + `RestrictToShares` column |
| AS-088 | Grandfather `RestrictToShares = 0` |
| AS-089 | Opt-in API + actor Admin bootstrap on empty list |
| AS-090 | Role matrix + evaluator (this contract) |
| AS-091 | IDOR tests |
| AS-093 | Required durable audit co-commit |
| AS-095 | 404 policy for unshared principals |
