> **Scope:** Paste-ready prompts for SecureNow read-path costs. **SN-PERF-01–05** are shipped. **SN-PERF-11** and **13–16** are the next paste set. Internal engineering only. Prompts only — do not implement from this index.
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
| **SN-PERF-20** | — | — | Evidence hub resource slice (no full snapshot detail) |
| **SN-PERF-21** | — | — | Evidence hub terraform mapping and recent changes per resource |
| **SN-PERF-22** | — | — | Remediation preflight production tag from resource + tags |
| **SN-PERF-23** | — | — | Remediation instance list batched sealed-manifest checks |
| **SN-PERF-24** | — | — | Snapshot list batched reconciliation run seal checks |
| **SN-PERF-HOLD** | [securenow-performance-hold.md](../../.cursor/prompts/securenow-performance-hold.md) | — | Forbidden scope |

**01–05**, **06–10**, **12**, and **20–24** are shipped. **06–10** and **12** have no paste file. **11**, **13**, **14**, and **16** can run in parallel. Run **15** after **11** if **11** is not on `master` yet, so both call one resource-list method.

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

## Do not pull into these sessions

- First Load JS cuts (**PP-01–PP-03**)
- A new public route for Home
- Parallel engine execution
- Adaptive search depth, what-if planning, or a new finding engine
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
