using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture End To End Comparison.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class ArchitectureEndToEndComparisonTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareRunsEndToEndSummary_ReturnsUnifiedSummary()
    {
        (string runId, string replayRunId) = await Replay.CommitAndReplayAsync("REQ-E2E-001");

        HttpResponseMessage response = await Client.PostEndToEndCompareSummaryForTestAsync(
            runId,
            replayRunId,
            JsonContent(new PersistComparisonRequest { Persist = false }));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        EndToEndReplayComparisonSummaryResponse? payload =
            await response.Content.ReadFromJsonAsync<EndToEndReplayComparisonSummaryResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Summary.Should().Contain("# End-to-End Replay Comparison:");
    }
}
