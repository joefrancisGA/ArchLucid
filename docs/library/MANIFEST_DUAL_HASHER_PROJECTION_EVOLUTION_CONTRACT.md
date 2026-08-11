> **Scope:** Contributor-reference — dual ManifestHash / GoldenManifestFingerprint surfaces, lossy commit projection, and deliberate re-lock rituals (TB-1156). Coordinates production verify with golden-cohort eval baselines.

# Dual hasher / projection evolution (TB-1156)

> **Audience:** Contributors, principal architects, release engineers, and GTM claim reviewers who need one matrix for ManifestHash vs content fingerprint.  
> **Not** a buyer assurance claim — naming hash surfaces describes engineering honesty; it does not prove offline lineage for every export slice.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#manifest-dual-hasher-projection-evolution-m-199) (GTM **M-198** / **M-199**).  
**Path-stable alias:** [`MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_PA_ONE_PAGER.md`](../go-to-market/MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_PA_ONE_PAGER.md).  
**Production re-lock CI:** **TB-1157** (open). **Committed unit of truth:** **TB-1003** / GTM **M-155**. **Sealed-row evolution:** **TB-1277** **Done** — [`MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md`](./MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md) / GTM **M-223**.

---

## Decision in one line

Production **`ManifestHash`** (authority `ManifestDocument` via `ManifestHashService`) is **not** the golden-cohort **content fingerprint** (`GoldenManifestFingerprint.ComputeContentSha256Hex`). Drift, verify, and re-lock language must name **which hasher moved** and **which ritual** applies — cohort lock-baseline and production deliberate re-lock are different paths.

---

## Hasher A — production `ManifestHash`

| Item | Detail |
|------|--------|
| **Type** | `ArchLucid.Decisioning.Services.ManifestHashService` (`IManifestHashService`) |
| **Input** | Authority `ManifestDocument` (full structural manifest in decisioning domain) |
| **Algorithm** | SHA-256 over UTF-8 canonical JSON from anonymous projection; uppercase hex |
| **Hasher version** | **None today** — subset/serializer changes are silent until **TB-1157** |
| **Persisted as** | `ManifestHash` on committed golden manifest / export lineage |
| **Consumers** | Commit persist, `AuthorityReplayService`, export verify (**Done TB-307**), buyer unit-of-truth (**M-155**) |

### Included in canonical projection

`TenantId`, `WorkspaceId`, `ProjectId`, `ManifestId`, `RunId`, snapshot ids (`ContextSnapshotId`, `GraphSnapshotId`, `FindingsSnapshotId`), `DecisionTraceId`, `RuleSetId` / `RuleSetVersion` / `RuleSetHash`, `Metadata`, `Requirements`, `Topology`, `Security`, `Compliance`, `Cost`, `Constraints`, `UnresolvedIssues`, sorted `Decisions` (with ordered `SupportingFindingIds` / `RelatedNodeIds`), sorted `Assumptions` / `Warnings`, `Policy`, `Provenance`, `FeasibilityVerdict`, `EffectiveGovernanceAtCommit` (sorted pack rows and compliance keys).

### Excluded from canonical projection

| Field | Why excluded | Risk if misunderstood |
|-------|--------------|------------------------|
| `CreatedUtc` | Non-deterministic metadata | Safe — documented exclusion |
| `SchemaVersion` | **Not in projection today** | Authority schema bumps may not move `ManifestHash` until projection includes them (**TB-1277** owns tolerant-reader policy) |

Collection ordering is normalized (`OrderBy` on decisions, assumptions, warnings, governance keys) so insertion order does not change the hash.

---

## Hasher B — cohort content fingerprint

| Item | Detail |
|------|--------|
| **Type** | `ArchLucid.Contracts.Manifest.GoldenManifestFingerprint` |
| **Primary method** | `ComputeContentSha256Hex(GoldenManifest)` |
| **Secondary** | `ComputeSha256Hex` — full DTO including per-run identity (not the cohort baseline hasher) |
| **Input** | Contract `GoldenManifest` (after `AuthorityCommitProjectionBuilder`) |
| **Algorithm** | SHA-256 over UTF-8 JSON via `ContractJson.Default`; uppercase hex |
| **Persisted as** | `expectedCommittedManifestSha256` in `tests/golden-cohort/cohort.json` |
| **Consumers** | `golden-cohort lock-baseline`, nightly drift, `assert_golden_cohort_baseline_locked.py` |

### Included in content projection

`SystemName`, sorted `Services` / `Datastores` / `Relationships` (structural fields only), derived `Governance` (`ComplianceTags`, `PolicyConstraints`, `RequiredControls`, risk/cost classification), metadata subset: `ManifestVersion`, `ParentManifestVersion`, `ChangeDescription`.

### Excluded from content projection

| Field | Why excluded |
|-------|--------------|
| `RunId` | Per-run identity — Simulator cohort must compare across runs |
| `Metadata.CreatedUtc` | Timestamp |
| `Metadata.DecisionTraceIds` | Per-run trace linkage |

