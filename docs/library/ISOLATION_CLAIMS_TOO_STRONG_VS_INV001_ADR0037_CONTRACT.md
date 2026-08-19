> **Scope:** Contributor-reference — isolation claims too strong vs INV-001 / ADR 0037 (TB-1122); stale RLS-as-control purge inventory; not a buyer assurance claim.

# Isolation claims too strong vs INV-001 / ADR 0037 (TB-1122)

**Audience:** Contributors, principal architects, and GTM claim reviewers.  
**Not** a buyer brochure — Layer A catalog routing + INV-001 decide-once are the safe pin; this contract inventories **too-strong** language and the **stale-doc purge list**.

**Status:** Shipped contract for **TB-1122** / GTM **M-194** / **M-195**. Honesty CI: **TB-1123** (**Done** — `scripts/ci/check_isolation_claims_too_strong_honesty.py`).

**Buyer / PA handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-claims-vs-inv001-adr0037-m-195`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-claims-vs-inv001-adr0037-m-195).  
**Path-stable alias:** [`ISOLATION_CLAIMS_VS_INV001_ADR0037_PA_ONE_PAGER.md`](../go-to-market/ISOLATION_CLAIMS_VS_INV001_ADR0037_PA_ONE_PAGER.md).  
**DiD spine:** [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) (ADR 0037).  
**Scope decide-once:** [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) (**TB-999**).  
**DiD erosion:** [`TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md`](TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md) (**TB-1232**).

---

## Decision in one line

Safe pin = **database-per-tenant catalogs (Layer A)** + **INV-001 decide-once** + **M-114** identity-wins (with caveats). SQL RLS is a **non-control** (ADR 0037). Workspace/project scope is **organizational**, not the paying-client security boundary. NetArchTest / `WHERE TenantId` / empty-AllowedTools / empty-TenantId / crypto-proof Search are **not** isolation proofs alone.

---

## Too strong vs shipped

| Too strong | Shipped / safe | Owner honesty cluster (cite — do not duplicate) |
|------------|----------------|--------------------------------------------------|
| “SQL RLS isolates tenants” / “RLS protects production” | ADR 0037 — RLS removed; catalogs + app predicates | **M-194** / this contract; historical only: [`MULTI_TENANT_RLS.md`](../security/MULTI_TENANT_RLS.md) |
| Workspace/project as paying-client security boundary | Organizational dimensions inside a tenant catalog | **M-114**; ADR 0037 decision summary |
| “G3 fully proven / crypto-provable isolation” without caveats | G3 = catalog + decide-once + Search filter DiD; DiD erosion residual **TB-1233** | [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md); honesty CI **TB-1123** Done |
| Per-tenant Azure AI Search index / crypto-proof retrieval | Shared index + mandatory OData `$filter` | **M-152** / **M-153** / **TB-1001** |
| NetArchTest / ARCH001 alone = isolation | Compile-time DAG ≠ runtime tenancy | **M-156** / **TB-1005** |
| Empty `AllowedTools` = confined agent | Fail-closed tools are separate; empty must not mean unrestricted on prod-like hosts | **M-115** / **TB-950** (Done) |
| Empty `TenantId` → no data | Empty → **system catalog** risk | **M-168** / **M-169** / **TB-1018** |
| Uniform append-only audit = all events Required | Required vs informational audit paths differ | **M-118** / **TB-954** |
| `WHERE TenantId` / scope threading = paying-client boundary | Erodible Layer D DiD | **M-213** / **TB-1232** |

---

## Safe to claim

| Claim | Anchor |
|-------|--------|
| Production-like hosts use **database-per-tenant** SQL catalogs | ADR 0037; `SystemWithPerTenantCatalogs` |
| Tenant identity is decided **once** at the host into typed `ScopeContext` | INV-001 / **TB-999**; **M-114** identity-wins |
| Client `x-tenant-id` does **not** establish production tenant identity | **M-150** / **TB-999** |
| Product Search paths require scope `$filter` (not a per-tenant index) | **TB-071** / **TB-1001** |
| SQL RLS is **not** a deployed production control | ADR 0037; migration 148 removal |

---

## Stale RLS-as-control purge list (living docs)

Relabel or rewrite these so buyer/procurement surfaces never present RLS as a live production control. Historical engineering sketches may remain **only** behind an explicit superseded banner.

| Path | Required posture after **TB-1122** |
|------|-------------------------------------|
| [`docs/compliance/CAIQ_LITE.md`](../compliance/CAIQ_LITE.md) | Database-per-tenant + scope predicates — **no** “using RLS” |
| [`docs/security/CAIQ_LITE_2026.md`](../security/CAIQ_LITE_2026.md) | Product context cites catalogs / ADR 0037 — **no** “with row-level security” |
| [`docs/security/SIG_CORE_2026.md`](../security/SIG_CORE_2026.md) | Data-protection evidence → DiD spine / ADR 0037 — **not** `MULTI_TENANT_RLS.md` as live control |
| [`docs/security/COMPLIANCE_MATRIX.md`](../security/COMPLIANCE_MATRIX.md) | Tenant isolation evidence → DiD spine + ADR 0037 |
| [`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md) | RLS / risk-acceptance links labeled **historical / superseded** |
| [`docs/security/PRIVACY_NOTE.md`](../security/PRIVACY_NOTE.md) | Funnel reads use tenant-scoped SQL / catalog predicates — **not** “RLS-scoped” |
| [`docs/library/ARCHITECTURE_CONTAINERS.md`](ARCHITECTURE_CONTAINERS.md) | Persistence wording: scoped SQL / catalog routing — **not** “RLS-aware” |
| [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md) Layer 2 | Link DiD spine — **not** `MULTI_TENANT_RLS.md` as Layer 2 control |
| [`docs/security/MULTI_TENANT_RLS.md`](../security/MULTI_TENANT_RLS.md) | Keep superseded banner; body must not re-sell optional production RLS |
| [`docs/security/RLS_RISK_ACCEPTANCE.md`](../security/RLS_RISK_ACCEPTANCE.md) | Historical only (already superseded) |

