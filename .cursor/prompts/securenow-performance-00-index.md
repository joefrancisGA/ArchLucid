<!-- SecureNow performance — Composer prompts.
     Origin: 2026-10-18 source review of Home and the architect engines.
     Prompts only. Do not implement from this index. -->

# SecureNow performance — prompt index (SN-PERF-01–05, 11, 13–16, 20–29)

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
| 11 | **SN-PERF-11** | Unchanged drift rows load resource lists, not full snapshot detail. |
| 13 | **SN-PERF-13** | Factory metrics use grouped SQL. Active-match batch from **SN-PERF-07** stays. |
| 14 | **SN-PERF-14** | Path inspector loads citing finding ids once per snapshot. |
| 15 | **SN-PERF-15** | Snapshot inventory rows use the resource list. Reuse **SN-PERF-11**’s read when it exists. |
| 16 | **SN-PERF-16** | Snapshot header SQL is one statement shared by lookup and detail. |
| 20 | **SN-PERF-20** | Evidence hub loads one resource’s properties, tags, relationships, and role assignments. |
| 21 | **SN-PERF-21** | Evidence hub loads one terraform mapping and one resource’s recent changes. |
| 22 | **SN-PERF-22** | Preflight production tag reads one resource and its tags. |
| 23 | **SN-PERF-23** | Instance list seal-checks distinct findings, assessments, and runs. |
| 24 | **SN-PERF-24** | Snapshot list seal-checks distinct cited runs for the page. |
| 25 | **SN-PERF-25** | Rank open findings batches metadata, pattern versions, and score writes. |
| 26 | **SN-PERF-26** | Verification uses snapshot headers and one resource. |
| 27 | **SN-PERF-27** | Four-reality drift loads prior properties and changes for path resources. |
| 28 | **SN-PERF-28** | Advisory Terraform uses the visible resource set, not eight grids. |
| 29 | **SN-PERF-29** | Path detail hypotheses load fan-out hops, not every hop. |
| — | **SN-PERF-HOLD** | Stop list. Paste only when a session drifts. |

**01–05** are shipped. **06–10**, **12**, and **17–19** are shipped in code and have no paste file; do not rewrite them. **11** is independent. **15** should follow **11** when both are open, so they share one resource read. **13**, **14**, and **16** are independent of **11**. **20** and **21** can run in parallel. **22**, **23**, and **24** are independent of **20**. **25**, **27**, **28**, and **29** can run in parallel. **26** follows **22**.
