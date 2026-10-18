<!-- SecureNow performance — Composer prompts.
     Origin: 2026-10-18 source review of Home and the architect engines.
     Prompts only. Do not implement from this index. -->

# SecureNow performance — prompt index (SN-PERF-01–05)

**Do not implement from this index.** Paste **one** numbered file per session.

Copy-paste docs index: [`docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`](../../docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md).

**Base:** current `master`. Do not branch from an old performance-wave branch. **PP-01–PP-03** stay the First Load JS residual. This set does not cut route bundles.

| # | Prompt | What it changes |
|---|--------|-----------------|
| 1 | **SN-PERF-01** | Factory summary counts with grouped SQL. Home stops re-sorting lists the API already orders. |
| 2 | **SN-PERF-02** | Snapshot detail returns its eight grids in one round trip. |
| 3 | **SN-PERF-03** | Privilege and reachability search reuse one path buffer. Adjacency is sorted once. |
| 4 | **SN-PERF-04** | Neighborhood seed match uses a suffix index. Legacy prefixed ids still match. |
| 5 | **SN-PERF-05** | Toxic combinations pair a reachability path only with privilege paths that share an asset. |
| — | **SN-PERF-HOLD** | Stop list. Paste only when a session drifts. |

**01** is independent. **03** before **04** only if both touch `PrivilegePathEnumerator` in the same week; otherwise either can go first. **05** does not depend on **03**. **02** is independent.
