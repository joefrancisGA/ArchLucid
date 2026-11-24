# Aspects systematic review #002 — scoping architecture (ten files)

**Pass date:** 2026-11-23 (America/New_York)  
**Review ID:** `ASPECTS-SYS-2026-11-23-002`  
**Pinned Git baseline:** `762364b030aea4997f4947173f393ee1190be1b1`  
**Review track:** systematic; **outcome:** ten clean source reviews, no new defect confirmed.  
**Review source:** exact original blob and all nonblank line spans verified for each file in the GitHub branch ledger.  
**Review selection:** deterministic alphabetical expansion within the previously unreviewed ArchLucid.Core/Scoping subsystem. These are **not claimed as the globally oldest ten files**.

## Audited files and historical overlap

| Full source path | Inspected LOC | Prior exact-blob LOC | Candidate new LOC | First seen UTC | Last touched UTC | Age days | Sampled reuse |
|---|---:|---:|---:|---|---|---:|---|
| `ArchLucid.Core/Scoping/AmbientScopeContext.cs` | 30 | 0 | 30 | 2026-04-06 | 2026-04-25 | 212 | compliant |
| `ArchLucid.Core/Scoping/DemoCreatedSampleWorkspaceIds.cs` | 39 | 0 | 39 | 2026-07-11 | 2026-07-11 | 135 | compliant |
| `ArchLucid.Core/Scoping/DemoRegulatedScenarioWorkspaceIds.cs` | 44 | 0 | 44 | 2026-05-16 | 2026-05-17 | 190 | compliant |
| `ArchLucid.Core/Scoping/DemoTourWorkspaceIds.cs` | 44 | 0 | 44 | 2026-05-16 | 2026-05-17 | 190 | compliant |
| `ArchLucid.Core/Scoping/DemoWorkspaceStableIds.cs` | 18 | 0 | 18 | 2026-05-16 | 2026-05-16 | 191 | compliant |
| `ArchLucid.Core/Scoping/IScopeContextProvider.cs` | 28 | 0 | 28 | 2026-04-06 | 2026-06-06 | 170 | not-assessed |
| `ArchLucid.Core/Scoping/ProjectScopeKey.cs` | 36 | 36 | 0 | 2026-09-20 | 2026-09-20 | 64 | compliant |
| `ArchLucid.Core/Scoping/ProjectScopeKeyMapping.cs` | 6 | 6 | 0 | 2026-09-20 | 2026-09-20 | 64 | compliant |
| `ArchLucid.Core/Scoping/ProjectSnapshotScopeKey.cs` | 22 | 22 | 0 | 2026-09-26 | 2026-09-26 | 58 | compliant |
| `ArchLucid.Core/Scoping/ReadScopeTripleMapping.cs` | 12 | 0 | 12 | 2026-05-27 | 2026-05-27 | 180 | compliant |

**Accounting:** **279** actual production nonblank LOC inspected; **64** already in the historical workbook at the **identical Git blob**, **215** candidate new unique production LOC. **Zero** new distinct defect IDs. Three files repeat past clean-reviewed material, which is not added again to the 900-commit provisional source denominator.

Original historic workbook overlap evidence:
- `ProjectScopeKey.cs`: Excel rows 1890 and 2679; same blob `78e964fdb2788d39cf49c1e3f1873f8b499b648f`; entire original nonblank 36 LOC previously inspected
- `ProjectScopeKeyMapping.cs`: Excel row 1891; same blob `721f83f0783bdd5d0473adff66f4e8abc766ea55`; all six LOC repeated
- `ProjectSnapshotScopeKey.cs`: Excel row 1820; same blob `d5ea51e0fce731a446e9580734771f6ecd37b0d4`; all 22 LOC repeated
- Other seven files: no matching path in imported historical Review evidence rows; no matching path in master GitHub verified ledger; candidate new LOC still provisional pending unpinned historical and content-lineage reconciliation

## Oldest reviewed source file and last-touch information

Two reviewed files share the **earliest reachable Git path history** (April 6, 2026 at 20:15:37 UTC): `AmbientScopeContext.cs` and `IScopeContextProvider.cs`.

- Among those oldest first-seen files, **`ArchLucid.Core/Scoping/AmbientScopeContext.cs` was modified least recently**, April 25, 2026 at 15:58:01 UTC; last-touch commit `7c5bc1dd8a03aef52aa4e8282a55a1e8ff7c2d91`; 212 days before this review
- `IScopeContextProvider.cs` last touched June 6, 2026 at 18:08:48 UTC; last-touch commit `6656f64439aff3455ccbb0bbd2a6b4f990b0713c`
- Each remaining reviewed file has a pinned earliest reachable path-history date, latest pre-review modification date and SHA in the ledger. Path-filtered GitHub commit history was used, without independent local `git log --follow`; dates are **earliest verifiable path appearances**, not guaranteed creation dates

## Architectural review result

All ten sources were inspected in full. The sampled consumers of the central tenant/workspace/project scope controls reuse established `ScopeIds`, `ProjectScopeKey`, `ProjectSnapshotScopeKey`, `AmbientScopeContext`, `ReadScopeTripleMapping` and tenant-keyed demo ID derivation instead of independently duplicating those policies. Provider-source attribution implementation is **not-assessed** beyond its interface contract. A compliant status represents sampled consumers only, **not a repository-wide reuse proof**.

Other sampled consumers and parity tests were searched to check the shared contract usage; they were **not** credited with LOC review unless separately inspected in full.

## First Git-tree eligibility census

Using the recursive GitHub Git tree for baseline `762364b030aea4997f4947173f393ee1190be1b1` (48,848 total entries, `truncated=false`) and a mirror of the merged `scripts/aspects_systematic_review.py` extension/exclusion rules:

| Lane | Eligible source files |
|---|---:|
| Production | 22,572 |
| Tests | 13,632 |
| Tooling/CI | 1,368 |
| Infrastructure | 1,179 |
| **Total** | **38,751** |

This is an eligible **file count**, not a source-LOC census. The merged systematic planner's full `nonblank_counts` method and complete Git path history require a local full checkout. The percentage of eligible LOC reviewed **remains unknown**; do not divide by the old 347K provisional denominator.

Two submitted (unmerged at time of recording) systematic pass PRs contain **16 completely reviewed distinct files**, equivalent to **0.0413% of eligible files** at the pinned census, conditional on verification and PR integration. This percentage is only a file-completion indicator; it is not the desired LOC coverage percentage.

## Next step and validation

Run the merged `scripts/aspects_systematic_review.py plan` on a complete Git checkout at the pinned tree, generate its exact nonblank LOC denominator and full oldest-last-touched priority queue, then continue from that queue. The present pass does not fake globally oldest ordering or claim full provenance.

No application source changes were necessary. Existing tests were not executed and no comprehensive build was started against master or RC49. Merge remains owner-controlled.

