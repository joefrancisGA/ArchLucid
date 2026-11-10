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
        CommittedReplayPair pair = await Replay.CommitAndReplayAsync("REQ-E2E-001");

        EndToEndReplayComparisonSummaryResponse payload = await (
            await Client.PostEndToEndCompareSummaryForTestAsync(
                pair.RunId,
                pair.ReplayRunId,
                JsonContent(new PersistComparisonRequest { Persist = false })))
            .ReadJsonForTestAsync<EndToEndReplayComparisonSummaryResponse>(JsonOptions);

        payload.Summary.Should().Contain("# End-to-End Replay Comparison:");
    }
}