Do **not** duplicate bodies of **M-150** / **M-152** / **M-156** / **M-168** / **M-115** / **M-118** — cite them from the too-strong table.

---

## G3 claim readiness soften

[`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md) **G3** means: Layer A catalogs + INV-001 + Search filter DiD are **shipped and reviewable** — **not** “cryptographically proven isolation” and **not** “no residual DiD erosion.”

- Prefer signal wording: **Tenant isolation (catalog + decide-once)** over **Tenant isolation provable**.
- Stale **TB-948** / **TB-949** blockers on G3 were ID reuse / harness leftovers — do **not** re-block G3 on those IDs.
- Honesty CI **TB-1123** Done (this contract’s anti-RLS-as-live guard). Residual DiD erosion honesty: **TB-1233** (anti-WHERE-equals-isolation).

---

## CI anchors for **TB-1123**

Targets enforced by `scripts/ci/check_isolation_claims_too_strong_honesty.py` (**TB-1123** Done):

| Anchor class | Example dishonest stub | Safe rewrite |
|--------------|------------------------|--------------|
| RLS-as-live | “Azure SQL with row-level security” as production isolation | “database-per-tenant catalogs (ADR 0037)” |
| Workspace boundary | “workspace is the tenant security boundary” | “workspace/project are organizational scope” |
| Crypto / per-tenant Search | “per-tenant Search index” / “crypto-proof retrieval” | “mandatory OData scope `$filter`” |
| NetArch alone | “architecture tests prove isolation” | “compile-time DAG + Layer A + INV-001” |
| G3 overclaim | “G3 PASS = fully proven isolation” near unqualified PASS | Require this contract / M-195 matrix nearby |

Wire: buyer-doc scan in `scripts/ci/check_isolation_claims_too_strong_honesty.py` + `run_buyer_surface_strict_guards.py` (**TB-1123** Done). Point Verification at existing clusters **TB-1000** / **TB-1002** / **TB-1006** / **TB-1019** without duplicating their scopes.

---

## Related

- GTM **M-194** / **M-195** (Done content) · **M-114** (isolation one-pager)
- Engineering **TB-1123** (honesty CI — **Done**) · **TB-1232** / **TB-1233** (DiD erosion)
- ADR [0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md)
