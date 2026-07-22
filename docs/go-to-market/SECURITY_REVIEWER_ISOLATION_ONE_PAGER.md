> **Scope:** Buyer-safe one-pager for security reviewers on tenant isolation. Complements [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md); does not replace it.

> **Spine:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) · [`GTM_BACKLOG.md`](GTM_BACKLOG.md) **M-114** · tech **TB-925** / **TB-948** / **TB-949**

# Tenant isolation — security reviewer one-pager

**Product:** ArchLucid (hosted SaaS / customer-facing review packages)  
**Claim (G3):** Authenticated identity binds tenant/workspace scope; client-supplied scope headers cannot override that binding on production-like hosts.

---

## What we claim

| Statement | Meaning |
|-----------|---------|
| Identity wins | JWT (or API key) subject → resolved tenant/workspace; forged `x-tenant-id` / actor headers do not steer reads or writes |
| Database-per-tenant (default SaaS) | Customer data lands in a tenant-scoped database catalog where configured |
| SingleCatalog | Shared catalog mode is for CI / local / controlled demo — not the default production isolation story |
| No silent cross-tenant | Scope-sensitive APIs deny (typically **403**) when headers disagree with identity |

---

## What we do **not** claim (V1)

- CPA-attested SOC 2 Type II as a completed program (**TB-135** — V1.1)
- Third-party pen-test report as a shipped deliverable (**TB-136** — V1.1)
- That DevBypass or test actor headers are safe on production hosts (they must be rejected — **TB-949**)

---

## How a reviewer can check (15 min)

1. Authenticate as Tenant A on a **JwtBearer** (or ApiKey) host — not DevelopmentBypass.  
2. Call a scope-sensitive endpoint with a forged Tenant B header.  
3. Expect **deny**, not Tenant B payload.  
4. Optionally: Ask / Search with B’s identifiers while A is authenticated — no cross-tenant hits.  
5. Ask for the latest isolation evidence artifact (**TB-948**) if your process requires an attachment.

Full technical narrative: [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md).  
Live PA script with two other claims: [`PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md`](PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md).

---

## Engineering evidence (internal IDs)

| ID | Status intent | Role |
|----|---------------|------|
| **TB-925** | Done | JwtBearer forged-header scope binding |
| **TB-948** | Open | Isolation evidence harness → attachable artifact |
| **TB-949** | Open | Production-like reject of DevBypass / `AllowTestActorHeaders` |

---

## Security / reliability / cost (why this shape)

| Concern | Posture |
|---------|---------|
| Security | Least privilege: identity is source of truth; headers are hints at best and must not expand scope |
| Scalability | Per-tenant catalogs scale independently; SingleCatalog stays out of the buyer isolation story |
| Reliability | Fail closed on mismatch (deny) rather than serve mixed scope |
| Cost | Isolation checks are auth middleware + catalog routing — no third-party isolation SaaS required for V1 claim |

---

## Related claims in the same review

- **G2** — Audit chain / hash-verified manifest (export verify)  
- **G1 / G5** — Execution-mode honesty (Real vs Simulator)  

See [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md).
