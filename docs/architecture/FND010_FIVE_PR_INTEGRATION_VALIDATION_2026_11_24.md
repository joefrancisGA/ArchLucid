# FND-010 five-PR integration candidate and merge-order guard

Date: 2026-11-24
Target: master, via five existing draft PRs. **No merge into master is performed by this candidate**.

## Source PRs

- #7976: artifact decision-receipt and Terraform advisory run-share denial.
- #7968: report ZIP run share-authorization.
- #7969: provenance graph run share-authorization.
- #7978: legacy authority run detail/summary/trail/manifest read aliases (eight guarded methods).
- #7983: manifest-ID lookup with scoped manifest-to-run association, sharing denial, and exact requested-manifest hash / persistence contract.

## Adversarial overlap and synthesis

Each PR independently updated `.github/workflows/fnd010-dotnet-evidence-authorization.yml`. The integration candidate selects the original 13 master classes **plus all six classes** introduced or specially selected by the five PRs: `RunsExportControllerTests`, `ProvenanceControllerTests`, `ArtifactExportSealedManifestRuntimeConflictTests`, `ArtifactExportControllerRunExportTests`, `AuthorityQueryControllerDispositionTests`, and `AuthorityManifestSummaryShareAccessTests`. Missing test-class coverage must not be mistaken for a pass: all of these source files are present in the integrated branch.

#7978 and #7983 both changed `AuthorityQueryController.Trail.cs`, `AuthorityQueryController.SealedManifestGuard.cs`, and the common workflow. Their code was reconciled by retaining #7978's run-read sharing guard on timeline, rationale, provenance and signed-review-record (and its `RunDetail.cs` / eight-case suite), while **retaining #7983's manifest-ID first scoped RunId projection, run-share denial, exact requested/pinned manifest checks, historical manifest support, and manifest persistence regression workflow**.

#7968 and #7969 were synchronized with latest master before combination. They and #7976 only introduce disjoint source/test changes outside the common workflow. No production logic is duplicated or changed in the integration overlay.

## Special attention

1. Run-source disclosure is blocked before downstream read on restricted architectures for all direct run routes.
2. Manifest-ID reads resolve only scoped RunId first, authorize that run, then hydrate the summary and verify the same RunId is still linked (TOCTOU association check).
3. Historical manifest identity checks verify both exact requested manifest and current pinned sealed hash without requiring historical ID == current pinned ID.
4. The `GetManifestSummary` denial returns generic manifest-not-found, not a run-specific error.
5. New manifest SQL projection and in-memory/cache persistence contracts must continue to pass **their separate targeted SQL/persistence workflow**.
6. No broad/full master build is requested or warranted solely for this audit; a PR check is not a successful test until its job status is completed/success.

## User-controlled merge plan

**Preferred PR merge order:** #7976, #7968, #7969, #7978, #7983, and recheck each head and compatibility before moving to the next. #7983 is deliberately an *integration leaf*: it contains branch-to-branch merge ancestry of the other four PRs for combined focused validation. **Do not merge #7983 first unless intentionally merging all five sets of changes together.** After its predecessors merge into master, GitHub should reduce #7983's outstanding diff accordingly, but the final workflow filter union and two controller guards must be retained, verified, and rerun before user-authorized merge.

All five original PRs stay drafts with merge authority reserved for the user.
