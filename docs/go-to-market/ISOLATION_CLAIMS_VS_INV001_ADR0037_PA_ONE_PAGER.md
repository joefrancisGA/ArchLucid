> **Reviewed:** 2026-07-28

> **Scope:** PA handout for isolation claims too strong vs INV-001 / ADR 0037 (GTM **M-195** / **TB-1122**). Complements Done **M-114**; does not reopen RLS.

# Isolation claims vs INV-001 / ADR 0037

**Audience:** Security reviewers and principal architects challenging tenancy language.

**Claim:** Safe pin = **database-per-tenant** + **INV-001 decide-once** + **M-114** identity-wins. Do **not** cite SQL RLS as a deployed production control. Do not treat workspace/project as the paying-client security boundary. Do not claim G3 fully proven without **TB-948**/**TB-949**. Do not promise per-tenant Search index / crypto-proof retrieval / NetArchTest-alone isolation.

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “SQL RLS isolates tenants” | ADR 0037 — RLS is non-control |
| “NetArchTest proves isolation” | Compile-time DAG ≠ runtime tenancy (**M-156**) |
| “Per-tenant Search index / crypto-proof retrieval” | Mandatory OData `$filter` (**M-152**/**M-153**) |
| “Empty TenantId returns no data” | Empty-scope routing risks (**M-168**/**M-169**) |
| “G3 PASS without isolation evidence” | Soften until **TB-948**/**TB-949** artifacts |

---

## Stale language purge

Remove buyer-facing “RLS protects production” / “headers select tenant” / “architecture tests = isolation proof.” Point to [`../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) + [`BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114`](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114).

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151) (`TENANT_IDENTITY_SINGLE_DERIVATION_PA_ONE_PAGER.md` alias) · [`RETRIEVAL_TENANCY_HIT_GUARANTEE_PA_ONE_PAGER.md`](RETRIEVAL_TENANCY_HIT_GUARANTEE_PA_ONE_PAGER.md) · **M-213**/**M-255** (DiD erosion).
