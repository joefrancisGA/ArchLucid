using System.Net;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Agent Compare.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureAgentCompareTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareAgentResultsSummary_ReturnsMarkdown()
    {
        string runId = await CreateArchitectureRunAsync(TestRequestIds.ForScenario(nameof(ArchitectureAgentCompareTests)));

        await PostExecuteWithPinsAsync(runId);

        string replayRunId = await Replay.ReplayWithoutCommitAsync(runId);

        HttpResponseMessage compareResponse = await Client.GetAsync(
            $"/v1/architecture/review/compare/agents/summary?leftRunId={runId}&rightRunId={replayRunId}");

        compareResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        AgentResultCompareSummaryResponse payload =
            await compareResponse.ReadJsonForTestAsync<AgentResultCompareSummaryResponse>(JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Summary.Should().Contain("# Agent Result Comparison");
        payload.Diff.LeftRunId.Should().Be(runId);
        payload.Diff.RightRunId.Should().Be(replayRunId);
    }
}
