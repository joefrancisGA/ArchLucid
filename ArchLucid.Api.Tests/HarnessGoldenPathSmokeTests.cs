using System.Net;

using ArchLucid.Api.Models;

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
        Guid missing = Guid.Parse("00000000-0000-0000-0000-00000000cc03");
        HttpResponseMessage response = await Client.GetAsync($"/v1/authority/reviews/{missing:D}/summary");

        await response.AssertProblemForTestAsync(HttpStatusCode.NotFound, ProblemTypes.RunNotFound);
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
    public async Task Golden_path_run_details_echoes_arrange_request_id()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        RunDetailsResponseDto details = await finalized.GetRunDetailsAsync(Client, JsonOptions);
        details.Run.RequestId.Should().Be(finalized.RequestId);
        details.Manifest.Should().NotBeNull();
        details.Manifest!.SystemName.Should().Be(finalized.SystemName);
    }

    [Theory]
    [InlineData("%20")]
    [InlineData("%09")]
    public async Task Golden_path_list_reviews_whitespace_project_returns_400_problem(string encodedWhitespaceProjectId)
    {
        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/projects/{encodedWhitespaceProjectId}/reviews");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            detailContains: "projectId");
    }
}
