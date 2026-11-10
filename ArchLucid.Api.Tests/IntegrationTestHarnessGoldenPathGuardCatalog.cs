namespace ArchLucid.Api.Tests;

/// <summary>Human-readable catalog for <see cref="IntegrationTestHarnessGoldenPathGuardTests" /> (keep in sync when adding facts).</summary>
internal static class IntegrationTestHarnessGoldenPathGuardCatalog
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
    ];

    internal sealed record HarnessGuardFact(int Number, string Title, string ScannerName);
}
