> **Scope:** Contributor-reference — layer residual-boundary and irreversible-leak matrix (TB-1005); not a buyer-facing trust claim.

# Layer residual-boundary + irreversible-leak matrix (**TB-1005**)

> **Audience:** Contributors, principal architects, and GTM claim reviewers.  
> **Not** a buyer assurance claim — NetArchTest / layer DAG guards ≠ multi-tenant isolation and ≠ “cross-tenant leaks are impossible.”

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#layer-boundary-irreversible-leak-m-157) (GTM **M-157**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-156**).  
**NetArchTest tiers:** [`ARCHITECTURE_CONSTRAINTS.md`](ARCHITECTURE_CONSTRAINTS.md) · `DependencyConstraintTests`.  
**Isolation DiD:** [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md).

---

## Decision in one line

Compile-time layering (`DependencyConstraintTests` / NetArchTest) **reduces accidental coupling**. Isolation is **Layer A catalogs + INV-001 decide-once + retrieval filters + runtime discipline**. Name allowlisted exceptions and rank residual irreversible classes — do **not** sell a green architecture-test suite as isolation proof.

---

## Compile-time held

| Held edge | Mechanism |
|-----------|-----------|
| Core / Contracts must not pull hosts or SQL facades | Tier 1 NetArchTest |
| Persistence submodule sibling references | Tier 2 assembly metadata |
| Domain modules vs `ArchLucid.Persistence` facade | Tier 3 NetArchTest |
| Operator CLI vs API host / persistence | Tier 4 rules |
| Api / Application / Persistence / AgentRuntime / UI-relevant DAG | `DependencyConstraintTests` + related Architecture.Tests |

Do **not** reopen Done dependency-graph work **TB-027**–**TB-032**.

---

## Documented exceptions (not silent)

| Exception | Why disclosed |
|-----------|---------------|
| Decisioning compatibility stubs | Allowlisted in `ArchitectureConstraintCompatibilityStubCatalog` |
| `AgentRuntime.Explanation` → Application | Documented seam |
| Api Decisioning controller allowlist | Explicit host exception |
| `Backfill.Cli` → Persistence | One-time migration / maintenance host |
| Core `ArchLucid.Persistence.*` port shims | NetArchTest quirk / intentional ports |
| Composition-root hosts | Documented exclusion lists |

Silent new allowlist entries without ADR / this matrix row are a review finding (**TB-1006**).

---

## Ranked runtime residuals (irreversible class)

| Rank | Residual | Blast | Owner / SoT |
|------|----------|-------|-------------|
| **1** | Wrong SQL catalog / unscoped product Persistence path | Cross-tenant **data** exposure | Layer A / **TB-1018** / **TB-999** · DiD |
| **2** | Retrieval `$filter` / upsert / Graph-RAG expand miss | Cross-tenant **chunk** hit | **TB-1001** Done · retrieval contract |
| **3** | Empty / unrestricted `AllowedTools` hole | Model-influenced **side effects** | **TB-950** Done · LLM trust boundary |
| **4** | INV-001 re-derive from headers / ambient HTTP | Wrong tenant identity at depth | **TB-999** Done · tenant identity contract |
| **5** | Substitute for committed golden manifest | Claim / **integrity** theater | **TB-1003** Done · unit-of-truth contract |
| **6** | Fat persistence shapes on buyer routes | DTO-boundary regression (leak + coupling) | Done DTO boundary — do not reopen lightly |

Related (erosion, not a substitute for #1): predicate-only DiD / “WHERE TenantId=” as sole story — **TB-1232**.

---

## Explicit non-claims

- Do **not** say NetArchTest alone proves multi-tenant isolation or makes cross-tenant leaks impossible.
- Do **not** treat green Architecture.Tests as closing residuals **#1–#6**.
- Do **not** claim SQL RLS is the missing beyond-predicate control (ADR 0037 non-control).
- Do **not** rewrite the NetArchTest suite, reopen **TB-027**–**TB-032**, or change ADR 0037 catalog model via this matrix.
- Do **not** close honesty CI (**TB-1006**) by publishing this matrix.

---

## Follow-on / CI anchors (**TB-1006**)

| Anchor | Purpose |
|--------|---------|
| This matrix + Layer A / INV-001 / retrieval caveats | Required cite near isolation claims that mention assembly/layer tests |
| Fail buyer stubs | “NetArchTest proves isolation” / “layer tests make leaks impossible” |
| Optional contributor guard | New `ArchitectureConstraintCompatibilityStubCatalog` entries without ADR / exception row |
| Verification | `DependencyConstraintTests`; existing isolation / retrieval / tool tests — do not invent a second NetArchTest framework |

---

## Related

- GTM **M-114** / **M-150** / **M-152** / **M-156** / **M-157** / **M-194** / **M-213**
- Done **TB-010** / **TB-027**–**TB-032** / **TB-071** / **TB-604** / **TB-950** / **TB-999** / **TB-1001** / **TB-1003**
- Open **TB-1006** (honesty CI) · **TB-1018** (empty scope) · **TB-1232** (DiD erosion)
