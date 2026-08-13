> **Scope:** Contributor-reference — demo/anonymous read plane vs paying-tenant structural isolation (TB-1251); not a buyer assurance claim.

# Demo / anonymous read plane contract (TB-1251)

> **Audience:** Contributors, principal architects, and GTM claim reviewers evaluating anonymous demo vs paying-tenant isolation.  
> **Not** a buyer assurance claim — demo is a **named exception plane**; filter discipline and `DemoScopes` hard-pin are **not** structural proof that demo cannot open paying-tenant catalogs.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#demo-anonymous-read-plane-m-218) (GTM **M-217** / **M-218**).  
**Path-stable alias:** [`DEMO_ANONYMOUS_READ_PLANE_PA_ONE_PAGER.md`](../go-to-market/DEMO_ANONYMOUS_READ_PLANE_PA_ONE_PAGER.md).  
**Empty-scope routing:** [M-169 empty-scope catalog routing](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#empty-scope-catalog-routing-m-169).  
**DiD erosion (product):** [`TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md`](TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md) (**TB-1232**).  
**Contoso vs Claims content:** **TB-1028** (open). **Honesty CI:** **TB-1252** (**Done**).

---

## Decision in one line

Anonymous and demo reads use a **third read plane** distinct from paying-tenant catalogs (Layer A) and the **system catalog** (`Guid.Empty`). Today demo hard-pins `DemoScopes` → `ScopeIds.DefaultTenant` and reuses product repositories — **convention + Layer D predicates**, not a structural guarantee that demo cannot open a paying-tenant catalog. **Structural target:** dedicated demo SQL factory/catalog **or** static-only surfaces; production live demo SQL off.

---

## Read planes (do not conflate)

| Plane | Who reads | Data boundary class | V1 baseline |
|-------|-----------|---------------------|-------------|
| **(A) Paying tenant** | Authenticated customer workspace | Layer A per-tenant catalogs + INV-001 decide-once | Structural / enforced DiD |
| **(B) System catalog** | Platform / empty-scope risk path | Explicit exception — **not** “no data” | [M-169](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#empty-scope-catalog-routing-m-169) |
| **(C) Demo / anonymous** | Public or unauthenticated sample paths | Exception / residual until structural pin | `DemoScopes` pin + product repos; prod live demo SQL off |

**SingleCatalog / dev:** demo and other tenants can share one database — filter-only discipline **collapses** planes; do not extrapolate dev posture to production isolation.

---

## Surfaces × data plane

| Surface | Plane today | Role | Not structural proof of |
|---------|-------------|------|-------------------------|
| `GET /v1/demo/*` (`DemoExplainController`, seed) | (C) when `Demo:Enabled` | Live demo explain + seed under hard-pinned demo scope | Paying-tenant catalog deny |
| `DemoReadModelClient` | (C) | Composes explain/provenance services under `DemoScopes.BuildDemoScope()` | Cross-tenant SQL deny |
| `/showcase/{slug}` (`showcase-static-demo.ts`) | (C) static-only | Claims-static marketing proof — no live product SQL on anonymous path | Live tenant data |
| Contoso `/demo/preview` (secondary) | (C) sample / self-demo | Contoso-labeled live sample when demo enabled | Claims = Contoso (**TB-1028**) |
| `/see-it`, `/welcome`, `/why` marketing | (C) static + links | Orientation; may link to static showcase | Anonymous = tenant-safe |
| Quick Scan anonymous (prod) | (C) sample-only | **TB-892**–**TB-902** — sample payloads, rate limits, CAPTCHA | Full tenant read plane |
| Authenticated operator paths | (A) | Normal product SQL under INV-001 | Demo boundary |

**Prod pin:** `ProductionSafetyRules.CollectDemoDisallowedInProductionProfile` rejects `Demo:Enabled` and `Demo:AnonymousViewer:Enabled` on Production-profile hosts — live demo SQL off; public proof = static showcase / sample Quick Scan unless a hosted-demo SKU with its own catalog.

---

## Not enough (filter / attribute discipline)

| Pattern | Why it is not structural |
|---------|---------------------------|
| `WHERE TenantId = DefaultTenant` | Predicate inside a catalog — wrong catalog still wins |
| Remembering `DemoScopes` in new handlers | Convention erodes on refactor |
| `[FeatureGate(DemoEnabled)]` alone | Gates surface exposure, not catalog binding |
| `[AllowAnonymous]` / read-only HTTP | Attribute does not choose SQL catalog |
| `[AllowUnscopedRoute]` on demo controllers | Explicitly bypasses route-tenant binding — increases unscoped risk |
| Empty ambient demo scope | Can route to **system catalog** (worse than “no rows”) — **M-168** / **M-169** |

---

## Structural targets (engineering follow-on — not implemented by this contract)

| Target | Intent | Status (V1 baseline) |
|--------|--------|------------------------|
| **Dedicated demo SQL factory/catalog** | Demo controllers/repos use `IDemoSqlConnectionFactory` (or equivalent) that **cannot** open paying-tenant catalogs | **Follow-on** after contract |
| **Static-only public proof** | Marketing/showcase paths serve bundled JSON only — no product `ISqlConnectionFactory` | **Partial** — `showcase-static-demo.ts` |
| **Forbid ambient `IScopeContextProvider` on demo controllers** | Demo path always explicit scope or static — no empty ambient | **Follow-on** |
| **Analyzer / CI + integration test** | Demo API path vs customer-B catalog → zero paying-tenant rows | **TB-1252** honesty CI + future integration |
| **Prod live demo SQL off** | `Demo:Enabled=false` on Production profile | **Shipped** — `ProductionSafetyRules` |

This contract **names** structural targets; wiring dedicated demo factory/catalog is separate engineering.

---

## Code / doc anchors (verification)

| Anchor | Location |
|--------|----------|
| `DemoScopes.BuildDemoScope()` | `ArchLucid.Host.Core/Demo/DemoScopes.cs` |
| `DemoExplainController` | `ArchLucid.Api/Controllers/Demo/DemoExplainController.cs` |
| `DemoReadModelClient` | `ArchLucid.Host.Core/Demo/DemoReadModelClient.cs` |
| `ScopedRoutingSqlConnectionFactory` | `ArchLucid.Persistence` (catalog routing) |
| `CollectDemoDisallowedInProductionProfile` | `ArchLucid.Host.Core/Startup/Validation/Rules/ProductionSafetyRules.cs` |
| Static showcase payload | `archlucid-ui/src/lib/showcase-static-demo.ts` |
| ADR 0037 (no RLS) | `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md` |
| ADR 0027 (demo preview) | `docs/architecture/adrs/0027-demo-preview-route-contract.md` |
| Demo preview runbook | `docs/library/DEMO_PREVIEW.md`, `DEMO_QUICKSTART.md` |

---

## Allow / forbid (GTM-safe)

| Claim / pattern | Status |
|-----------------|--------|
| Three distinct planes: tenant / system / demo | **Allow** |
| Structural **target**: dedicated demo factory/catalog or static-only; prod live demo SQL off | **Allow** |
| Disclose convention + predicate posture until structural pin ships | **Allow** |
| `[AllowAnonymous]` / read-only demo ⇒ cannot read paying-tenant data | **Forbid** |
| `DemoScopes` hard-pin alone = catalog isolation | **Forbid** |
| Empty demo ambient scope ⇒ “no data” | **Forbid** |
| Query filters / `WHERE` as the demo boundary | **Forbid** |
| Demo pin is Layer A paying-client isolation | **Forbid** |

---

## CI anchors for **TB-1252**

| Anchor | Role |
| --- | --- |
| `scripts/ci/check_demo_anonymous_read_plane_honesty.py` | Fail AllowAnonymous=safe / pin=catalog / empty=no-data overclaims |
| `DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md` | Drift guard (this file) |
| `DemoScopes`, `DemoExplainController`, `DemoReadModelClient` | Verification cite list |
| `ScopedRoutingSqlConnectionFactory`, `ProductionSafetyRules` | Catalog routing + prod demo off |
| `showcase-static-demo.ts` | Static-only showcase anchor |
| Integration test (future) | Demo path vs customer-B catalog → zero paying-tenant rows |

Honesty CI shipped: **TB-1252**.

---

## Explicit non-claims

- `[AllowAnonymous]` or `DemoScopes` pin alone proves demo cannot touch paying-tenant data.
- Empty demo ambient scope returns no rows (system catalog risk).
- This contract implements dedicated demo factory/catalog wiring.
- Reopens Done showcase SSR / Quick Scan safety (**TB-887**–**TB-890**, **TB-892**–**TB-902**).
- Absorbs Contoso≠Claims content honesty (**TB-1028** / **TB-1029**).
- CPA SOC 2 or published third-party pen test.

---

## Related

- [`TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md`](TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md) · **TB-1232**
- [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) · **TB-999**
- [`BUYER_SECURITY_PROCUREMENT_PACKET.md#demo-anonymous-read-plane-m-218`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#demo-anonymous-read-plane-m-218) · GTM **M-217**/**M-218**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-1251**–**TB-1252** · **TB-1028**
