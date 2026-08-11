> **Scope:** Contributor-reference — fused PA challenge matrix for INV-001 tenant decide-once, decisioning decide, INV-012 quality-gate decide-once, and committed golden manifest unit-of-truth (**TB-1416**); not a buyer assurance attestation.

# INV-001 / decide-once / committed-manifest PA triad challenge matrix (TB-1416)

> **Audience:** Contributors, principal architects, and GTM claim reviewers.  
> **Not** a buyer assurance claim — three separate “decide” vocabularies must stay bounded; committed manifest ≠ content purity.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#inv001-decide-once-committed-manifest-triad-m-254) (GTM **M-254**).  
**Claim honesty index:** [`PA_CLAIM_HONESTY_INDEX.md`](../go-to-market/PA_CLAIM_HONESTY_INDEX.md) (GTM **M-253**).  
**Invariants:** [`ARCHITECTURE_INVARIANTS.md`](ARCHITECTURE_INVARIANTS.md) — INV-001 tenant identity boundary · INV-012 quality-gate decide-once.  
**Isolation layers:** [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) — Layer A (catalogs) · Layer B (decide-once scope).  
**ADRs:** [0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) (database-per-tenant, not SQL RLS) · [0040](../architecture/adrs/0040-tamper-evident-lineage-without-worm-storage.md) (hash lineage, not WORM/PKI).

**Slice contracts (do not re-author here):**

| Slice | Engineering contract |
| --- | --- |
| Tenant decide-once | [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) (**TB-999** / GTM **M-151**) |
| Committed manifest unit-of-truth | [`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md`](COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003** / GTM **M-155**) |
| DiD erosion beyond predicates | [`TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md`](TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md) (**TB-1232** / GTM **M-214**) |
| Demo/anonymous read plane | [`DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md`](DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md) (**TB-1251** / GTM **M-218**) |

---

## Decision in one line

Principal architects fuse three engineering stories into one “decide-once” narrative. Keep **tenant identity decide-once (INV-001)**, **decisioning / quality-gate decide**, and **committed golden manifest finalization** as **separately bounded invariants** with named owner clusters. **Committed ≠ content purity.**

---

## Vocabulary (do not fuse)

| Term | Means | Does not mean |
| --- | --- | --- |
| **INV-001 decide-once** | Tenant / scope resolved **once** at the host into typed `ScopeContext`; deeper layers consume scope — they do not re-parse `HttpContext` / JWT / headers for tenant | Architecture “decided once” into a package; SQL RLS; NetArchTest-alone isolation |
| **Authority / AgentTask decide** | Decisioning over findings, proposals, and agent outputs in the decisioning plane | Tenant identity establishment; commit seal; INV-012 binding |
| **INV-012 quality-gate decide-once** | Quality-gate definition binding for a run (decide-once at gate boundary) | Commit seal; tenant isolation; “the package was decided once” |
| **Committed golden manifest** (**TB-1003**) | **Finalization identity + hash lineage** for review-backed / signed-package claims | Semantic faithfulness; zero AgentTask overlay; crypto tenant isolation; evidence-grounded by commit alone |

When a reviewer says “decide-once,” ask **which row** they mean before answering.

---

## PA challenge → owner cluster

Do **not** re-author the slice contracts below — cite them and the listed backlog / GTM owners.

| PA challenge | Owner cluster | Primary contract / GTM |
| --- | --- | --- |
| Headers / deep-layer `HttpContext` re-derive tenant | **TB-999** · **TB-1000** | [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) · GTM **M-150** / **M-151** |
| RLS / NetArchTest / `WHERE TenantId` = isolation | **TB-1122** · **TB-1232** | [`TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md`](TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md) · GTM **M-194** / **M-213** |
| Empty → system catalog / ambient job drift | **TB-1232** · **TB-1018** | GTM **M-168** / **M-214** |
| Findings / Ask / draft / Simulator = signed package | **TB-1003** · **TB-1004** | [`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md`](COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) · GTM **M-154** / **M-155** |
| Committed package still has ungated AgentTask overlay | **TB-1196** · **TB-1369** | GTM **M-203** / **M-247** / **M-248** |
| Empty `EvidenceRefs` / uncited decision-grade findings | **TB-1221** | GTM **M-207** / **M-208** |
| Dual hasher / which `ManifestHash` | **TB-1156** | GTM **M-198** / **M-199** |
| `SchemaVersion` rewrites sealed content | **TB-1277** | GTM **M-223** / **M-224** |
| Demo / anonymous reads tenant data | **TB-1251** | [`DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md`](DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md) · GTM **M-217** / **M-218** |
| Fused “decide-once = package truth” / triad-closed copy | **TB-1417** | GTM **M-253** (honesty CI; after this matrix) |

