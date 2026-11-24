# FND-010 artifact read authorization reuse audit — 2026-11-24

## Scope and existing architecture

The source audit reviewed **seven** run- or manifest-specific HTTP read/download actions in `ArchLucid.Api/Controllers/Authority/ArtifactExportController.RunArtifacts.cs` together with `ArtifactExportController.cs`, the existing `ArtifactExportController.SealedManifestGuard.cs`, `IArchitectureShareAccessGate`, `ArchitectureShareAccessGate`, `IAuthorityQueryService`, `SealedManifestReadGuard`, and existing artifact export unit tests. The class has `[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]` and established tenant/workspace/project scope. It already has an injected share gate; the standard ZIP export uses it. Neither tenant scope nor a valid manifest hash is a substitute for the *additional architecture-specific sharing decision*.

| URL identifier | Action | Before correction | Proposed adoption |
| --- | --- | --- | --- |
| RunId | `ListArtifactsForRun` | GetRunDetailAsync precedes any sharing check | Existing share gate **before** run detail |
| RunId | `DownloadBundleForRun` | GetRunDetailAsync precedes any sharing check | Existing share gate **before** run detail |
| RunId | `DownloadArtifactForRun` | GetRunDetailAsync precedes any sharing check | Existing share gate **before** run detail |
| ManifestId | `ListArtifacts` | Full manifest summary read precedes any sharing check | Scoped RunId projection → existing share gate → summary |
| ManifestId | `GetArtifactDescriptor` | Full manifest summary read precedes any sharing check | Scoped RunId projection → existing share gate → summary |
| ManifestId | `DownloadArtifact` | Full manifest summary read precedes any sharing check | Scoped RunId projection → existing share gate → summary |
| ManifestId | `DownloadBundle` | Full manifest summary read precedes any sharing check | Scoped RunId projection → existing share gate → summary |

**Finding FND010-ART-001:** all seven had a confirmed controller-level omission of the already-established architecture-sharing control. This is a same-scope restricted-architecture access concern, not proof of cross-tenant exploitation. All seven otherwise use pre-existing scoped persistence and lifecycle/sealed-evidence gates; the new check is additive.

**Finding FND010-ART-002:** the four manifest-ID actions previously sealed-verified the run's **current** `GoldenManifest` only. The requested manifest ID might refer to a historic document. Its identity, owner run and own seal were not independently checked. This is an integrity-association gap, distinct from authorization. Do not equate `manifestId` with `runId`.

## Focused implementation / component reuse

This PR depends on the pending integrated FND-010 manifest-identity change **#7983**, which introduced `IAuthorityQueryService.GetRunIdByManifestIdAsync(scope, manifestId)` as a metadata-only scoped projection plus `GetManifestForSummaryVerificationAsync` for historical exact documents, in SQL/in-memory/cache implementations. Reuse those APIs rather than introduce a second manifest lookup implementation.

Three **private helpers in the existing partial artifact controller**:

1. `EnsureArtifactRunShareReadAllowedAsync` delegates directly to its existing injected `IArchitectureShareAccessGate` with authenticated principal, trusted scope, exact run ID and request cancellation.
2. `ResolveAuthorizedArtifactManifestAsync` rejects Guid.Empty/missing scoped run mapping, authorizes the projected run **before loading the full manifest summary**, masks denial as a generic manifest 404 (without the run ID), and rechecks summary's manifest ID/RunId consistency before proceeding.
3. `EnsureExactArtifactManifestSealedReadAsync` checks current pinned run↔manifest association and requested manifest ID/RunId/scope/summary hash, preserving historical IDs by fetching and seal-verifying their **exact** scoped manifest. It reuses `EnsureSealedManifestHashOrConflict` (the existing `SealedManifestReadGuard`) on both current and historic documents. For the current manifest case it reuses the loaded instance, avoiding another exact-manifest repository lookup.

