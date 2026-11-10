using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Single entry point for Api.Tests harness golden-path source-scan guards (<c>Suite=Core</c>, seventeen facts).
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestHarnessGoldenPathGuardTests
{
    [Fact]
    public void Api_test_sources_do_not_embed_raw_finalize_urls()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanRawFinalizeUrls().Should().BeEmpty(
            "use PostFinalizeForTestAsync, FinalizeReviewRelativeUrl, or CreateFinalizeReviewRequest instead of embedding the finalize path.");
    }

    [Fact]
    public void Api_test_sources_do_not_embed_raw_execute_urls()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanRawExecuteUrls().Should().BeEmpty(
            "use PostExecuteForTestAsync, ExecuteReviewRelativeUrl, or CreateExecuteReviewRequest instead of embedding the execute path.");
    }

    [Fact]
    public void Api_test_sources_do_not_embed_raw_review_replay_urls()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanRawReviewReplayUrls().Should().BeEmpty(
            "use PostReviewReplayForTestAsync, ReplayReviewRelativeUrl, or CreateReviewReplayRequest instead of embedding the review replay path.");
    }

    [Fact]
    public void Api_test_sources_do_not_embed_raw_architecture_request_urls()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanRawArchitectureRequestUrls().Should().BeEmpty(
            "use PostArchitectureRequestForTestAsync, CreateArchitectureRequestMessage, CreateArchitectureRunForTestAsync, or CreateFinalizedRunAsync instead of embedding the intake path.");
    }

    [Fact]
    public void Api_test_sources_do_not_hand_roll_intake_PostAsync_with_relative_url_constant()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanHandRolledIntakePostAsync().Should().BeEmpty(
            "use PostArchitectureRequestForTestAsync or CreateFinalizedRunAsync instead of PostAsync(IntegrationTestRunLifecycleSupport.ArchitectureRequestRelativeUrl, …).");
    }

    [Fact]
    public void Api_test_sources_do_not_embed_raw_end_to_end_compare_summary_urls()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanRawEndToEndCompareSummaryUrls().Should().BeEmpty(
            "use EndToEndCompareSummaryRelativeUrl, PostEndToEndCompareSummaryForTestAsync, or PostPersistEndToEndComparisonForTestAsync.");
    }

    [Fact]
    public void Api_test_sources_do_not_embed_raw_end_to_end_compare_export_urls()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanRawEndToEndCompareExportUrls().Should().BeEmpty(
            "use EndToEndCompareExportMarkdownRelativeUrl, GetEndToEndCompareExportMarkdownForTestAsync, or related export helpers.");
    }

    [Fact]
    public void Api_test_sources_do_not_pair_post_execute_unless_with_finalize_setup()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanPostExecuteUnlessBeforeFinalize().Should().BeEmpty(
            "use PostExecuteAndEnsureArchitectureVersionPinForTestAsync, PostExecuteWithPinsAsync, or CreateFinalizedRunAsync before finalize helpers.");
    }

    [Fact]
    public void Api_test_sources_prefer_EnsureSuccessForTestAsync_over_EnsureSuccessStatusCode()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanEnsureSuccessStatusCode().Should().BeEmpty(
            "use EnsureSuccessForTestAsync so CI logs include response bodies when setup HTTP calls fail.");
    }

    [Fact]
    public void Api_test_sources_do_not_define_private_PostArchitectureRequestAsync_wrappers()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanPrivateGreenfieldIntakeWrappers().Should().BeEmpty(
            "use client.PostGreenfieldArchitectureRequestForTestAsync(body, idempotencyKeyPrefix) instead of duplicating greenfield intake helpers.");
    }

    [Fact]
    public void Api_test_sources_do_not_destructure_CommitAndReplayAsync_into_anonymous_tuples()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanCommitAndReplayTupleDeconstruction().Should().BeEmpty(
            "assign CommitAndReplayAsync to CommittedReplayPair and use pair.RunId / pair.ReplayRunId.");
    }

    [Fact]
    public void Harness_tests_do_not_hand_roll_JsonSerializerOptions_instead_of_CreateApiJsonOptions()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanHandRolledJsonOptionsInHarnessTests().Should().BeEmpty(
            "use IntegrationTestBase.CreateApiJsonOptions() for lifecycle and replay harness tests (allowlist only for special encoders).");
    }

    [Fact]
    public void Harness_tests_do_not_use_factory_CreateClient_without_sql_bootstrap()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanUnbootstrappedCreateClientInHarnessTests().Should().BeEmpty(
            "use IntegrationTestSqlClientBootstrap, IntegrationTestIsolatedSqlScope.RunAsync, or IntegrationTestBase instead of factory.CreateClient() for lifecycle harness tests.");
    }

    [Fact]
    public void Harness_tests_do_not_destructure_CreateFinalizedRunAsync_or_CreateCommittedRunAsync()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanFinalizedRunTupleDeconstruction().Should().BeEmpty(
            "assign CreateFinalizedRunAsync / CreateCommittedRunAsync to FinalizedRun and use .RunId / .ManifestVersion.");
    }

    [Fact]
    public void Harness_tests_do_not_use_Content_ReadFromJsonAsync()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanReadFromJsonAsyncInHarnessTests().Should().BeEmpty(
            "use HttpResponseMessage.ReadJsonForTestAsync after EnsureSuccessForTestAsync (or rely on ReadJsonForTestAsync for both).");
    }

    [Fact]
    public void Harness_golden_path_allowlists_do_not_grow_without_intent()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.CountTotalAllowlistedHarnessFiles().Should()
            .BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxHarnessAllowlistedSourceFiles);
    }

    [Fact]
    public void Guard_catalog_lists_seventeen_scanners()
    {
        IntegrationTestHarnessGoldenPathGuardCatalog.Facts.Should().HaveCount(17);
    }

    [Fact]
    public void Test_structure_documents_public_lifecycle_harness_helpers()
    {
        IntegrationTestHarnessDocumentationGuardSupport.ScanUndocumentedLifecycleHelpers().Should().BeEmpty(
            "add missing IntegrationTestRunLifecycleSupport helpers to docs/library/TEST_STRUCTURE.md.");
    }
}
