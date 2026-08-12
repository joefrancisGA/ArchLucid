> **Scope:** Contributor-reference — classic tenant DiD erosion modes and beyond-predicate enforcement list (TB-1232); not a buyer assurance claim.

# Tenant DiD erosion and enforcement beyond predicates (TB-1232)

> **Audience:** Contributors, principal architects, and GTM claim reviewers stress-testing tenancy after a scope provider exists.  
> **Not** a buyer assurance claim — Layer A catalog routing is the paying-client boundary; predicates and analyzers are defense-in-depth that **erodes**.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-did-erosion-beyond-predicates-m-214) (GTM **M-213** / **M-214**).  
**Path-stable alias:** [`TENANT_DID_EROSION_BEYOND_PREDICATES_PA_ONE_PAGER.md`](../go-to-market/TENANT_DID_EROSION_BEYOND_PREDICATES_PA_ONE_PAGER.md).  
**DiD spine:** [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) (ADR 0037).  
**Scope decide-once:** [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) (**TB-999**).  
**Retrieval filter:** [`RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md`](RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md) (**TB-1001**).  
**Honesty CI:** **TB-1233** (**Done** — `check_tenant_did_erosion_beyond_predicates_honesty.py`; wired in `run_buyer_surface_strict_guards.py`). **RLS purge / overclaim:** **TB-1122** (Done) / GTM **M-194**.

---

## Decision in one line

Production paying-client isolation is **database-per-tenant catalog routing (Layer A)** plus **INV-001 decide-once scope at the host**. Repository `WHERE TenantId = @scope` and `IScopeContextProvider` threading are **necessary DiD (Layer D)** that **erodes** as the codebase grows — they are **not** the primary boundary and **not** proof alone. SQL RLS is **not** the missing beyond-predicate control (ADR 0037).

---

## Primary vs DiD (do not conflate)

| Class | Layer / mechanism | Role | Buyer-safe pin |
|-------|-------------------|------|----------------|
| **Primary** | Layer A — `SystemWithPerTenantCatalogs` + `ScopedRoutingSqlConnectionFactory` | Paying-client SQL catalog boundary | "Dedicated tenant catalog in production" |
| **Enforced DiD** | Layer B — INV-001 / `ScopeResolutionGuardMiddleware`; Layer C — route-tenant binding; Layer E — mandatory Search `$filter` | Depth when catalog routing is correct | "Defense in depth — not a substitute for Layer A" |
| **Erodible DiD** | Layer D — Dapper `WHERE TenantId`; ambient `IScopeContextProvider`; optional workspace/project predicates | Can fail open via unscoped paths | "Predicates erode — name the erosion mode" |
| **Non-control** | SQL RLS / `SESSION_CONTEXT` | Removed (migration 148) | **Forbid** as deployed control |

**Within-tenant workspace/project predicates** are organizational/product scope — **not** paying-client isolation (ADR 0037 decision summary).

---

## Classic erosion modes

