using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Replay.
/// </summary>
[Trait("Category", "Slow")]
public sealed class ArchitectureReplayTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ReplayRun_ReexecutesPriorRun()
    {
        string runId = await Replay.CreateAndExecuteAsync("REQ-REPLAY-001");

        HttpResponseMessage replayResponse = await PostReviewReplayAsync(
            runId,
            commitReplay: false,
            manifestVersionOverride: null);

        replayResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        ReplayRunResponseDto? payload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions);
        payload.Should().NotBeNull();
        payload.OriginalRunId.Should().Be(runId);
        payload.ReplayRunId.Should().NotBeNullOrWhiteSpace();
        payload.Results.Should().NotBeEmpty();
        payload.Manifest.Should().BeNull();
    }

    [SkippableFact]
    public async Task ReplayRun_WithCommitReplay_CreatesReplayManifest()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync("REQ-REPLAY-002");
        const string rightVersion = "v1-replay";

        HttpResponseMessage replayResponse = await PostReviewReplayAsync(
            finalized.RunId,
            commitReplay: true,
            manifestVersionOverride: rightVersion);

        replayResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        ReplayRunResponseDto? payload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Manifest.Should().NotBeNull();
        payload.Manifest!.Metadata.ManifestVersion.Should().Be("v1-replay");
        payload.DecisionTraces.Should().NotBeEmpty();
    }
}
