> **Scope:** Paste-ready prompts for five SecureNow read-path costs found in the Home factory summary and the architect engines. Internal engineering only. Prompts only — do not implement from this index.
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
| **SN-PERF-HOLD** | [securenow-performance-hold.md](../../.cursor/prompts/securenow-performance-hold.md) | — | Forbidden scope |

**SN-PERF-01**, **02**, and **05** can run in parallel. **03** and **04** can run in parallel when they do not edit `PrivilegePathEnumerator` in the same branch. **04** does not need to edit that file.

## Settled reading

- Home copy from **SN-HOME-03** stays. This wave changes how the counts are loaded.
- The factory page still receives `RemediationFactoryWorkbenchSummary`, including waves. Member counts come from one grouped read.
- Absent status keys stay absent. Home treats a missing `ChangeImplemented` as an empty detail, and a missing `VerificationFailed` as no checks-failed suffix.
- Snapshot detail keeps its read model. The analysis wrapper keeps its own read-only copies.
- Path caps stay at the current defaults. Emitted path signatures stay the same.
- Toxic combination still loads the snapshot’s paths with `ListWithHopsBySnapshotAsync`.

## Do not pull into these sessions

- First Load JS cuts (**PP-01–PP-03**)
- A new public route for Home
- Parallel engine execution
- Adaptive search depth, what-if planning, or a new finding engine
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