| Mode | How it shows up | Why it matters | Residual owners |
|------|-----------------|----------------|-----------------|
| **Unscoped product SQL** | New Dapper/repo path omits tenant predicate on scoped table | IDOR / wrong rows **within** a catalog; in SingleCatalog dev, looks like cross-tenant bleed | **ARCH006**, scoped-table inventory, integration smoke |
| **GUID-only lookup IDOR** | `GetByIdAsync(id)` without scope/catalog check on hot routes | Cross-workspace or cross-tenant row fetch when catalog is shared | Route-tenant tests, IDOR integration batches |
| **Ambient vs explicit scope drift** | Handler uses `IScopeContextProvider` while sibling uses explicit `ScopeContext` param; paths diverge | One path forgets scope on refactor | **TB-999**, code review, ARCH001 |
| **Empty → system catalog** | Empty/default `TenantId` resolves to **system** catalog connection | Worse than "no rows" — wrong database | [M-169 empty-scope routing](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#empty-scope-catalog-routing-m-169), `ProductionSafetyRules` |
| **Job / outbox ambient loss** | Worker handler runs product SQL without `AmbientScopeContext.Push` or explicit scope | Background cross-tenant reads/writes | Job entrypoint discipline tests (**TB-1232** follow-on) |
| **Search filter optional** | Product path calls Azure Search without `BuildRequiredScopeFilter` | Shared-index retrieval leak class | **TB-1001**, **TB-1002** |
| **Exemption creep** | `[AllowUnscopedRoute]` / ARCH006 allowlist grows without inventory | Unscoped surface area expands silently | Exemption budget CI (**TB-1232** follow-on), route guard scripts |
| **Tests mock scope away** | Unit tests use `EmptyPersistenceScopeContextProvider` or never assert catalog+filter | Green tests, production leak | DI smoke, architecture tests |
| **Stale RLS-as-control docs** | Buyer/engineering copy cites SQL RLS or `SESSION_CONTEXT` | Wrong fix direction | **TB-1122**, **M-194** |
| **Analyzer green ≠ isolation** | ARCH001/ARCH006 / NetArchTest pass without catalog-routing proof | Overclaim in assessments | **TB-1122**, this contract |

---

## Beyond per-query predicates (compile / test / CI)

| Mechanism | What it enforces | Status (V1 baseline) | Not enough alone |
|-----------|------------------|----------------------|------------------|
| **ARCH001** `TenantIdentityBoundaryAnalyzer` | Ban HttpContext/claims re-derive in lower layers | Shipped | Catalog-per-tenant proof |
| **ARCH006** `TenantScopedQueryScopeBindingAnalyzer` | Scoped tables need scope binding at Dapper sites | Shipped | Unscoped tables / wrong catalog |
| **ARCH006 exemption budget CI** | New allowlist rows need justification + owner ack | **Follow-on** (**TB-1232**) | Runtime routing |
| **Sealed `ScopeContext` on base repo APIs** | No optional scope overload defaulting empty | **Follow-on** | Layer A config |
| **Ambient Push discipline tests** | Worker/outbox handlers must set ambient or explicit scope | **Follow-on** | Catalog binding |
| **`BuildRequiredScopeFilter` mandatory** | Product Search paths cannot omit OData scope filter | Shipped (**TB-071**) | Upstream wrong `RetrievalQuery` |
| **Ban `EmptyPersistenceScopeContextProvider` in product DI** | Api/Worker graphs fail closed on empty scope provider | **Follow-on** | Production topology |
| **IDOR integration smoke** | Wrong-tenant GUID → 404/empty on hot routes | Partly shipped | Full route coverage |
| **Honesty CI** | Fail "WHERE TenantId = isolation" / "RLS fixes tenancy" stubs | **TB-1233** (**Done**) | Runtime seal |
| **NetArch isolation proof** | Layer-boundary tests vs convention | **TB-1005** / **TB-1122** | Catalog routing |

This contract **names** follow-on enforcement; implementing exemption budget / ambient discipline / DI bans is separate engineering.

---

## Code anchors (verification)

| Area | Anchor |
|------|--------|
| Scope decide-once | `IScopeContextProvider`, `ScopeResolutionGuardMiddleware`, `AmbientScopeContext` |
| Catalog routing | `ScopedRoutingSqlConnectionFactory`, `ITenantDatabaseResolver`, `ProductionSafetyRules` |
| Persistence DiD | `TenantScopedQueryScopeBindingAnalyzer`, `tenant_scoped_tables.v1.json` |
| HTTP ingress | `RouteTenantScopeBindingFilter`, `assert_route_tenant_scope_guard.py` |
| Retrieval | `AzureSearchTenantScopeFilterBuilder`, `RetrievalIndexingScopeValidator` |
| DiD spine tests | `TenantIsolationDefenseInDepthArchitectureTests` |

---

## Allow / forbid (GTM-safe)

| Claim / pattern | Status |
|-----------------|--------|
| Layer A + INV-001 as primary; predicates as erodible DiD | **Allow** |
| Name erosion modes and residual owners | **Allow** |
| Disclose predicate/analyzer residuals until follow-on CI ships | **Allow** |
| `WHERE TenantId` / scope threading alone = paying-client isolation | **Forbid** |
| ARCH001/ARCH006 / NetArchTest green alone proves isolation | **Forbid** |
| SQL RLS as the beyond-predicate fix | **Forbid** |
| Workspace/project SQL predicate = security boundary between paying clients | **Forbid** |

---

## TB-1233 CI anchors (implemented)

| Anchor | Purpose |
|--------|---------|
| Buyer/proof stub guards | Fail "WHERE TenantId proves isolation" / "RLS is the missing control" without this contract |
| `TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md` | Drift guard (this file) |
| `TENANT_ISOLATION_DEFENSE_IN_DEPTH.md` cross-link | Spine doc stays aligned with ADR 0037 |
| Optional presence guards | `BuildRequiredScopeFilter` still called from product Search client paths |

---

## Explicit non-claims

- SQL RLS reinstatement or `SESSION_CONTEXT` as production control.
- NetArchTest / analyzer green = paying-client isolation proof.
- This contract alone implements exemption budget or ambient job guards.
- Reopens Done Wave A isolation IDs (**TB-010** / **TB-071** / **TB-925**).
- Within-tenant workspace/project bleed is a paying-client security defect (it is not per ADR 0037).

---

## Related

- [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) · ADR 0037
- [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) · **TB-999**
- [`RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md`](RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md) · **TB-1001**
- [`LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md`](LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md) · **TB-1005**
- [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-did-erosion-beyond-predicates-m-214`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-did-erosion-beyond-predicates-m-214) · GTM **M-213**/**M-214**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-1232**–**TB-1233** · **TB-1122**
