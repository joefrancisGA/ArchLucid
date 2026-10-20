> **Scope:** Paste-ready prompts for SecureNow read-path costs. **SN-PERF-01–05**, **06–10**, **12**, **17–19**, and **20–36** are shipped on this branch (waves 5–7). **SN-PERF-11**, **13–16** remain paste sets for extend-only work. Internal engineering only. Prompts only — do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-performance-00-index.md`](../../.cursor/prompts/securenow-performance-00-index.md)

# SecureNow performance — Luna prompts

**Created:** 2026-10-18 · **Status:** ready to paste · **Audience:** Composer 2.5 slow (`composer-2.5`)

Paste **one** prompt per session. Do not implement from this index.

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-PERF-01** | [securenow-performance-01-home-read-counts.md](../../.cursor/prompts/securenow-performance-01-home-read-counts.md) | — | Grouped status and wave-member counts. Home uses the first row of lists the API already orders newest-first |
| **SN-PERF-02** | [securenow-performance-02-snapshot-detail-roundtrip.md](../../.cursor/prompts/securenow-performance-02-snapshot-detail-roundtrip.md) | — | Eight snapshot grids in one `QueryMultiple` |
| **SN-PERF-03** | [securenow-performance-03-path-search-alloc.md](../../.cursor/prompts/securenow-performance-03-path-search-alloc.md) | — | Sort adjacency once. Reuse the path buffer. Copy hops only when a candidate is kept |
| **SN-PERF-04** | [securenow-performance-04-neighborhood-suffix-index.md](../../.cursor/prompts/securenow-performance-04-neighborhood-suffix-index.md) | — | Suffix index for legacy seed ids. Exact and inherited scopes stay |
| **SN-PERF-05** | [securenow-performance-05-toxic-pair-index.md](../../.cursor/prompts/securenow-performance-05-toxic-pair-index.md) | — | Pair reachability paths only with privilege paths that share a node or a terminal cloud resource |
| **SN-PERF-11** | [securenow-performance-11-drift-unchanged-resources.md](../../.cursor/prompts/securenow-performance-11-drift-unchanged-resources.md) | — | Unchanged diff rows from resource lists |
| **SN-PERF-13** | [securenow-performance-13-factory-metric-aggregates.md](../../.cursor/prompts/securenow-performance-13-factory-metric-aggregates.md) | **07** (shipped) | Grouped factory metrics; keep the active-match batch |
| **SN-PERF-14** | [securenow-performance-14-inspector-finding-ids.md](../../.cursor/prompts/securenow-performance-14-inspector-finding-ids.md) | **06** (shipped) | One finding-id read per snapshot for path detail |
| **SN-PERF-15** | [securenow-performance-15-snapshot-inventory-rows.md](../../.cursor/prompts/securenow-performance-15-snapshot-inventory-rows.md) | **11** when both are open | Inventory rows from resources, not full snapshot detail |
| **SN-PERF-16** | [securenow-performance-16-snapshot-header-sql.md](../../.cursor/prompts/securenow-performance-16-snapshot-header-sql.md) | **09** (shipped) | One header SQL text for lookup and `QueryMultiple` |
| **SN-PERF-20** | [securenow-performance-20-evidence-hub-resource-slice.md](../../.cursor/prompts/securenow-performance-20-evidence-hub-resource-slice.md) | — | Hub configuration, RBAC, and relationships for one resource |
| **SN-PERF-21** | [securenow-performance-21-evidence-hub-satellites.md](../../.cursor/prompts/securenow-performance-21-evidence-hub-satellites.md) | — | One terraform mapping and one resource’s recent changes |
| **SN-PERF-22** | [securenow-performance-22-preflight-resource-tags.md](../../.cursor/prompts/securenow-performance-22-preflight-resource-tags.md) | — | Preflight production tag from one resource and its tags |
| **SN-PERF-23** | [securenow-performance-23-instance-list-seal-batch.md](../../.cursor/prompts/securenow-performance-23-instance-list-seal-batch.md) | — | Instance list seal-checks distinct findings and runs |
| **SN-PERF-24** | [securenow-performance-24-snapshot-list-seal-batch.md](../../.cursor/prompts/securenow-performance-24-snapshot-list-seal-batch.md) | — | Snapshot list seal-checks distinct cited runs |
| **SN-PERF-25** | [securenow-performance-25-rank-findings-batch.md](../../.cursor/prompts/securenow-performance-25-rank-findings-batch.md) | — | Rank open findings with batched metadata, versions, and scores |
| **SN-PERF-26** | [securenow-performance-26-verification-resource-slice.md](../../.cursor/prompts/securenow-performance-26-verification-resource-slice.md) | **22** leaves verification alone | Verification uses headers and one resource, not two full snapshots |
| **SN-PERF-27** | [securenow-performance-27-four-reality-prior-slice.md](../../.cursor/prompts/securenow-performance-27-four-reality-prior-slice.md) | — | Prior snapshot and diff changes limited to path resources |
| **SN-PERF-28** | [securenow-performance-28-terraform-visible-resources.md](../../.cursor/prompts/securenow-performance-28-terraform-visible-resources.md) | — | Terraform mappings from visible resources, not eight grids |
| **SN-PERF-29** | [securenow-performance-29-path-detail-hypothesis-hops.md](../../.cursor/prompts/securenow-performance-29-path-detail-hypothesis-hops.md) | **14** (shipped) | Path detail hypotheses without every hop on the snapshot |
| **SN-PERF-30** | — | — | Path report edge types without full hop rows |
| **SN-PERF-31** | — | — | Outcome metrics hop columns only |
| **SN-PERF-32** | — | — | Path rank Defender header slice |
| **SN-PERF-33** | — | — | Cut-point resource types from resource list |
| **SN-PERF-34** | — | — | Routing sync tags for hop cloud resources |
| **SN-PERF-35** | — | **24** (shipped) | Batch sealed-manifest compare for distinct runs |
| **SN-PERF-36** | — | **20** (shipped) | Hub visible ARM ids from type+ARM rows |
| **SN-PERF-HOLD** | [securenow-performance-hold.md](../../.cursor/prompts/securenow-performance-hold.md) | — | Forbidden scope |

**01–05**, **06–10**, **12**, **17–19**, **20–24**, **25–29**, and **30–36** are shipped. **06–10**, **12**, and **17–19** have no paste file. **11**, **13**, **14**, and **16** can run in parallel. Run **15** after **11** if **11** is not on `master` yet, so both call one resource-list method. **20** and **21** can run in parallel. **22**, **23**, and **24** do not depend on **20**. **25**, **27**, **28**, and **29** can run in parallel. **26** follows **22** so verification is not edited in the preflight session.

**17** loads the snapshot header for question list and ownership. **18** loads ranked-path headers and cut points in batch. **19** counts architect outcome findings and exceptions in SQL.

## Settled reading

- Home copy from **SN-HOME-03** stays. This wave changes how the counts are loaded.
- The factory page still receives `RemediationFactoryWorkbenchSummary`, including waves. Member counts come from one grouped read.
- Absent status keys stay absent. Home treats a missing `ChangeImplemented` as an empty detail, and a missing `VerificationFailed` as no checks-failed suffix.
- Snapshot detail keeps its read model. The analysis wrapper keeps its own read-only copies.
- Path caps stay at the current defaults. Emitted path signatures stay the same.
- Toxic combination still loads the snapshot’s paths with `ListWithHopsBySnapshotAsync`.
- **SN-PERF-11** does not change stored diff rows. Unchanged rows stay synthetic and deterministic.
- **SN-PERF-13** does not change factory JSON. It changes how the numbers are loaded.
- **SN-PERF-14** does not change hypothesis copy.
- **SN-PERF-16** does not add a round trip. It removes a duplicated statement.
- **SN-PERF-20** does not change hub JSON. It stops loading the other resources’ grids.
- **SN-PERF-21** does not change which diff is chosen. It filters mappings and changes to one cloud resource.
- **SN-PERF-22** does not change verification. Verification is **SN-PERF-26**.
- **SN-PERF-23** and **SN-PERF-24** stay fail-closed. A sealed run still throws.
- **SN-PERF-25** does not change score JSON or rank order. `GetExplanationAsync` stays per finding.
- **SN-PERF-27** keeps the current snapshot load. Only the prior snapshot and the unfiltered change list move.
- **SN-PERF-28** keeps the same visible resource set, including private-link NIC omission.
- **SN-PERF-29** does not change hypothesis copy. List and the engines still use `ListWithHopsBySnapshotAsync`.
- Question compile still loads a full snapshot. It is not in **25–29**.

## Do not pull into these sessions

- First Load JS cuts (**PP-01–PP-03**)
- A new public route for Home
- Parallel engine execution
- Adaptive search depth, what-if planning, or a new finding engine
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
