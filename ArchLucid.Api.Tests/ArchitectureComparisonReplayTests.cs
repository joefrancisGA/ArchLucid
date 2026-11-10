using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Comparison Replay.
/// </summary>
[Trait("Category", "Slow")]
public sealed class ArchitectureComparisonReplayTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ReplayComparison_RecreatesPersistedEndToEndComparisonAsMarkdown()
    {
        CommittedReplayPair pair = await Replay.CommitAndReplayAsync("REQ-COMP-REPLAY-001");
        string comparisonRecordId = await Replay.PersistEndToEndComparisonAsync(pair.RunId, pair.ReplayRunId);

        HttpResponseMessage replayComparisonResponse = await PostComparisonReplayAsync(comparisonRecordId);

        replayComparisonResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        replayComparisonResponse.Content.Headers.ContentType!.MediaType
            .Should().Be("text/markdown");

        string content = await replayComparisonResponse.Content.ReadAsStringAsync();
        content.Should().Contain("# ArchLucid End-to-End Replay Comparison Export");
    }
}
