> **Scope:** Engineering contract for optional binding of an existing **`AzureInventorySnapshot`** to a customer **`Architecture`** identity on the review authority **decide** path (architecture-spine AS-046 / ADR 0084). **Contributor-reference** — internal only.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md) · **Kernel ADR:** [ADR 0084](../architecture/adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md) · **IE plane:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Architecture identity:** [ADR 0074](../architecture/adrs/0074-customer-visible-architecture-identity.md)

# Architecture inventory binding contract

## Purpose

Live estate is the other half of the livelihood ontology. The infrastructure-evidence (IE) plane **collects** Azure inventory once; wave 22 **consumes** those snapshot rows on the architecture decide path. This document is the reviewer-facing contract for “may this architecture bind an existing snapshot?” and “what must implementers **not** fork?”

**Do not implement IE-01–IE-08 in this wave.** If snapshots are not yet materialized in a tenant, the contract still stands and desk UI is **honesty-only** until bind/merge ships (AS-051).

---

## Binding model

| Concept | Owner | Meaning |
|---------|-------|---------|
| **`dbo.Architectures`** | ADR 0074 | Customer-visible durable architecture identity (named parent; not a sealed record) |
| **`ArchitectureInventoryBinding`** | AS-047+ | Optional FK from an architecture to exactly **one** active `AzureInventorySnapshot` at a time (attach/detach API in AS-048) |
| **`AzureInventorySnapshot`** | IE plane | Normalized, hashed, append-only projection of one extractor package — see [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) §1 |
| **Decide-path merge** | AS-050 | On review **execute**, bound snapshot resources merge into the derived graph as **`ObservedFact`** overlay (provenance kind), not as asserted prose |

Binding is **optional**. Unbound architectures show a labeled **estate gap** — not an empty-cloud fiction (AS-051).

---

## Bind / unbind rules

| Operation | Who | Rules |
|-----------|-----|-------|
| **Attach** | Workspace member with architecture **Decide** (or Admin when shares land) | Snapshot must exist in the **same tenant**; workspace/project scope must match binding policy (AS-055 IDOR tests) |
| **Detach** | Same authz as attach | Clears active binding; does **not** delete the snapshot row or extractor ZIP |
| **Re-attach** | Same as attach | May point at a newer snapshot id; prior seals are unchanged (ADR 0039) |

**Freshness (AS-052):** desk and career export must show `CapturedUtc`, `CaptureStatus`, and collector version when bound. Stale snapshots are labeled — never silently treated as current estate.

**Audit (AS-055):** attach/detach are **Required** durable audit events co-committed with the binding row mutation.

---

## One collector family (merge-blocking)

Wave 22 **consumes** IE types. It does **not** add a parallel ARM harvest.

| Allowed | Forbidden |
|---------|-----------|
| `Get-ArchLucidAzurePackage.ps1` + `HostedAzureExtractorClient` + `AzureInventorySnapshotMaterializer` | A second ARM ZIP client, duplicate `Get-ArchLucidAzurePackage` fork, or review-API inline Azure Resource Graph harvest |
| Read snapshot rows via `IAzureInventorySnapshotRepository` | New `IFindingEngine` that only nags “bind inventory” as coverage |
| ObservedFact merge on execute (AS-050) | Minting ARM facts from LLM prose without snapshot provenance |

**Reviewers:** refuse PRs that add a second Azure collector to satisfy architecture bind. Bind **references** existing snapshot ids; collection stays in the IE plane.

Canonical collector entry points:

- **Script:** `scripts/azure/Get-ArchLucidAzurePackage.ps1`
- **Hosted client:** `ArchLucid.Integrations.AzureExtractor.HostedAzureExtractorClient` (`IHostedAzureExtractorClient`)
- **Materializer:** `ArchLucid.Application.InfraEvidence.AzureInventorySnapshotMaterializer`

AS-054 ratchet expands forbidden type names; this contract is the human-readable source of truth.

---

## Three finding streams stay distinct

Per [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) §2:

| Stream | Examples | Binding interaction |
|--------|----------|---------------------|
| **Sealed review findings** | `FindingsSnapshot` / `IFindingEngine` outputs on the decide path | May **cite** ObservedFact nodes merged from a bound snapshot; does not replace operational findings |
| **Agent findings** | Agent/runtime outputs during execute | Same — consume merged graph; do not fork collector |
| **Operational security findings** | `OperationalSecurityFinding` | Separate stream; matcher/audit evaluators are **not** coverage engines |

Inventory bind must not collapse operational security findings into review-graph coverage engines or pretend audit evaluation is a sealed `Finding`.

---

## Unbound honesty (AS-051)

When no snapshot is bound, Working desk and career export must **not** imply zero Azure resources.

| State | Honest copy (TB-645) |
|-------|----------------------|
| Unbound | “No inventory snapshot bound — estate not in this review.” |
| Bound, stale | “Bound snapshot captured {date} — may not reflect current estate.” |
| Bound, current | Show snapshot metadata + freshness band (AS-052) |

**False claims (honesty CI):**

- “Architecture has no Azure resources” when unbound
- “Live estate verified” without a bound snapshot and ObservedFact merge
- “We collected inventory for this review” when only prose was submitted (collection is IE-plane, bind is reference)

---

## Related implementation prompts

| Prompt | Delivers |
|--------|----------|
| **AS-047** | SQL `ArchitectureInventoryBindings` (unified DDL + migration) |
| **AS-048** | Attach/detach API on architecture |
| **AS-049** | Working desk attach control |
| **AS-050** | Execute merges snapshot nodes as ObservedFact |
| **AS-051** | Unbound estate-gap copy + tests |
| **AS-052** | Freshness on architecture desk |
| **AS-054** | CI ratchet — forbidden second-collector types |
| **AS-055** | Bind/unbind authz, Required audit, IDOR tests |

## Related docs

- [`CONTEXT_INGESTION.md`](CONTEXT_INGESTION.md) — diagram ↔ inventory reconciliation (IE-19) is **run-scoped** reconcile; architecture bind is **identity-scoped** snapshot selection
- [`API_CONTRACTS.md`](API_CONTRACTS.md) — attach/detach wire contracts (AS-048)
- [`HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md) — no coverage-shaped bind nag engine