---

## Projection bridge — `AuthorityCommitProjectionBuilder`

Commit builds: `ManifestDocument` → `ManifestHashService.ComputeHash` → **persist authority hash** → `AuthorityCommitProjectionBuilder` → contract `GoldenManifest` → cohort/content SHA.

| Authority-only (hasher A, not in contract projection) | Contract-only / derived (hasher B path) |
|-------------------------------------------------------|----------------------------------------|
| Full `Decisions`, `Requirements`, `Policy` violations/notes, `Provenance`, `FeasibilityVerdict`, `EffectiveGovernanceAtCommit` detail | Topology services/datastores/relationships (copied) |
| `UnresolvedIssues`, `Assumptions`, `Warnings` | `Governance` via `MapGovernance` (lossy rollup) |
| Snapshot ids, rule-set fields on document root | `Metadata` subset + `DecisionTraceIds` (excluded from content SHA) |

**Lossiness rule:** A change can move **hasher A** without moving **hasher B** (authority field not projected), or move **hasher B** via `MapGovernance` drift without an obvious authority-field delta. Buyer language must not treat cohort green as production verify green.

---

## Failure-mode matrix

| # | Failure / smell | Hasher / surface | Required response |
|---|-----------------|------------------|-------------------|
| 1 | Projection field add/omit without cohort re-lock | B (content SHA) | `golden-cohort lock-baseline` + `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED` + owner variable `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED` |
| 2 | `ManifestHashService` subset/serializer change without production re-lock | A (`ManifestHash`) | **TB-1157** deliberate baseline/version re-lock — historical export verify / replay mass-fail until addressed |
| 3 | `MapGovernance` heuristic drift (risk/cost tier rules) | B (and buyer-facing contract) | Cohort re-lock + disclose mapping change; authority hash may be unchanged |
| 4 | `JsonSerializer` / property-order / enum formatting churn | A and/or B | Treat as hasher change for the affected surface; never silent merge |
| 5 | Save remap without `authorityPersistBody` | A (persist path) | Integrity/orchestration bug — not healed by cohort re-lock |
| 6 | Equate content fingerprint with `ManifestHash` | Buyer / proof language | **Forbid** — cite both surfaces (**M-198**) |
| 7 | Cohort re-lock sold as healing production verify | A vs B | **Forbid** — separate rituals (**M-202**) |
| 8 | `SchemaVersion` bump expected to move production hash | A | Document under **TB-1277**; today `SchemaVersion` is outside hasher A projection |

---

## Deliberate re-lock rituals

| Ritual | When | Approval / artifacts | Does **not** substitute for |
|--------|------|----------------------|------------------------------|
| **Cohort lock-baseline** | Intentional content/projection change in eval fixtures | `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED`, `golden-cohort lock-baseline --write`, `tests/golden-cohort/cohort.json`, CI `assert_golden_cohort_baseline_locked.py` | Production `ManifestHash` continuity or export verify |
| **Production deliberate re-lock** (**TB-1157**) | Any change to `ManifestHashService` canonical projection or hasher version | Planned: `MANIFEST_HASH_HASHER_BASELINE.md` (or committed fixture hashes) + approval marker analogous to cohort lock | Rubber-stamp mass SHA rewrite (**M-202** / **TB-1172**) |
| **Schema / storage dual-write** | Storage-layout compat only | **TB-1277** — not a content migration of sealed manifests | Rewriting sealed package bytes |

---

## TB-1157 CI anchors (named, not implemented here)

| Anchor | Purpose |
|--------|---------|
| `ArchLucid.Decisioning/Services/ManifestHashService.cs` | Primary diff trigger for production hasher changes |
| `docs/library/MANIFEST_HASH_HASHER_BASELINE.md` (or committed golden hashes) | Owner-visible baseline artifact that must move with hasher changes |
| `ARCHLUCID_MANIFEST_HASH_BASELINE_LOCK_APPROVED` (proposed) | Single-shot operator approval for production re-lock |
| `ManifestHashServiceTests`, export verify tests, `AuthorityReplayService` tests | Regression proof after deliberate re-lock |
| Claim-honesty guards | Fail stubs equating cohort content SHA with production `ManifestHash` |

---

## Explicit non-claims

- Dual-hasher contract ≠ unifying both algorithms in one TB (document only).
- Cohort 20/20 after mass unexplained SHA rewrite ≠ product stability (**M-202**).
- `ManifestHash` verify ≠ per-file export SHA offline (**M-268** / **TB-307** scope).
- Projection evolution ≠ rewriting sealed committed rows (**TB-1277** / **M-224**).

---

## Related

- ADR 0040 · [`EVIDENCE_IMMUTABILITY.md`](EVIDENCE_IMMUTABILITY.md) · Done **TB-307** / **TB-575**
- [`tests/golden-cohort/README.md`](../../tests/golden-cohort/README.md) · GTM **M-154** / **M-160**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-1156**–**TB-1157**, **TB-1003**, **TB-1277**
