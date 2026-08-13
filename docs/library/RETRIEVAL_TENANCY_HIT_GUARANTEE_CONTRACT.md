> **Scope:** Contributor-reference — retrieval tenancy hit guarantee for Ask/Search/Graph-RAG (TB-1001); not a buyer-facing trust claim.

# Retrieval tenancy hit guarantee (Ask / Azure AI Search / Graph-RAG / TB-1001)

> **Audience:** Contributors, principal architects, and GTM claim reviewers.  
> **Not** a buyer assurance claim — mandatory OData scope `$filter` ≠ per-tenant Search service and ≠ cryptographic isolation.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#retrieval-tenancy-hit-guarantee-m-153) (GTM **M-153**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-152**).  
**Threat model:** [`ASK_RAG_THREAT_MODEL.md`](../security/ASK_RAG_THREAT_MODEL.md).  
**DiD Layer E:** [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md).  
**Index fields:** [`AZURE_AI_SEARCH_INDEX_CONTRACT.md`](AZURE_AI_SEARCH_INDEX_CONTRACT.md).  
**Scope source:** [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) (**TB-999** / INV-001).

---

## Decision in one line

A Search / Ask / Graph-RAG **hit cannot be another paying tenant’s chunk** when the host builds `RetrievalQuery` from typed scope, Azure AI Search applies **required** tenant/workspace/project OData `$filter`, upserts fail closed on scope mismatch, and Graph-RAG neighbors load only via scoped `GetByIdAsync` — not via an unscoped second Search. Shared index + app filter; platform sentinel is intentional shared content, not a cross-tenant leak.

---

## Query (required filter)

| Component | Guarantee |
|-----------|-----------|
| `AzureSearchSdkClient.SearchAsync` / delete paths | Call `AzureSearchTenantScopeFilterBuilder.BuildRequiredScopeFilter` |
| Filter fields | `tenantId` / `workspaceId` / `projectId` (and platform branch when opted in) |
| Empty / invalid scope | **Throws** — no broad retrieval |
| `RetrievalQuery` construction | From typed `ScopeContext` / explicit scope params (**INV-001** / **TB-999**) — not client-supplied tenant alone |
| Tests | `AzureSearchTenantScopeFilterBuilderTests`; retrieval isolation matrix |

Done **TB-071**.

---

## Upsert (fail-closed write)

| Component | Guarantee |
|-----------|-----------|
| `RetrievalIndexingScopeValidator` | Rejects chunk/document upsert when chunk scope ≠ ambient/indexing scope |
| Call sites | `AzureAiSearchVectorIndex`, `InMemoryVectorIndex`, `RetrievalIndexingService` |
| Effect | Wrong-tenant content cannot be written into another tenant’s filter slice |

Done **TB-604**.

---

## Graph-RAG expand (scoped snapshot only)

| Component | Guarantee |
|-----------|-----------|
| Seed hits | Already subject to Search scope filter |
| `GraphRagNeighborExpander` | Loads snapshot via `IGraphSnapshotRepository.GetByIdAsync(scope, graphSnapshotId)` |
| Neighbor hops | Bounded collect from that snapshot — **no** unscoped second Azure AI Search query for expand |
| Missing / wrong-scope snapshot | No neighbor expansion for that seed |

---

## Platform corpus (shared sentinel, not leak)

| Signal | Meaning |
|--------|---------|
| `tenantId` = `Guid.Empty` | Intentional **platform** corpus (shared docs / policy packs) |
| `IncludePlatformCorpora` | Opt-in to include platform branch in the OData filter |
| Policy-pack allowlist | When platform included, policy-pack hits limited by `AllowedPolicyPackRulePackIds` |
| Buyer language | Label as shared platform content — **not** “Tenant B’s private chunk” |

---

## Explicit non-claims

- Do **not** say each tenant has a dedicated Azure AI Search **service** or **index**.
- Do **not** say a Search hit is cryptographic tenancy proof.
- Do **not** say `$filter` is optional / best-effort on production Ask/Search paths.
- Do **not** say Graph-RAG can fetch arbitrary index documents by id without scope.
- Do **not** claim SQL RLS protects retrieval (non-control; ADR 0037).
- Do **not** close honesty CI (**TB-1002**) or DiD erosion (**TB-1232**) by publishing this matrix.

---

## Residuals / failure modes (honest)

| Residual | Why it still matters | Owner |
|----------|----------------------|-------|
| Shared index + app `$filter` | Removing or bypassing filter is a regression class | **TB-1002** honesty CI; filter builder tests |
| Wrong `RetrievalQuery` scope | Upstream scope drift before filter build | **TB-999** / **TB-1232** |
| Platform corpus mislabel | Treating `Guid.Empty` hits as tenant private data | Buyer/PA copy discipline |
| In-memory vs Azure backends | Both must keep validator + scope filter parity | Existing retrieval tests |

---

## CI anchors for **TB-1002**

| Anchor | Purpose |
|--------|---------|
| This contract + Ask threat model + **TB-071**/**TB-604** | Required cite near G3 retrieval / Ask isolation language |
| `scripts/ci/check_retrieval_tenancy_hit_guarantee_honesty.py` | Fail buyer stubs: per-tenant Search index / crypto-proof hit / optional `$filter` overclaims |
| Optional smoke | `AzureSearchSdkClient` still calls `BuildRequiredScopeFilter` (presence guard) |
| Verification | `AzureSearchTenantScopeFilterBuilderTests`; indexing scope validator tests |

---

## Related

- GTM **M-114** / **M-152** / **M-153** / **M-194** / **M-213**/**M-214**
- Done **TB-048** / **TB-071** / **TB-604** / **TB-999** / **TB-1001** / **TB-1002**
- Open **TB-1232** (erosion)
