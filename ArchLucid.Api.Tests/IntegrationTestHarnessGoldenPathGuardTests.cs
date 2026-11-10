using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
    ///     Single entry point for Api.Tests harness golden-path source-scan guards (<c>Suite=Core</c>, thirty-five scanner facts).
/// </summary>
[Trait("Suite", "Core")]
public sealed class IntegrationTestHarnessGoldenPathGuardTests
{
    internal const string GuardTestDotnetFilter = "FullyQualifiedName~IntegrationTestHarnessGoldenPathGuardTests";

    internal const string DocumentedCoreSuiteDotnetFilter = "dotnet test ArchLucid.Api.Tests --filter Suite=Core";
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
            "use PostExecuteAndEnsureArchitectureVersionPinForTestAsync, ExecuteForTestAsync, or CreateFinalizedRunAsync before finalize helpers.");
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
    public void Harness_tests_do_not_return_task_tuple_run_pairs()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanTupleReturnTypesInHarnessTests().Should().BeEmpty(
            "return FinalizedRun or CommittedReplayPair from IntegrationTestRunLifecycleSupport helpers instead of Task<(string, int)>.");
    }

    [Fact]
    public void Harness_tests_do_not_call_EnsureSuccess_immediately_before_ReadJsonForTestAsync()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanRedundantEnsureSuccessBeforeReadJson().Should().BeEmpty(
            "ReadJsonForTestAsync already asserts success; drop the redundant EnsureSuccessForTestAsync on the line above.");
    }

    [Fact]
    public void Harness_tests_do_not_call_review_replay_outside_replay_protocol_fixtures()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanPostReviewReplayAsyncInHarnessTests().Should().BeEmpty(
            "use CommittedReplayPair replay helpers or OpenCommittedPairAsync instead of ad-hoc PostReviewReplayForTestAsync.");
    }

    [Fact]
    public void IntegrationTestBase_tests_use_pin_aware_execute_helper()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanPostExecuteWithoutPinInIntegrationTestBase().Should().BeEmpty(
            "use PostExecuteAndEnsureArchitectureVersionPinForTestAsync (or ExecuteForTestAsync) on IntegrationTestBase fixtures.");
    }

    [Fact]
    public void IntegrationTestBase_fixtures_use_ExecuteForTestAsync_not_direct_client_pin_execute()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanDirectPinExecuteOnIntegrationTestBase().Should().BeEmpty(
            "use ExecuteForTestAsync on IntegrationTestBase fixtures instead of Client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync.");
    }

    [Fact]
    public void Harness_tests_use_HarnessSkipReasons_for_authority_pipeline_skips()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanDuplicateHarnessSkipReasonLiterals().Should().BeEmpty(
            "use HarnessSkipReasons.AuthorityPipelineCompleteOnCreate* instead of duplicating skip message literals.");
    }

    [Fact]
    public void ReadFromJsonAsync_allowlist_does_not_grow_without_intent()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.CountReadFromJsonAllowlistedSourceFiles().Should()
            .BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxReadFromJsonAllowlistedSourceFiles);
    }

    [Fact]
    public void Harness_tests_do_not_deserialize_problem_details_with_ReadJsonForTestAsync()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanReadJsonForProblemDetailsInHarnessTests().Should().BeEmpty(
            "use AssertProblemForTestAsync for RFC 9457 negative paths.");
    }

    [Fact]
    public void Harness_tests_do_not_assert_status_code_before_ReadJsonForTestAsync()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanStatusCodeAssertionBeforeReadJson().Should().BeEmpty(
            "ReadJsonForTestAsync already asserts success; drop redundant StatusCode.Should().Be(...) on the line above.");
    }

    [Fact]
    public void Harness_tests_do_not_call_FinalizeLifecycleAsync()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanFinalizeLifecycleAsyncUsage().Should().BeEmpty(
            "use ArrangeFinalizedAsync instead of the removed FinalizeLifecycleAsync synonym.");
    }

    [Fact]
    public void IntegrationTestBase_fixtures_use_TestRequestIds_for_CreateFinalizedRunAsync()
    {
        IntegrationTestHarnessGoldenPathGuardAssertionSupport.AssertHarnessGuardEmpty(
            IntegrationTestHarnessGoldenPathGuardSupport.ScanCreateFinalizedRunWithoutTestRequestIdsOnFixtures(),
            27,
            "use ArrangeFinalizedAsync / ArrangeGovernanceCommittedAsync instead of CreateFinalizedRunAsync(variable).");
    }

    [Fact]
    public void Harness_tests_do_not_pass_explicit_Arrange_scenario_arguments()
    {
        IntegrationTestHarnessGoldenPathGuardAssertionSupport.AssertHarnessGuardEmpty(
            IntegrationTestHarnessGoldenPathGuardSupport.ScanExplicitArrangeScenarioArguments(),
            33,
            "Arrange helpers derive scenario from the fixture class; call ArrangeFinalizedAsync() with no arguments.");
    }

    [Fact]
    public void Harness_tests_do_not_use_literal_Idempotency_Key_header_values()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanLiteralIdempotencyHeaderValuesInHarnessTests().Should().BeEmpty(
            "use TestRequestIds.IdempotencyKey(prefix) or CreateArchitectureRequestMessage(body, key).");
    }

    [Fact]
    public void IntegrationTestBase_classes_do_not_also_use_IntegrationTestIsolatedSqlScope()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanIsolatedSqlScopeInsideIntegrationTestBase().Should().BeEmpty(
            "pick IntegrationTestBase (class fixture) or IntegrationTestIsolatedSqlScope.RunAsync — not both in one class.");
    }

    [Fact]
    public void Harness_tests_use_TestRequestIds_for_intake_ids()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanHardcodedRequestIdsInHarnessTests().Should().BeEmpty(
            "replace literal REQ-* ids with TestRequestIds.ForScenario unless the test is verifying a fixed external id.");
    }

    [Fact]
    public void Harness_golden_path_guard_support_documents_allowlisted_paths()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.ScanAllowlistCommentMarkersPresent().Should().BeEmpty(
            "each golden-path allowlist entry in IntegrationTestHarnessGoldenPathGuardSupport must include a harness-allowlist comment.");
    }

    [Fact]
    public void Harness_golden_path_allowlists_do_not_grow_without_intent()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.CountTotalAllowlistedHarnessFiles().Should()
            .BeLessThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MaxHarnessAllowlistedSourceFiles);
    }

    [Fact]
    public void Api_test_fixtures_do_not_repeat_fixture_class_in_ForScenario_nameof()
    {
        IntegrationTestHarnessGoldenPathGuardAssertionSupport.AssertHarnessGuardEmpty(
            IntegrationTestHarnessGoldenPathGuardSupport.ScanRedundantForScenarioNameofOnFixtures(),
            34,
            "Arrange and CreateRunForTestAsync already derive scenario ids from the fixture class.");
    }

    [Fact]
    public void Harness_golden_path_smoke_tests_expose_enough_skippable_facts()
    {
        IntegrationTestHarnessGoldenPathGuardSupport.CountHarnessGoldenPathSmokeSkippableFacts().Should()
            .BeGreaterThanOrEqualTo(IntegrationTestHarnessGoldenPathGuardSupport.MinHarnessGoldenPathSmokeSkippableFacts);
    }

    [Fact]
    public void Guard_catalog_lists_thirty_five_scanners()
    {
        IntegrationTestHarnessGoldenPathGuardCatalog.Facts.Should().HaveCount(35);
    }

    [Fact]
    public void Test_structure_documents_harness_core_and_guard_test_filters()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        string doc = File.ReadAllText(Path.Combine(repoRoot, "docs", "library", "TEST_STRUCTURE.md"));

        doc.Should().Contain(DocumentedCoreSuiteDotnetFilter);
        doc.Should().Contain(GuardTestDotnetFilter);
    }

    [Fact]
    public void Guard_catalog_fact_numbers_are_sequential_and_unique()
    {
        IReadOnlyList<IntegrationTestHarnessGoldenPathGuardCatalog.HarnessGuardFact> facts =
            IntegrationTestHarnessGoldenPathGuardCatalog.Facts;

        facts.Select(static f => f.Number).Should().OnlyHaveUniqueItems().And.BeInAscendingOrder();
        facts.Last().Number.Should().Be(facts.Count);
    }

    [Fact]
    public void Test_structure_documents_public_lifecycle_harness_helpers()
    {
        IntegrationTestHarnessDocumentationGuardSupport.ScanUndocumentedLifecycleHelpers().Should().BeEmpty(
            "add missing IntegrationTestRunLifecycleSupport helpers to docs/library/TEST_STRUCTURE.md.");
    }
}
