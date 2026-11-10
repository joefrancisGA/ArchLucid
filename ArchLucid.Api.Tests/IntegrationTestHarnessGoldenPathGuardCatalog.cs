namespace ArchLucid.Api.Tests;

/// <summary>Human-readable catalog for <see cref="IntegrationTestHarnessGoldenPathGuardTests" /> (keep in sync when adding facts).</summary>
public static class IntegrationTestHarnessGoldenPathGuardCatalog
{
    internal static IReadOnlyList<HarnessGuardFact> Facts { get; } =
    [
        new(1, "raw finalize URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawFinalizeUrls)),
        new(2, "raw execute URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawExecuteUrls)),
        new(3, "raw review replay URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawReviewReplayUrls)),
        new(4, "raw architecture request URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawArchitectureRequestUrls)),
        new(5, "hand-rolled intake PostAsync", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanHandRolledIntakePostAsync)),
        new(6, "raw end-to-end compare summary URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawEndToEndCompareSummaryUrls)),
        new(7, "raw end-to-end compare export URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawEndToEndCompareExportUrls)),
        new(8, "PostExecuteUnless before finalize", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanPostExecuteUnlessBeforeFinalize)),
        new(9, "EnsureSuccessStatusCode", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanEnsureSuccessStatusCode)),
        new(10, "private greenfield intake wrappers", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanPrivateGreenfieldIntakeWrappers)),
        new(11, "CommitAndReplay tuple deconstruction", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanCommitAndReplayTupleDeconstruction)),
        new(12, "hand-rolled JsonSerializerOptions", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanHandRolledJsonOptionsInHarnessTests)),
        new(13, "unbootstrapped factory.CreateClient", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanUnbootstrappedCreateClientInHarnessTests)),
        new(14, "FinalizedRun tuple deconstruction", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanFinalizedRunTupleDeconstruction)),
        new(15, "Content.ReadFromJsonAsync in harness", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanReadFromJsonAsyncInHarnessTests)),
        new(16, "harness allowlist growth", nameof(IntegrationTestHarnessGoldenPathGuardSupport.CountTotalAllowlistedHarnessFiles)),
        new(17, "TEST_STRUCTURE lifecycle helper coverage", nameof(IntegrationTestHarnessDocumentationGuardSupport.ScanUndocumentedLifecycleHelpers)),
        new(18, "Task tuple return types in harness", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanTupleReturnTypesInHarnessTests)),
        new(19, "redundant EnsureSuccess before ReadJson", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRedundantEnsureSuccessBeforeReadJson)),
        new(20, "PostReviewReplayAsync outside protocol tests", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanPostReviewReplayAsyncInHarnessTests)),
        new(21, "hardcoded REQ intake ids", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanHardcodedRequestIdsInHarnessTests)),
        new(22, "allowlist comment markers", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanAllowlistCommentMarkersPresent)),
        new(23, "PostExecuteForTestAsync without pin refresh on IntegrationTestBase", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanPostExecuteWithoutPinInIntegrationTestBase)),
        new(24, "StatusCode Should before ReadJsonForTestAsync", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanStatusCodeAssertionBeforeReadJson)),
        new(25, "IntegrationTestIsolatedSqlScope inside IntegrationTestBase", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanIsolatedSqlScopeInsideIntegrationTestBase)),
        new(26, "FinalizeLifecycleAsync synonym", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanFinalizeLifecycleAsyncUsage), "use ArrangeFinalizedAsync"),
        new(27, "CreateFinalizedRunAsync without TestRequestIds", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanCreateFinalizedRunWithoutTestRequestIdsOnFixtures), "use ArrangeFinalizedAsync / ArrangeGovernanceCommittedAsync"),
        new(28, "literal Idempotency-Key header values", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanLiteralIdempotencyHeaderValuesInHarnessTests), "use TestRequestIds.IdempotencyKey(prefix)"),
        new(29, "direct pin execute on IntegrationTestBase fixtures", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanDirectPinExecuteOnIntegrationTestBase), "use ExecuteForTestAsync"),
        new(30, "duplicate harness Skip.If reason literals", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanDuplicateHarnessSkipReasonLiterals), "use HarnessSkipReasons"),
        new(31, "ReadFromJsonAsync allowlist growth", nameof(IntegrationTestHarnessGoldenPathGuardSupport.CountReadFromJsonAllowlistedSourceFiles)),
        new(32, "ReadJsonForTestAsync for ProblemDetails", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanReadJsonForProblemDetailsInHarnessTests), "use AssertProblemForTestAsync"),
        new(33, "explicit Arrange scenario argument", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanExplicitArrangeScenarioArguments), "use ArrangeFinalizedAsync() with no args"),
        new(34, "redundant ForScenario(nameof(fixture))", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRedundantForScenarioNameofOnFixtures), "use ArrangeFinalizedAsync / CreateRunForTestAsync / RunReadyForExecuteAsync"),
        new(35, "HarnessGoldenPathSmokeTests skippable fact count", nameof(IntegrationTestHarnessGoldenPathGuardSupport.CountHarnessGoldenPathSmokeSkippableFacts), "add smoke tests when extending the golden path"),
        new(36, "raw manifest summary URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawManifestSummaryUrlsInHarnessTests), "use FinalizedRun.GetManifestSummaryAsync"),
        new(37, "redundant SystemNameForRequest on arrange records", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRedundantSystemNameForRequestOnHarnessRuns), "use FinalizedRun.SystemName / CreatedRunForTest.SystemName"),
        new(38, "raw architecture review subresource URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawArchitectureReviewSubresourceUrlsInHarnessTests), "use FinalizedRunHarnessExtensions / CreatedRunForTestHarnessExtensions"),
        new(39, "raw architecture review bare GET", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawArchitectureReviewBareGetUrlsInHarnessTests), "use GetRunDetailsAsync / GetRunHttpAsync"),
        new(40, "hand-rolled JsonDocument.Parse", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanHandRolledJsonDocumentParseInHarnessTests), "use ReadJsonForTestAsync / AssertProblemForTestAsync"),
        new(41, "review subresource allowlist growth", nameof(IntegrationTestHarnessGoldenPathGuardSupport.CountReviewSubresourceAllowlistedSourceFiles), "shrink #38 allowlist or add an extension"),
        new(42, "raw authority URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawAuthorityUrlsInHarnessTests), "use AuthorityHarnessExtensions or FinalizedRunHarnessExtensions"),
        new(43, "authority allowlist growth", nameof(IntegrationTestHarnessGoldenPathGuardSupport.CountAuthorityAllowlistedSourceFiles), "shrink #42 allowlist or add an extension"),
        new(44, "JsonDocument allowlist growth", nameof(IntegrationTestHarnessGoldenPathGuardSupport.CountJsonDocumentAllowlistedSourceFiles), "shrink #40 allowlist or migrate to ReadJsonForTestAsync / AssertProblemForTestAsync"),
        new(45, "hardcoded harness unknown run GUID literals", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanHardcodedHarnessUnknownRunGuids), "use HarnessWellKnownGuids"),
        new(46, "CreateArchitectureRunAsync on IntegrationTestBase fixtures", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanCreateArchitectureRunAsyncOnIntegrationTestBaseFixtures), "use ArrangeFinalizedAsync / CreateRunForTestAsync"),
        new(47, "raw canonical /v1/runs URLs", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanRawCanonicalRunsUrlsInHarnessTests), "use RunsHarnessExtensions"),
        new(48, "hardcoded harness foreign tenant literals", nameof(IntegrationTestHarnessGoldenPathGuardSupport.ScanHardcodedHarnessForeignTenantGuids), "use HarnessWellKnownTenants"),
    ];

    public sealed record HarnessGuardFact(int Number, string Title, string ScannerName, string? FixHint = null);
}
