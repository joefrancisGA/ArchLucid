> **Scope:** Contributor-reference — tenant identity single derivation (INV-001 / TB-999); decide-once typed ScopeContext versus SQL RLS or NetArchTest isolation claims.

# Tenant identity single derivation (INV-001 / **TB-999**)

> **Audience:** Contributors, principal architects, and GTM claim reviewers.  
> **Not** a buyer assurance claim — decide-once typed scope ≠ SQL RLS and ≠ “NetArchTest proves isolation.”

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-identity-single-derivation-m-151) (GTM **M-151**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-150** / **M-151**).  
**Layer B deep dive:** [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md).  
**Invariant:** [`ARCHITECTURE_INVARIANTS.md`](ARCHITECTURE_INVARIANTS.md)#inv-001-tenant-identity-boundary · ADR 0037 / 0041.

---

## Decision in one line

Tenant / workspace / project identity is **decided once** at the host into typed `ScopeContext`. Production-like hosts do **not** treat client `x-tenant-id` (or peer headers) as authority. Deeper layers **consume** the resolved scope; they do **not** re-parse `HttpContext` / JWT / headers for tenant.

---

## Decided once (host)

| Component | Role |
|-----------|------|
| `HttpScopeContextProvider` / `IScopeContextProvider` | Resolves current `ScopeContext` for the request |
| Resolution order (conceptual) | Ambient job override → identity claims → headers → defaults |
| `ScopeResolutionGuardMiddleware` | Production-like: header-only / `ScopeIds.Default*` → **403** (unless allow-listed) |
| `ScopeIdentityBindingMiddleware` | Claim vs header mismatch → **403** |
| `AmbientScopeContext` | Background jobs — explicit scope from enqueue; never `Default*` as prod authority |

---

## Trusted vs untrusted sources (production-like)

| Source | Trusted? | Notes |
|--------|----------|-------|
| JWT / API-key scope claims | **Yes** | Primary production binding |
| `AmbientScopeContext` override | **Yes** | Jobs / workers |
| `x-tenant-id` / workspace / project headers | **No** | Fail closed; cannot establish or expand scope (**TB-925**) |
| `ScopeIds.Default*` | **No** | Dev/CI only |
| Route `{tenantId}` | **Not a second identity source** | `RouteTenantScopeBindingFilter` checks against already-resolved scope |

---

## Forbidden re-derive (ARCH001)

| Layer / assembly class | Must not | Must |
|------------------------|----------|------|
| Application, Persistence, AgentRuntime, Retrieval, Decisioning, … | Read `HttpContext` / `ClaimsPrincipal` / raw `x-tenant-id` for tenant | Take `ScopeContext` or explicit `tenantId` parameters |
| Repositories | Infer tenant from ambient HTTP | Accept scoped parameters; Layer A catalog routing remains primary |

Enforcement sketch: `TenantIdentityBoundaryAnalyzer` (**ARCH001**); scope-isolation / forged-header integration tests.

---

## Exceptions (allow-list)

| Exception | Rationale |
|-----------|-----------|
| `[AllowUnscopedRoute]` | Marketing, registration, webhooks, version probe, other scope-free endpoints |
| `/internal/*` path skip | Operator diagnostics (still auth-gated) |
| Health / OpenAPI minimal routes | Middleware path-prefix skips |

Startup guards reject `DevelopmentBypass` / `AllowTestActorHeaders` on production-like hosts.

---

## Primary isolation reminder

| Layer | Role |
|-------|------|
| **A — Catalogs** | Database-per-tenant routing (ADR 0037) — **primary** paying-client boundary |
| **B — Decide-once scope** | This contract — defense in depth |
| **Not** | SQL RLS (non-control); within-tenant workspace/project as a paying-client security boundary |

---

## Explicit non-claims

- Do **not** say `x-tenant-id` selects the tenant in production.
- Do **not** say Application/Persistence re-parse JWT/headers for tenant.
- Do **not** claim SQL RLS isolates tenants.
- Do **not** claim NetArchTest alone proves multi-tenant isolation.
- Do **not** close DiD erosion (**TB-1232**) or empty-scope catalog (**TB-1018**) by publishing this matrix.

---

## Follow-on / CI anchors (**TB-1000** / **M-150**)

| Anchor | Purpose |
|--------|---------|
| **TB-1000** | Honesty CI / doc guard against header-as-tenant and deep-layer HttpContext re-derive overclaims (**M-150**) |
| This contract + INV-001 / Layer B | Required cite near isolation / header language |
| ARCH001 still enabled | Analyzer on product assemblies |
| `ScopeIdentityBindingIntegrationTests` / **TB-925** | Forged-header probe evidence |
| Fail buyer stubs | Header-as-tenant / deep-layer-HttpContext overclaims |

---

## Related

- GTM **M-114** / **M-150** / **M-151** / **M-169** / **M-194** / **M-213**/**M-214**
- Done **TB-010** / **TB-071** / **TB-072** / **TB-276** / **TB-304** / **TB-925**
- Open **TB-1000** (honesty CI) · **TB-1232** (erosion) · **TB-1018** (empty scope)
