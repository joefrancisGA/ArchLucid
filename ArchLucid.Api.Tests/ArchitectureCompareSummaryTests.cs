using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Compare Summary.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureCompareSummaryTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareManifestsSummary_ReturnsMarkdownSummary()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync(TestRequestIds.ForScenario(nameof(ArchitectureCompareSummaryTests)));
        const string requestedReplayManifestVersion = "v1-replay";

        HttpResponseMessage replayResponse = await Client.PostReviewReplayForTestAsync(Factory, 
            finalized.RunId,
            commitReplay: true,
            manifestVersionOverride: requestedReplayManifestVersion);
                ReplayRunResponseDto? replayPayload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions);
        replayPayload.Should().NotBeNull();
        replayPayload.Manifest.Should().NotBeNull();
        string rightVersion = replayPayload.Manifest!.Metadata.ManifestVersion;
        rightVersion.Should().Be(requestedReplayManifestVersion);

        HttpResponseMessage response = await Client.GetAsync(
            $"/v1/architecture/manifest/compare/summary?leftVersion={Uri.EscapeDataString(finalized.ManifestVersion)}&rightVersion={Uri.EscapeDataString(rightVersion)}");

        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        ManifestCompareSummaryResponse? payload =
            await response.ReadJsonForTestAsync<ManifestCompareSummaryResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Format.Should().Be("markdown");
        payload.Summary.Should().Contain("# Manifest Comparison");
        payload.Diff.LeftManifestVersion.Should().Be(finalized.ManifestVersion);
        payload.Diff.RightManifestVersion.Should().Be(rightVersion);
    }
}
