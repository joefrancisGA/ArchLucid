# Aspects systematic review #001 — scope identity and activity correlation

**Date:** 2026-11-23 (America/New_York)  
**Frozen pre-review Git baseline:** `762364b030aea4997f4947173f393ee1190be1b1`  
**Review ID:** `ASPECTS-SYS-2026-11-23-001`  
**Track:** systematic, **not** targeted defect hunting  
**Outcome:** six clean file reviews; zero new confirmed defects; no source changes  
**Review completeness:** every nonblank original line in each of the six pinned files inspected  
**Architecture scope:** sampled downstream users of shared scoping and correlation controls; not a global adoption attestation

## Files inspected

| File | Lane | Nonblank LOC | Earliest reachable path history (UTC) | Last Git modification before review (UTC) | Last-change SHA | Age (days) | Review | Sampled architectural reuse |
|---|---|---:|---|---|---|---:|---|---|
| `ArchLucid.Core/Scoping/ScopeContext.cs` | Production | 30 | 2026-04-06 20:15:37 | 2026-04-25 15:58:01 | `7c5bc1dd8a03aef52aa4e8282a55a1e8ff7c2d91` | 212 | Clean | Data carrier; complete adoption not assessed |
| `ArchLucid.Core/Diagnostics/ActivityCorrelation.cs` | Production | 30 | 2026-04-06 20:15:37 | 2026-05-01 23:38:19 | `329664581926781cd02a7f8a00d2769981793cce` | 206 | Clean | Shared helper reused by audit, webhook and run/indexing paths in sampled search |
| `ArchLucid.Core/Scoping/ScopeIds.cs` | Production | 30 | 2026-04-06 20:15:37 | 2026-06-06 18:08:48 | `6656f64439aff3455ccbb0bbd2a6b4f990b0713c` | 170 | Clean | Central defaults reused by demo factory and production scope guard |
| `ArchLucid.Host.Core/Demo/DemoScopes.cs` | Production | 15 | 2026-04-21 13:35:12 | 2026-05-03 16:33:30 | `b5e3cabf0f6066ac041dadd8fdd417ca9be609d4` | 204 | Clean | Uses canonical `ScopeIds`; route-gating claims not independently verified here |
| `ArchLucid.Api/Security/ScopeResolutionGuard.cs` | Production | 34 | 2026-06-06 18:08:48 | 2026-09-04 21:14:36 | `af94ecf8fafd1e7e12bb150fda611dd3910c8166` | 80 | Clean | Uses `ScopeIds.IsDevelopmentDefault` rather than duplicating default values |
| `ArchLucid.Decisioning.Tests/ActivityCorrelationTests.cs` | Test | 47 | 2026-04-06 14:14:34 | 2026-04-06 20:16:19 | `8da0ab545fa8fe0eee1437c6acb975201ec298fb` | 231 | Clean | Existing test cases for null, invalid tag, nearest tagged ancestor |

**Total source lines actually inspected:** **186** = 139 production + 47 test. Do **not** add test lines to the preexisting operational production-LOC defect density denominator.

### Oldest-file reporting

- **Oldest reviewed file including tests:** `ArchLucid.Decisioning.Tests/ActivityCorrelationTests.cs`, earliest reachable commit **2026-04-06 14:14:34 UTC**, last touched **2026-04-06 20:16:19 UTC** (`8da0ab545fa8fe0eee1437c6acb975201ec298fb`), **231 days** since that modification.
- **Oldest reviewed production-source first-seen cohort:** `ScopeContext.cs`, `ActivityCorrelation.cs`, `ScopeIds.cs` all first appear at **2026-04-06 20:15:37 UTC** in the path-filtered history. Among them the **least recently modified** is `ScopeContext.cs`, last touched **2026-04-25 15:58:01 UTC** (`7c5bc1dd8a03aef52aa4e8282a55a1e8ff7c2d91`), **212 days** earlier.
- **History qualification:** GitHub REST path-filtered commit history was available, but a complete local `git log --follow` rename traversal was not. These are *earliest verifiable path appearances*, not guaranteed original file-creation dates.

### Source verification and no-defect outcome

Each source file was fetched at the exact pinned baseline. The original Git blob SHA and every contiguous nonblank line span were checked. All six paths were absent from the previous master source ledger and exact source-path search of the historical workbook `Review evidence` sheet. Source code was inspected directly. Supporting sample consumers were examined, but were **not** entered as full source reviews or counted in the denominator; `AuditService.cs` has prior historical review records.

No new confirmed defect emerged from these six clean reviews. No source-code fix was needed. No .NET tests or comprehensive master/RC49 build were run; the existing ActivityCorrelation unit tests were inspected but not executed.

### Coverage accounting and next priority

- **New systematic evidence:** 6 clean review records, 186 current-blob nonblank lines in separate production/test lanes.
- **Operational production defect-density provisional denominator:** 139 candidate new production LOC; **zero** new distinct defects.
- **Whole-repository source coverage percentage:** **unknown**, because a full source inventory at the pinned Git HEAD has not yet been executed; neither the 347k historical denominator nor the six reviewed files establishes the current repository total.
- **Oldest-first selection qualification:** these were a sampled group of older files with no recorded source review, ordered by observed last-touched dates. They are not asserted to be the globally oldest eligible files. The next systematic priority is to execute the merged `scripts/aspects_systematic_review.py plan` command against a complete Git checkout, use its deterministic full-tree queue, and continue recording both clean and defect reviews.

**CI/build policy:** Do not initiate a comprehensive master build. RC49 comprehensive builds remain manual-only. The owner retains merge decisions.

