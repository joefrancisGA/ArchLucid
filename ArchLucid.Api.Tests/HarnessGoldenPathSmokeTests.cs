using System.Net;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Single ladder smoke: intake → finalize → commit-replay → persist compare → export read (wiring regressions).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class HarnessGoldenPathSmokeTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Golden_path_intake_through_end_to_end_export_markdown()
    {
        CommittedReplayPair pair = await ArrangeCommittedPairAsync();

        PersistedComparison persisted = await pair.PersistEndToEndComparisonForTestAsync(Client);
        persisted.ComparisonRecordId.Should().NotBeNullOrWhiteSpace(); // struct field from PostPersist header

        EndToEndReplayComparisonExportResponse payload = await pair.ReadEndToEndCompareExportMarkdownAsync(Client, JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Content.Should().Contain("# ArchLucid End-to-End Replay Comparison Export");
    }

    [SkippableFact]
    public async Task Golden_path_finalize_governance_and_replay_pair_arrange()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        finalized.RunId.Should().NotBeNullOrWhiteSpace();
        finalized.ManifestVersion.Should().MatchRegex("^v\\d", "committed manifest version should be versioned");

        FinalizedRun governance = await ArrangeGovernanceCommittedAsync();
        governance.RunId.Should().NotBeNullOrWhiteSpace();

        CommittedReplayPair pair = await ArrangeCommittedPairAsync();
        pair.RunId.Should().NotBeNullOrWhiteSpace();
        pair.ReplayRunId.Should().NotBeNullOrWhiteSpace();
    }

    [SkippableFact]
    public async Task Golden_path_unknown_run_summary_returns_problem_details()
    {
        HttpResponseMessage response =
            await Client.GetAuthorityReviewSummaryHttpAsync(HarnessWellKnownGuids.UnknownAuthorityRunForSmoke);

        await response.AssertProblemForTestAsync(HttpStatusCode.NotFound, ProblemTypes.RunNotFound);
    }

    [SkippableFact]
    public async Task Golden_path_demo_baseline_inspect_matches_seeded_finding()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        HttpResponseMessage response =
            await Client.GetFindingInspectHttpAsync(HarnessDemoBaselineSupport.DemoPrimaryFindingId);

        FindingInspectResponse? body = await response.ReadJsonForTestAsync<FindingInspectResponse>(JsonOptions);

        body.FindingId.Should().Be(HarnessDemoBaselineSupport.DemoPrimaryFindingId);
        body.RunId.Should().Be(HarnessDemoBaselineSupport.AuthorityRunId);
    }

    [SkippableFact]
    public async Task Golden_path_arrange_exposes_matching_request_id()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        finalized.RequestId.Should().Be(TestRequestIds.ForScenario(GetType().Name));
        finalized.RunId.Should().NotBeNullOrWhiteSpace();
        finalized.ManifestVersion.Should().MatchRegex("^v\\d");
    }

    [SkippableFact]
    public async Task Golden_path_run_ready_for_execute_exposes_parseable_run_guid()
    {
        CreatedRunForTest created = await RunReadyForExecuteAsync();

        created.RunGuid.Should().NotBe(Guid.Empty);
        created.RequestId.Should().Be(TestRequestIds.ForScenario(GetType().Name));
    }

    [SkippableFact]
    public async Task Golden_path_manifest_summary_title_contains_system_name()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        ManifestMarkdownDocumentResponse summary = await finalized.GetManifestSummaryAsync(Client, JsonOptions);
        summary.Content.Should().Contain($"# Architecture Summary: {finalized.SystemName}");
    }

    [SkippableFact]
    public async Task Golden_path_finalized_run_read_fanout_matches_arrange_identity()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        RunDetailsResponseDto details = await finalized.GetRunDetailsAsync(Client, JsonOptions);
        ManifestMarkdownDocumentResponse summary = await finalized.GetManifestSummaryAsync(Client, JsonOptions);
        RunExportHistoryResponse exports = await finalized.GetExportsHistoryAsync(Client, JsonOptions);
        RunSummaryResponse authoritySummary = await finalized.GetAuthorityRunSummaryAsync(Client, JsonOptions);

        details.Run.RequestId.Should().Be(finalized.RequestId);
        details.Run.RunId.Should().Be(finalized.RunId);
        summary.Content.Should().Contain(finalized.SystemName);
        exports.Exports.Should().NotBeNull();
        authoritySummary.RunId.Should().Be(finalized.RunGuid);

        CursorPagedResponse<RunSummaryResponse> page =
            await finalized.ListAuthorityReviewsForProjectAsync(Client, JsonOptions);
        page.Items.Should().Contain(item => item.RunId == finalized.RunGuid);
    }

    [SkippableFact]
    public async Task Golden_path_markdown_analysis_export_contains_core_sections()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        ArchitectureAnalysisExportResponse export =
            await finalized.PostAnalysisReportMarkdownExportAsync(Client, JsonOptions);

        export.RunId.Should().Be(finalized.RunId);
        export.Content.Should().Contain("## Evidence Package");
        export.Content.Should().Contain("## Architecture Summary");
    }

    [SkippableFact]
    public async Task Golden_path_governance_arrange_exposes_versioned_manifest_and_request_id()
    {
        FinalizedRun governance = await ArrangeGovernanceCommittedAsync();

        governance.RequestId.Should().Be(TestRequestIds.ForScenario(GetType().Name));
        governance.RunId.Should().NotBeNullOrWhiteSpace();
        governance.ManifestVersion.Should().MatchRegex("^v\\d");
    }

    [SkippableFact]
    public async Task Golden_path_committed_replay_opens_from_finalized_request_id()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        CommittedReplayPair pair = await finalized.OpenCommittedReplayPairAsync(Replay);
        pair.RunId.Should().NotBeNullOrWhiteSpace();
        pair.ReplayRunId.Should().NotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData(HarnessWellKnownEncodings.UrlEncodedSpace)]
    [InlineData(HarnessWellKnownEncodings.UrlEncodedTab)]
    public async Task Golden_path_list_reviews_whitespace_project_returns_400_problem(string encodedWhitespaceProjectId)
    {
        HttpResponseMessage response =
            await Client.GetAuthorityProjectReviewsHttpAsync(encodedWhitespaceProjectId, querySuffix: null);

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            detailContains: "projectId");
    }
}