---

## Explicit non-claims

- Do **not** equate INV-001 tenant decide-once with architecture decided once, quality-gate decide-once (INV-012), or “the committed package decided the architecture.”
- Do **not** claim the committed golden manifest proves semantic faithfulness, zero AgentTask overlay, full evidence grounding, or crypto tenant isolation.
- Do **not** sell the triad as **closed** while residual owner contracts in the table above remain **Not started** (or honesty CI **TB-1000** / **TB-1004** / **TB-1417** remain open).
- **Committed = finalization identity + hash lineage** — not content purity. Overlay, provenance, dual-hasher, schema-evolution, and isolation seams have **named owners** above.

---

## Delivery status (owner contracts)

| ID | Title (short) | Status | Ship-order hint |
| --- | --- | --- | --- |
| **TB-999** | INV-001 tenant single-derivation contract | **Done** | Foundation — shipped first |
| **TB-1003** | Committed golden manifest unit-of-truth | **Done** | Foundation — shipped first |
| **TB-1156** | Dual `ManifestHash` / fingerprint contract | **Done** | Hasher honesty |
| **TB-1221** | Decision-grade finding provenance | **Done** | Evidence path honesty |
| **TB-1232** | DiD erosion + beyond-predicates | **Done** | Isolation erosion map |
| **TB-1251** | Demo/anonymous read plane | **Done** | Demo vs paying boundary |
| **TB-1416** | This fused triad matrix | **Done** | Orchestration — you are here |
| **TB-1000** | Anti-header / deep-layer re-derive honesty CI | **Open** | After **TB-999** |
| **TB-1004** | Anti-substitute-for-committed-manifest honesty CI | **Open** | After **TB-1003** |
| **TB-1018** | Empty-scope / system-catalog honesty | **Open** | Pairs **TB-1232** / **M-168** |
| **TB-1122** | Isolation claims too strong + RLS purge | **Open** | GTM **M-194** |
| **TB-1196** | Agent→decisioning Real-variance isolation | **Open** | GTM **M-203** |
| **TB-1277** | GoldenManifest schema evolution | **Done** (2026-08-11) | GTM **M-223** — [`MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md`](./MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md) |
| **TB-1369** | AgentTask→decisioning ungated leak seams | **Open** | GTM **M-247** |
| **TB-1417** | Anti triad-conflation / triad-closed honesty CI | **Open** | After **TB-1416**; GTM **M-253** |

**Recommended next engineering honesty passes among open rows:** **TB-1000** + **TB-1004** (tenant + manifest CI), then **TB-1417** (fused language guard).

---

## PA review script

1. Ask which “decide-once” the buyer means — **tenant (INV-001)**, **quality gate (INV-012)**, **decisioning decide**, or **commit finalization**.
2. Confirm **committed ≠ evidence-grounded / no-overlay / crypto-isolated** — point to the owner row.
3. Confirm the triad is **not** sold as closed while **TB-1000** / **TB-1004** / **TB-1417** / residual slice contracts remain open (tenant **TB-999** and committed-manifest **TB-1003** matrices are Done).
4. Treat a **fourth fused “decide” story** (e.g. “INV-001 means the architecture package is decided and isolated”) as a **review finding**.

---

## Related

- GTM **M-253** / **M-254** · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md)
- Open honesty CI follow-on: **TB-1417**
- Does **not** implement middleware, commit seals, overlay gates, or hasher re-lock — those remain in their owner IDs
