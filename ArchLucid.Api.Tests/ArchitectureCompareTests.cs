using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Compare.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureCompareTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareManifests_ReturnsDiff()
    {
        (string runId, string leftVersion) = await CreateFinalizedRunAsync("REQ-COMPARE-001");
        const string requestedReplayManifestVersion = "v1-replay";

        HttpResponseMessage replayResponse = await PostReviewReplayAsync(
            runId,
            commitReplay: true,
            manifestVersionOverride: requestedReplayManifestVersion);

        await replayResponse.EnsureSuccessForTestAsync();
        ReplayRunResponseDto? replayPayload =
            await replayResponse.Content.ReadFromJsonAsync<ReplayRunResponseDto>(JsonOptions);
        replayPayload.Should().NotBeNull();
        replayPayload.Manifest.Should().NotBeNull();
        string rightVersion = replayPayload.Manifest!.Metadata.ManifestVersion;
        rightVersion.Should().Be(requestedReplayManifestVersion);

        HttpResponseMessage compareResponse = await Client.GetAsync(
            $"/v1/architecture/manifest/compare?leftVersion={Uri.EscapeDataString(leftVersion)}&rightVersion={Uri.EscapeDataString(rightVersion)}");

        compareResponse.StatusCode.Should().Be(HttpStatusCode.OK, await compareResponse.Content.ReadAsStringAsync());

        ManifestCompareResponse? payload =
            await compareResponse.Content.ReadFromJsonAsync<ManifestCompareResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Diff.Should().NotBeNull();
        payload.Diff.LeftManifestVersion.Should().Be(leftVersion);
        payload.Diff.RightManifestVersion.Should().Be(rightVersion);
    }
}