Existing lifecycle, career-posture, packaging, logging and audit semantics are preserved. Run-ID wrapper routes invoke the gate before their first detail read and then delegate to manifest-ID actions, which reauthorize against the resolved manifest's run. **This deliberately incurs a second authorization check** rather than trust an unverified run↔manifest association; an optimization would require reviewed request-scoped proof propagation, not a bypass.

## Tests

The existing focused `ArtifactExportSealedManifestRuntimeConflictTests` now exercises:
- Seven route-specific denied-sharing cases, proving no authority summary/detail, artifact repository, or packaging calls after denial.
- Missing/empty scoped manifest-to-run mapping fails closed without invoking sharing or protected summary.
- Authorized current and historical manifest route reaches the artifact query only after sharing authorization and matching actual sealed hash; historical path fetches and hashes both old and current document.
- A historic manifest with wrong run association fails with conflict and does not read artifacts.

`ArtifactExportControllerRunExportTests` remains in the existing FND-010 .NET focused filter. The dependent PR temporarily extends the workflow's `pull_request.branches` to include the pending #7983 branch, **solely to run focused CI on the narrow PR**. Remove that transient branch trigger when retargeting to master after #7983 merges. The parent #7983's separate SQL/persistence tests are a prerequisite; do not claim downstream security without its validated scoped RunId projection.

## Source history and limits

GitHub's scoped commit history (current path, no rename following) shows `ArtifactExportController.RunArtifacts.cs` first visible at **2026-08-26 04:33:36 UTC**, last changed on baseline master **2026-10-06 16:44:51 UTC**. These are *path history*, not guaranteed original creation after renames. The existing sealed guard and other readers were also inspected, without a whole-repository adoption percentage claim.

Remaining risks: provenance/audit writes and credential trust still depend on their existing services; no transaction is added across run-ID projection, access decision, and manifest read, though the summary-to-authorized-run mapping is checked again. The new helper should not be reused in unrelated controllers without checking their resource contracts. It does not implement SecureNow `evidence.read` across ordinary `ReadAuthority` routes. No new architecture-control family, cloud automation, direct SQL mutation, merge, or comprehensive master build is authorized.

**Integration:** This is a **dependent PR targeting #7983's branch**, not master. User remains sole merge decision-maker. After user merges #7983, retarget this PR to master, remove the temporary workflow base trigger, and rerun focused checks on the new head. Do not merge parent and child together unintentionally.


## Validation follow-up — 2026-11-24

- Parent #7983 exact head `2163af3db03825b81419b485bd2c72fa69f9f236`: focused [.NET Evidence Authorization](https://github.com/joefrancisGA/ArchLucid/actions/runs/45355555358) and [Manifest Identity Persistence](https://github.com/joefrancisGA/ArchLucid/actions/runs/45355555405) workflows report success. It remains an unmerged draft.
- Child #7998 original head `878fb42b026f15617b3f1924739f47cdefacf39a`: [focused workflow 45409491956](https://github.com/joefrancisGA/ArchLucid/actions/runs/45409491956) failed compilation: four CS8602 errors in RunArtifacts.cs at lines 41, 234, 292, 358. The nullable tuple return did not let the compiler infer a non-null Summary from a null Rejection.
- Commit `1a64b27ca6c04eae1639972c40510a95b65ec8b6` explicitly requires a non-null summary at all four manifest-ID call sites, retains generic manifest 404 when either resolution fails or summary is missing, and removes the null-forgiving operators. Commit `27818fbdb297f2d1f78917249c5038e1ca8b9d75` adds six strict-mock cases (all four missing-summary routes plus incorrect RunId and ManifestId), ensuring no subsequent detail, artifact or packaging calls. These are authored regressions, not yet verified passes.
- Reviewed the exact child branch production controller, seal helper, and focused test class; this work corrects existing reuse rather than opening a competing PR. No merge, new control family, or full master CI dispatched. Next: inspect the latest child PR checkout's focused workflow and resolve any actual remaining failure before widening the audit; after parent integration, retarget the child and remove its temporary workflow trigger as previously documented.
