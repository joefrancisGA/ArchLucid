# FND-010 run comparison share reuse audit — 2026-11-24

## Prior verification and baseline
Both preceding PRs remain open at the time of inspection. #8026 exact head eb8c9e4384ef773def97343ed2e4656ab3fd753e [focused .NET workflow 45448184151](https://github.com/joefrancisGA/ArchLucid/actions/runs/45448184151) completed successfully; #8028 exact head 6de9e647b65e66c43b93d25b899818ca89d6dac4 [focused workflow 45448915163](https://github.com/joefrancisGA/ArchLucid/actions/runs/45448915163) completed successfully. Not merged by this audit.

Branch `audit/fnd010-run-comparison-share-20261124` from master. Reviewed RunComparisonController.cs, Agents.cs, Replay.cs, SealedManifestGuard.cs, RunPairQuery.cs, RunPairQueryValidator.cs, RunPairQueryValidatorTests.cs, CompareRunsApplicationFacade.PairLoad.cs, AnalysisRunIdCanonicalization.cs, EndToEndReplayComparisonService.cs, ArchitectureEndToEndComparisonTests.cs, and ExportsControllerShareAccessTests.cs. Reused previously inspected IArchitectureShareAccessGate and canonical implementation. Indexed master searches for RunComparisonController, RunPairQuery and constructors, plus open PR search for RunComparisonController, found no competing open PR at inspection; not exhaustive branch or external caller coverage. Prior #8026/#8028 concern other controllers; no duplication of their production edits. Python reference control is not a caller in this HTTP path.

## Production paths and findings
Seven actions:
- CompareAgentResults and CompareAgentResultsSummary -> LoadValidatedRunPairAsync -> seal checks -> scoped pair facade -> agent diffs.
- CompareRunsEndToEnd, CompareRunsEndToEndSummary (optional persistence), ExportRunsEndToEndComparisonMarkdown, DownloadRunsEndToEndComparisonMarkdown, ExportRunsEndToEndComparisonDocx -> BuildEndToEndReportAsync -> seal checks -> replay service -> formatter, persistence, download audit/export as applicable.

Both shared helpers validated nonempty/distinct string IDs and then hydrated left/right run data without architecture-specific read authorization. ReadAuthority, Standard tier and additional ExecuteAuthority on summary POST do not enforce per-architecture sharing. Scope, lifecycle, pin, inventory and sealed integrity are complementary, not substitutes. Facade canonicalizes GUID strings and requires scoped GUID headers. Former seal helper skipped malformed GUIDs; downstream attempted hydration before rejecting unresolvable IDs. Source-level omission only, no demonstrated exploit.

## Change
Inject existing DI-registered IArchitectureShareAccessGate. One private pair helper in the existing sealed-manifest partial parses both IDs (retains accepted GUID forms), refuses malformed or all-zero GUIDs with existing run-not-found response, and authorizes both using trusted scope, current User and cancellation before any seal read or facade/service call. Both orchestration paths call that helper after the established request validator. Preserve prior request-validation rules, seal and lifecycle behavior, audit, export, and summary persist authority; no new control family or generalized policy. No change to gate's legacy unlinked-run policy. Early 404 on malformed IDs is intentional fail-closed behavior; no new valid ID formats rejected.

## Tests and CI
19 authored cases in RunComparisonControllerShareAccessTests: 14 route/side denial cases with all downstream dependencies strict (including audit/persistence/formatter); four invalid/empty GUID cases across both shared paths; one strict sequence authorized agent pair test preserving existing facade 404 mapping. The existing focused PR workflow now selects this class and existing RunPairQueryValidatorTests. No claim of compiled or executed pass for this branch yet. Shared workflow filter has independent additions on #8026 and #8028; retain all three sets when resolving integration. No direct master write, full master build dispatch, merge or paid infrastructure.

## Next
Check exact PR-head focused execution. Then audit retrieval scope: run-filtered, manifest-only and unfiltered search paths need distinct authorization reasoning; do not merely add a gate to the optional run filter and assume search is safe. Review explanation endpoints afterward. No repository-wide adoption percentage claim.
