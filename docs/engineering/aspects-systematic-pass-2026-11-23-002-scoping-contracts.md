# Aspects systematic review #002 — scoping contracts and HTTP scope provider

**Review date:** November 23, 2026 (Eastern)  
**Review ID:** `ASPECTS-SYS-2026-11-23-002`  
**Pre-review Git baseline:** `762364b030aea4997f4947173f393ee1190be1b1`  
**Track:** systematic (not targeted defect hunting)  
**Outcome:** Seven complete clean source reviews, no newly confirmed defect  
**Source code changes:** None; this PR updates review evidence and documentation only

## Full-source reviews

| Path | Lane | Original nonblank LOC | Earliest accessible history (UTC) | Last modification pre-review (UTC) | Age (days) | Architecture/control result |
|---|---|---:|---|---|---:|---|
| `ArchLucid.Core/Scoping/AmbientScopeContext.cs` | Production | 30 | Apr 6, 2026 20:15 | Apr 25, 2026 15:58 | 212 | Shared AsyncLocal ambient scope: sampled consumer compliant |
| `ArchLucid.Core/Scoping/IScopeContextProvider.cs` | Production | 28 | Apr 6, 2026 20:15 | Jun 6, 2026 18:08 | 170 | Shared scope provider contract: sampled consumer compliant |
| `ArchLucid.Core/Scoping/ScopeDimensionResolution.cs` | Production | 5 | Jun 6, 2026 18:08 | Jun 6, 2026 18:08 | 170 | Value with explicit source provenance: compliant |
| `ArchLucid.Core/Scoping/ScopeResolution.cs` | Production | 43 | Jun 6, 2026 18:08 | Jun 6, 2026 18:08 | 170 | Shared tenant/workspace/project plus provenance: compliant |
| `ArchLucid.Core/Scoping/ScopeSource.cs` | Production | 15 | Jun 6, 2026 18:08 | Jun 6, 2026 18:08 | 170 | Shared enumeration: compliant |
| `ArchLucid.Host.Core/Auth/Services/HttpScopeContextProvider.cs` | Production | 81 | Apr 6, 2026 20:15 | Aug 24, 2026 16:50 | 91 | Uses shared ambient, context and source types: compliant within sampled integrations |
| `ArchLucid.Core.Tests/Scoping/AmbientScopeContextTests.cs` | Test | 67 | Apr 6, 2026 14:14 | Apr 25, 2026 15:58 | 212 | Tests inspected, not executed |

**Total actual full-source inspection:** **269 nonblank lines = 202 production + 67 test**. All original source spans and current original blob hashes were verified against the frozen Git baseline before ledger capture. No source path matches were found in the prior master JSONL ledger or the historical workbook `Review evidence` path list.

All seven records have `review_track=systematic`, `review_outcome=clean`, a common review ID, no defect ID, source first-seen and last-modification commits/dates, and architecture-control notes. Clean tests and supporting consumer previews are not converted into defect findings.

## Oldest source file and last touch

The **oldest source file inspected** by earliest accessible Git path history is `ArchLucid.Core.Tests/Scoping/AmbientScopeContextTests.cs`: earliest visible commit **April 6, 2026, 14:14:34 UTC** (`91a4aa85d0e4cf05a79ab25780425a425be089d1`), last source modification **April 25, 2026, 15:58:01 UTC** (`7c5bc1dd8a03aef52aa4e8282a55a1e8ff7c2d91`), **212 days** since last touch.

Oldest production first-seen cohort: `AmbientScopeContext.cs`, `IScopeContextProvider.cs`, `HttpScopeContextProvider.cs`, all first seen **April 6, 2026, 20:15:37 UTC**. The least recently touched among them is `AmbientScopeContext.cs`, last modified April 25 (212 days).

**History qualifier:** GitHub path-filtered commit history was inspected for all seven files. A full `git log --follow` rename traversal was not run: earliest accessible path appearance is **not** proof of original file creation.

## Architectural reuse observations

- `AmbientScopeContext.Push` uses AsyncLocal scoped overrides; the HTTP scope provider honors the ambient override for background work. The test file covers default absence, push/pop, nested LIFO and idempotent disposal.
- `IScopeContextProvider` exposes `GetCurrentScope` and `ResolveCurrentScope`; the HTTP provider supplies provenance-aware resolution, preferring claims over untrusted headers, then explicit development defaults.
- `ScopeDimensionResolution`, `ScopeResolution`, and `ScopeSource` centralize provenance. The sampled production `ScopeResolutionGuard` rejects untrusted scope sources in production-like hosts.
- These are **sampled reuse conclusions**, not evidence that every consumer in the entire repository has migrated.

## Coverage, rate, and policy

- Current pass: **7 clean source records, 0 distinct defects, 202 candidate new production reviewed lines**. The 67 test-source lines are tracked in their separate lane, not added to the production defect-density denominator.
- Previous systematic pass `ASPECTS-SYS-2026-11-23-001` remains in PR #7942 and is not yet merged into master; merge order may require a trivial JSONL ledger append conflict resolution.
- Source inventory at the selected Git tree exposed many eligible code paths, but the full locally computed planner denominator is **not available**. **Whole-repository LOC coverage % remains unknown**; not inferable from the provisional historical denominator.
- Previous operational workbook snapshot: **527 distinct defects, 347,224 provisional candidate unique production LOC**. Only append the newly inspected 202 production LOC after checking historical overlaps; no defects are added.
- No full master build, RC49 build, or new tests were run. The user controls merges.

**Next step:** Run `scripts/aspects_systematic_review.py plan` against a complete checkout to establish a reproducible eligible-line denominator and deterministic globally oldest-first queue, then continue systematic reviews, including clean files.
